from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional, Dict
import base64
import requests
import unicodedata
import json
import os
import uuid
import asyncio
from datetime import datetime

from backend.database import Base, engine, get_db, SessionLocal
from backend.models import User, Product, Order, OrderItem, UserRole, OrderStatus, Favorite, Review, Message
from backend.schemas import UserCreate, UserLogin, UserUpdate, UserOut, Token, ProductCreate, ProductUpdate, ProductOut, OrderCreate, OrderOut, sanitize_attributes, ReviewCreate, ReviewOut, ReviewWithUserOut, MessageCreate, MessageOut
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user, require_admin, SECRET_KEY, ALGORITHM
from jose import jwt
from backend import email_service
from backend import receipt_service
from backend.timezone_utils import now_moz
from fastapi.responses import FileResponse

Base.metadata.create_all(bind=engine)

def _ensure_user_columns():
    try:
        with engine.connect() as conn:
            cols = set(row[1] for row in conn.execute(text("PRAGMA table_info(users)")))
            desired = [
                ("phone", "TEXT"),
                ("country", "TEXT"),
                ("state", "TEXT"),
                ("city", "TEXT"),
                ("street", "TEXT"),
                ("number", "TEXT"),
                ("reference", "TEXT"),
                ("avatar_url", "TEXT"),
            ]
            for col, coltype in desired:
                if col not in cols:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {coltype}"))
    except Exception:

        pass


def _ensure_product_columns():
    try:
        with engine.connect() as conn:
            cols = set(row[1] for row in conn.execute(text("PRAGMA table_info(products)")))
            if 'image_urls_json' not in cols:
                conn.execute(text("ALTER TABLE products ADD COLUMN image_urls_json TEXT"))
            if 'size_images_json' not in cols:
                conn.execute(text("ALTER TABLE products ADD COLUMN size_images_json TEXT"))
            if 'size_colors_json' not in cols:
                conn.execute(text("ALTER TABLE products ADD COLUMN size_colors_json TEXT"))
            if 'size_stock_json' not in cols:
                conn.execute(text("ALTER TABLE products ADD COLUMN size_stock_json TEXT"))
    except Exception:
   
        pass

_ensure_user_columns()
_ensure_product_columns()

# Ensure reviews/messages tables exist
try:
    Review.__table__.create(bind=engine, checkfirst=True)
    Message.__table__.create(bind=engine, checkfirst=True)
    # Adiciona coluna from_card se não existir (SQLite)
    with engine.connect() as conn:
        try:
            cols = set(row[1] for row in conn.execute(text("PRAGMA table_info(messages)")))
            if 'from_card' not in cols:
                conn.execute(text("ALTER TABLE messages ADD COLUMN from_card INTEGER NOT NULL DEFAULT 0"))
        except Exception:
            pass
except Exception:
    pass

app = FastAPI(title="SwiftShop API", version="1.0.0")
# PayPal config (set environment variables or default dev placeholders)
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.environ.get("PAYPAL_CLIENT_SECRET", "")
PAYPAL_BASE = os.environ.get("PAYPAL_BASE", "https://api-m.sandbox.paypal.com")

def _paypal_get_access_token() -> str:
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="PayPal não configurado")
    auth = (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    res = requests.post(f"{PAYPAL_BASE}/v1/oauth2/token", data={"grant_type": "client_credentials"}, auth=auth, timeout=20)
    if res.status_code >= 400:
        raise HTTPException(status_code=500, detail="Falha ao obter token do PayPal")
    return res.json().get("access_token")

@app.post("/payments/paypal/create")
def paypal_create_order(total_value: float):
    token = _paypal_get_access_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {
        "intent": "CAPTURE",
        "purchase_units": [
            {"amount": {"currency_code": "USD", "value": f"{total_value:.2f}"}}
        ]
    }
    res = requests.post(f"{PAYPAL_BASE}/v2/checkout/orders", headers=headers, json=body, timeout=20)
    if res.status_code >= 400:
        raise HTTPException(status_code=500, detail="Falha ao criar ordem no PayPal")
    return res.json()

@app.post("/payments/paypal/capture/{order_id}")
def paypal_capture_order(order_id: str):
    token = _paypal_get_access_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    res = requests.post(f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture", headers=headers, timeout=20)
    if res.status_code >= 400:
        raise HTTPException(status_code=500, detail="Falha ao capturar ordem no PayPal")
    return res.json()

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Static files for uploads
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


def _product_to_out(p: Product) -> ProductOut:
	attrs: Optional[dict] = None
	if p.attributes_json:
		try:
			attrs = json.loads(p.attributes_json)
		except Exception:
			attrs = None
	
	# Parse image_urls from JSON
	image_urls: Optional[List[str]] = None
	if p.image_urls_json:
		try:
			image_urls = json.loads(p.image_urls_json)
		except Exception:
			image_urls = None
	
	# Parse size_images from JSON - handle both old format (string) and new format (array)
	size_images: Optional[Dict[str, List[str]]] = None
	if p.size_images_json:
		try:
			raw_size_images = json.loads(p.size_images_json)
			# Handle migration from old format (Dict[str, str]) to new format (Dict[str, List[str]])
			if isinstance(raw_size_images, dict):
				size_images = {}
				for size, value in raw_size_images.items():
					if isinstance(value, list):
						# New format - already a list
						size_images[size] = value
					elif isinstance(value, str):
						# Old format - convert single string to list
						size_images[size] = [value]
			else:
				size_images = None
		except Exception:
			size_images = None
	
	# Parse size_colors from JSON
	size_colors: Optional[Dict[str, List[str]]] = None
	if p.size_colors_json:
		try:
			raw_size_colors = json.loads(p.size_colors_json)
			# Migração: converter strings únicas para arrays
			if isinstance(raw_size_colors, dict):
				size_colors = {}
				for size, colors in raw_size_colors.items():
					if isinstance(colors, str):
						# Formato antigo: string única -> converter para array
						size_colors[size] = [colors]
					elif isinstance(colors, list):
						# Formato novo: já é array
						size_colors[size] = colors
					else:
						size_colors[size] = []
			else:
				size_colors = None
		except Exception:
			size_colors = None
	
	# Parse size_stock from JSON
	size_stock: Optional[Dict[str, int]] = None
	if p.size_stock_json:
		try:
			size_stock = json.loads(p.size_stock_json)
		except Exception:
			size_stock = None
	
	return ProductOut(
		id=p.id,
		name=p.name,
		price=p.price,
		description=p.description,
		image_url=p.image_url,
		image_urls=image_urls,
		size_images=size_images,
		size_colors=size_colors,
		size_stock=size_stock,
		category=p.category,
		stock=p.stock,
		main_category=p.main_category,
		sub_category=p.sub_category,
		attributes=attrs,
	)


# Upload endpoint
@app.post("/upload")
def upload_image(file: UploadFile = File(...)):
	filename = f"{uuid.uuid4().hex}_{file.filename}"
	path = os.path.join(UPLOAD_DIR, filename)
	with open(path, 'wb') as f:
		f.write(file.file.read())
	url = f"/uploads/{filename}"
	return {"url": url}


# Auth
@app.post("/auth/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
	existing = db.query(User).filter(User.email == user_in.email).first()
	if existing:
		raise HTTPException(status_code=400, detail="Email já cadastrado")
	user = User(
		name=user_in.name,
		email=user_in.email,
		password_hash=get_password_hash(user_in.password),
		role=user_in.role,
		avatar_url=user_in.avatar_url,
		phone=user_in.phone,
		country=user_in.country,
		state=user_in.state,
		city=user_in.city,
		street=user_in.street,
		number=user_in.number,
		reference=user_in.reference,
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return user


@app.post("/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
	user = db.query(User).filter(User.email == credentials.email).first()
	if not user or not verify_password(credentials.password, user.password_hash):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
	token = create_access_token({"sub": str(user.id), "role": user.role})
	return Token(access_token=token, role=user.role, user_id=user.id)


@app.get("/auth/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
	return current


@app.put("/auth/me", response_model=UserOut)
def update_me(
    user_update: UserUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualizar perfil do usuário autenticado"""
    # Atualizar apenas os campos fornecidos (não None)
    update_data = user_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current, field, value)
    
    db.add(current)
    db.commit()
    db.refresh(current)
    return current


# Products
@app.post("/products", response_model=ProductOut, dependencies=[Depends(require_admin)])
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
	attrs = sanitize_attributes(product_in.main_category, product_in.sub_category, product_in.attributes)
	
	# Handle multiple images
	image_urls_json = None
	if product_in.image_urls:
		image_urls_json = json.dumps(product_in.image_urls)
	
	# Handle size images
	size_images_json = None
	if product_in.size_images:
		size_images_json = json.dumps(product_in.size_images)
	
	# Handle size colors
	size_colors_json = None
	if product_in.size_colors:
		size_colors_json = json.dumps(product_in.size_colors)
	
	# Handle size stock
	size_stock_json = None
	if product_in.size_stock:
		size_stock_json = json.dumps(product_in.size_stock)
	
	product = Product(
		name=product_in.name,
		price=product_in.price,
		description=product_in.description,
		image_url=product_in.image_url,
		image_urls_json=image_urls_json,
		size_images_json=size_images_json,
		size_colors_json=size_colors_json,
		size_stock_json=size_stock_json,
		category=product_in.category,
		stock=product_in.stock,
		main_category=product_in.main_category,
		sub_category=product_in.sub_category,
		attributes_json=json.dumps(attrs) if attrs else None,
	)
	db.add(product)
	db.commit()
	db.refresh(product)
	return _product_to_out(product)


@app.get("/products", response_model=List[ProductOut])
def list_products(q: str = "", main_category: str = "", sub_category: str = "", db: Session = Depends(get_db)):
	def _norm(s: Optional[str]) -> str:
		if not s:
			return ""
		n = unicodedata.normalize('NFD', s)
		return ''.join(ch for ch in n if unicodedata.category(ch) != 'Mn').lower()

	query = db.query(Product)
	if q:
		query = query.filter(Product.name.ilike(f"%{q}%"))
	items = query.order_by(Product.name.asc()).all()

	if main_category:
		mc = _norm(main_category)
		# Se main_category for "Vestuário", também buscar produtos com main_category None mas sub_category preenchida
		if mc == "vestuario":
			items = [p for p in items if (_norm(p.main_category) == mc or (p.main_category is None and p.sub_category))]
		else:
			items = [p for p in items if _norm(p.main_category) == mc]
	if sub_category:
		sc = _norm(sub_category)
		items = [p for p in items if _norm(p.sub_category) == sc]

	return [_product_to_out(p) for p in items]


@app.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
	product = db.get(Product, product_id)
	if not product:
		raise HTTPException(status_code=404, detail="Produto não encontrado")
	return _product_to_out(product)


# Reviews endpoints
@app.get("/products/{product_id}/reviews", response_model=List[ReviewWithUserOut])
def list_reviews(product_id: int, db: Session = Depends(get_db)):
    rows = db.query(Review, User).join(User, User.id == Review.user_id).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()
    out: List[ReviewWithUserOut] = []
    for r, u in rows:
        out.append(ReviewWithUserOut(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            user_name=u.name,
        ))
    return out


@app.post("/products/{product_id}/reviews", response_model=ReviewOut)
def create_review(product_id: int, review_in: ReviewCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # allow only clients to review
    if current.role != UserRole.client:
        raise HTTPException(status_code=403, detail="Apenas clientes podem avaliar")
    if not db.get(Product, product_id):
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    review = Review(product_id=product_id, user_id=current.id, rating=review_in.rating, comment=review_in.comment)
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


# Support chat (basic REST)
@app.get("/support/messages", response_model=List[MessageOut])
def list_messages(
    order_id: Optional[int] = None,
    user_id: Optional[int] = None,
    limit: int = 50,
    after_id: Optional[int] = None,
    before_id: Optional[int] = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Message)
    if current.role == UserRole.client:
        q = q.filter(Message.user_id == current.id)
    else:
        if user_id is not None:
            q = q.filter(Message.user_id == user_id)
        # Admin não vê mensagens automáticas de card
        q = q.filter(Message.from_card == 0)
    if order_id is not None:
        q = q.filter(Message.order_id == order_id)
    if after_id is not None:
        q = q.filter(Message.id > after_id)
    if before_id is not None:
        q = q.filter(Message.id < before_id)
    limit = max(1, min(limit, 200))
    return q.order_by(Message.created_at.asc()).limit(limit).all()


@app.post("/support/messages", response_model=MessageOut)
def send_message(msg: MessageCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Admin can send to a specific user via target_user_id
    if current.role == UserRole.admin and msg.target_user_id:
        row = Message(user_id=msg.target_user_id, order_id=msg.order_id, from_role=UserRole.admin.value, text=msg.text, from_card=0)
    else:
        row = Message(user_id=current.id, order_id=msg.order_id, from_role=(current.role.value if hasattr(current.role, 'value') else str(current.role)), text=msg.text, from_card=1 if msg.auto_reply_text else 0)
    db.add(row)
    db.commit()
    db.refresh(row)
    # Resposta automática quando cliente envia via card
    if current.role == UserRole.client and msg.auto_reply_text:
        auto = Message(user_id=current.id, order_id=msg.order_id, from_role=UserRole.admin.value, text=msg.auto_reply_text, from_card=1)
        db.add(auto)
        db.commit()
        db.refresh(auto)
    return row


# WebSocket removido: o chat de suporte agora funciona apenas via REST


@app.put("/products/{product_id}", response_model=ProductOut, dependencies=[Depends(require_admin)])
def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
	product = db.get(Product, product_id)
	if not product:
		raise HTTPException(status_code=404, detail="Produto não encontrado")
	for field, value in product_in.dict(exclude_unset=True).items():
		if field == 'attributes':
			sanitized = sanitize_attributes(product_in.main_category or product.main_category, product_in.sub_category or product.sub_category, value)
			setattr(product, 'attributes_json', json.dumps(sanitized) if sanitized is not None else None)
		elif field == 'image_urls':
			setattr(product, 'image_urls_json', json.dumps(value) if value is not None else None)
		elif field == 'size_images':
			setattr(product, 'size_images_json', json.dumps(value) if value is not None else None)
		elif field == 'size_colors':
			setattr(product, 'size_colors_json', json.dumps(value) if value is not None else None)
		elif field == 'size_stock':
			setattr(product, 'size_stock_json', json.dumps(value) if value is not None else None)
		else:
			setattr(product, field, value)
	db.commit()
	db.refresh(product)
	return _product_to_out(product)


@app.delete("/products/{product_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_product(product_id: int, db: Session = Depends(get_db)):
	product = db.get(Product, product_id)
	if not product:
		raise HTTPException(status_code=404, detail="Produto não encontrado")
	db.delete(product)
	db.commit()
	return None


# Orders
@app.post("/orders", response_model=OrderOut)
async def create_order(order_in: OrderCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
	if current.role != UserRole.client:
		raise HTTPException(status_code=403, detail="Apenas clientes podem criar pedidos")
	order = Order(user_id=current.id, status=OrderStatus.pending)
	db.add(order)
	db.flush()
	
	items_data = []
	subtotal = 0.0
	
	for item in order_in.items:
		product = db.get(Product, item.product_id)
		if not product or product.stock < item.quantity:
			raise HTTPException(status_code=400, detail=f"Estoque insuficiente para o produto {item.product_id}")
		order_item = OrderItem(order_id=order.id, product_id=product.id, quantity=item.quantity, unit_price=product.price)
		product.stock -= item.quantity
		db.add(order_item)
		
		# Coletar dados para o email
		item_total = product.price * item.quantity
		subtotal += item_total
		items_data.append({
			'product_name': product.name,
			'quantity': item.quantity,
			'price': item_total,
			'size': getattr(item, 'size', None),
			'color': getattr(item, 'color', None)
		})
	
	db.commit()
	db.refresh(order)
	
	# Calcular total (você pode adicionar taxa de envio aqui)
	shipping_cost = 50.0  # Taxa de envio fixa (pode ser dinâmica)
	total = subtotal + shipping_cost
	
	# Preparar endereço
	shipping_address = f"{current.street or ''}, {current.number or ''}, {current.city or ''}, {current.state or ''}, {current.country or ''}"
	
	# Enviar emails em background (não bloqueia a resposta)
	async def send_emails_background():
		try:
			# Email para o cliente
			await email_service.send_new_order_email_to_customer(
				customer_email=current.email,
				customer_name=current.name,
				order_id=order.id,
				order_date=order.created_at,
				payment_method="M-Pesa",  # Pode ser dinâmico
				shipping_address=shipping_address,
				items=items_data,
				subtotal=subtotal,
				shipping_cost=shipping_cost,
				total=total
			)
			
			# Email para o admin
			await email_service.send_new_order_email_to_admin(
				order_id=order.id,
				customer_name=current.name,
				customer_email=current.email,
				customer_phone=current.phone or "Não informado",
				order_date=order.created_at,
				payment_method="M-Pesa",
				shipping_address=shipping_address,
				items=items_data,
				subtotal=subtotal,
				shipping_cost=shipping_cost,
				total=total
			)
		except Exception as e:
			# Logs do erro mas não bloqueia a criação do pedido
			print(f"Erro ao enviar emails: {str(e)}")
	
	# Criar tarefa em background sem aguardar
	asyncio.create_task(send_emails_background())
	
	return order


@app.get("/orders", response_model=List[OrderOut])
def list_my_orders(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
	if current.role == UserRole.admin:
		return db.query(Order).order_by(Order.created_at.desc()).all()
	return db.query(Order).filter(Order.user_id == current.id).order_by(Order.created_at.desc()).all()


@app.get("/orders/{order_id}/receipt")
def download_receipt(order_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
	"""Gera e retorna o recibo em PDF de um pedido"""
	order = db.get(Order, order_id)
	
	if not order:
		raise HTTPException(status_code=404, detail="Pedido não encontrado")
	
	# Verificar permissão: cliente só pode baixar seus próprios recibos
	if current.role != UserRole.admin and order.user_id != current.id:
		raise HTTPException(status_code=403, detail="Sem permissão para acessar este recibo")
	
	# Preparar dados dos itens
	items_data = []
	subtotal = 0.0
	
	for order_item in order.items:
		item_total = order_item.unit_price * order_item.quantity
		subtotal += item_total
		
		items_data.append({
			'product_name': order_item.product.name,
			'quantity': order_item.quantity,
			'unit_price': order_item.unit_price,
			'total_price': item_total,
			'size': None,  # TODO: adicionar tamanho e cor ao OrderItem
			'color': None
		})
	
	# Calcular total
	shipping_cost = 50.0  # Taxa fixa (pode ser dinâmica)
	total = subtotal + shipping_cost
	
	# Preparar endereço
	user = order.user
	shipping_address = f"{user.street or ''}, {user.number or ''}, {user.city or ''}, {user.state or ''}, {user.country or ''}".strip(', ')
	if not shipping_address:
		shipping_address = "Endereço não informado"
	
	# Caminho do arquivo PDF
	pdf_filename = f"recibo_pedido_{order.id}.pdf"
	pdf_path = os.path.join("backend", "receipts", pdf_filename)
	
	# Gerar o PDF
	try:
		receipt_service.generate_receipt_pdf(
			order_id=order.id,
			order_date=order.created_at,
			customer_name=user.name,
			customer_email=user.email,
			customer_phone=user.phone or "Não informado",
			shipping_address=shipping_address,
			payment_method="M-Pesa",  # Pode ser dinâmico
			items=items_data,
			subtotal=subtotal,
			shipping_cost=shipping_cost,
			total=total,
			output_path=pdf_path
		)
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Erro ao gerar recibo: {str(e)}")
	
	# Retornar o arquivo PDF
	return FileResponse(
		pdf_path,
		media_type='application/pdf',
		filename=pdf_filename,
		headers={"Content-Disposition": f"attachment; filename={pdf_filename}"}
	)


@app.put("/orders/{order_id}/status", response_model=OrderOut, dependencies=[Depends(require_admin)])
async def update_order_status(order_id: int, status_value: OrderStatus, db: Session = Depends(get_db)):
	order = db.get(Order, order_id)
	if not order:
		raise HTTPException(status_code=404, detail="Pedido não encontrado")
	
	old_status = order.status
	order.status = status_value
	db.commit()
	db.refresh(order)
	
	# Se o status mudou, enviar email apropriado em background
	if old_status != status_value:
		# Preparar dados dos itens
		items_data = []
		for order_item in order.items:
			items_data.append({
				'product_name': order_item.product.name,
				'quantity': order_item.quantity,
				'price': order_item.unit_price * order_item.quantity,
				'size': None,  # TODO: adicionar tamanho e cor ao OrderItem
				'color': None
			})
		
		# Preparar endereço
		user = order.user
		shipping_address = f"{user.street or ''}, {user.number or ''}, {user.city or ''}, {user.state or ''}, {user.country or ''}"
		
		# Função para enviar email em background
		async def send_status_email_background():
			try:
				# Enviar email baseado no novo status
				if status_value == OrderStatus.processing:
					await email_service.send_order_processing_email(
						customer_email=user.email,
						customer_name=user.name,
						order_id=order.id,
						order_date=order.created_at,
						items=items_data
					)
				elif status_value == OrderStatus.shipped:
					await email_service.send_order_shipped_email(
						customer_email=user.email,
						customer_name=user.name,
						order_id=order.id,
						shipping_address=shipping_address,
						shipping_date=now_moz(),
						items=items_data,
						tracking_code=f"SW{order.id:06d}",  # Código de rastreamento gerado
						estimated_delivery="3-5 dias úteis"
					)
				elif status_value == OrderStatus.delivered:
					await email_service.send_order_delivered_email(
						customer_email=user.email,
						customer_name=user.name,
						order_id=order.id,
						delivery_date=now_moz(),
						shipping_address=shipping_address,
						items=items_data,
						received_by=user.name
					)
			except Exception as e:
				# Log do erro mas não bloqueia a atualização
				print(f"Erro ao enviar email de atualização de status: {str(e)}")
		
		# Criar tarefa em background sem aguardar
		asyncio.create_task(send_status_email_background())
	
	return order


@app.delete("/orders/{order_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_order(order_id: int, db: Session = Depends(get_db)):
	order = db.get(Order, order_id)
	if not order:
		raise HTTPException(status_code=404, detail="Pedido não encontrado")
	db.delete(order)
	db.commit()
	return None


# Users (admin)
@app.get("/users", response_model=List[UserOut], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
	return db.query(User).order_by(User.name.asc()).all()


@app.post("/users/admin", response_model=UserOut, dependencies=[Depends(require_admin)])
def create_admin(user_in: UserCreate, db: Session = Depends(get_db)):
	user_in.role = UserRole.admin
	return register(user_in, db)


@app.delete("/users/{user_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
	user = db.get(User, user_id)
	if not user:
		raise HTTPException(status_code=404, detail="Usuário não encontrado")
	db.delete(user)
	db.commit()
	return None


# Reports (admin)
@app.get("/admin/reports")
def admin_reports(days: int = 30, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    if current.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Apenas admin")
    days = max(1, min(days, 365))
    # Totais básicos
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    # Receita bruta somando itens
    total_revenue = db.query(func.coalesce(func.sum(OrderItem.unit_price * OrderItem.quantity), 0)).scalar() or 0.0
    # Por dia (últimos 30 dias)
    try:
        rows = db.query(
            func.date(Order.created_at).label('d'),
            func.count(Order.id).label('orders')
        ).filter(Order.created_at >= text(f"date('now','-{days} day')"))
        rows = rows.group_by('d').order_by('d').all()
        orders_by_day = [{"date": r.d, "orders": r.orders} for r in rows]
    except Exception:
        orders_by_day = []
    try:
        rows2 = db.query(
            func.date(OrderItem.order_id == Order.id),  # dummy to keep sqlite happy in selection
        )
    except Exception:
        pass
    # Receita por dia (últimos 30 dias) via join
    try:
        q = db.query(
            func.date(Order.created_at).label('d'),
            func.coalesce(func.sum(OrderItem.unit_price * OrderItem.quantity), 0).label('revenue')
        ).join(OrderItem, OrderItem.order_id == Order.id)
        q = q.filter(Order.created_at >= text(f"date('now','-{days} day')"))
        q = q.group_by('d').order_by('d')
        rows_rev = q.all()
        revenue_by_day = [{"date": r.d, "revenue": float(r.revenue)} for r in rows_rev]
    except Exception:
        revenue_by_day = []
    # Status de pedidos
    try:
        status_rows = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
        order_statuses = { str(k): v for (k, v) in status_rows }
    except Exception:
        order_statuses = {}
    # Top produtos (por receita) nos últimos 'days'
    try:
        qtop = db.query(
            Product.name,
            func.coalesce(func.sum(OrderItem.unit_price * OrderItem.quantity), 0).label('revenue')
        ).join(OrderItem, OrderItem.product_id == Product.id).join(Order, Order.id == OrderItem.order_id)
        qtop = qtop.filter(Order.created_at >= text(f"date('now','-{days} day')")).group_by(Product.name).order_by(text('revenue DESC')).limit(5)
        top_rows = qtop.all()
        top_products = [{"name": n, "revenue": float(r)} for (n, r) in top_rows]
    except Exception:
        top_products = []
    # Visitas: sem tracking, placeholder 0
    visits_total = 0
    visits_by_day = []
    return {
        "totals": {
            "users": total_users,
            "orders": total_orders,
            "products": total_products,
            "revenue": float(total_revenue),
            "visits": visits_total,
        },
        "orders_by_day": orders_by_day,
        "revenue_by_day": revenue_by_day,
        "visits_by_day": visits_by_day,
        "order_statuses": order_statuses,
        "top_products": top_products,
    }

# Favorites
@app.get("/favorites", response_model=List[int])
def list_favorites(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
	rows = db.query(Favorite).filter(Favorite.user_id == current.id).all()
	return [r.product_id for r in rows]


@app.post("/favorites/{product_id}", status_code=204)
def add_favorite(product_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
	exists = db.query(Favorite).filter(Favorite.user_id == current.id, Favorite.product_id == product_id).first()
	if exists is None:
		db.add(Favorite(user_id=current.id, product_id=product_id))
		db.commit()
	return None


@app.delete("/favorites/{product_id}", status_code=204)
def remove_favorite(product_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
	row = db.query(Favorite).filter(Favorite.user_id == current.id, Favorite.product_id == product_id).first()
	if row:
		db.delete(row)
		db.commit()
	return None
