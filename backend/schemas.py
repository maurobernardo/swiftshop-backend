from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.models import UserRole, OrderStatus


class UserCreate(BaseModel):
	name: str = Field(min_length=2, max_length=100)
	email: EmailStr
	password: str = Field(min_length=6)
	role: UserRole = UserRole.client
	# Optional contact/address at registration time
	phone: Optional[str] = None
	country: Optional[str] = None
	state: Optional[str] = None
	city: Optional[str] = None
	street: Optional[str] = None
	number: Optional[str] = None
	reference: Optional[str] = None
	avatar_url: Optional[str] = None


class UserLogin(BaseModel):
	email: EmailStr
	password: str


class UserUpdate(BaseModel):
	"""Schema para atualização de perfil do usuário"""
	name: Optional[str] = Field(None, min_length=2, max_length=100)
	phone: Optional[str] = None
	country: Optional[str] = None
	state: Optional[str] = None
	city: Optional[str] = None
	street: Optional[str] = None
	number: Optional[str] = None
	reference: Optional[str] = None
	avatar_url: Optional[str] = None


class UserOut(BaseModel):
	id: int
	name: str
	email: EmailStr
	role: UserRole
	is_blocked: int
	avatar_url: Optional[str] = None
	phone: Optional[str] = None
	country: Optional[str] = None
	state: Optional[str] = None
	city: Optional[str] = None
	street: Optional[str] = None
	number: Optional[str] = None
	reference: Optional[str] = None

	class Config:
		from_attributes = True


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"
	role: UserRole
	user_id: int


class ProductBase(BaseModel):
	name: str
	price: float
	description: Optional[str] = None
	image_url: Optional[str] = None
	image_urls: Optional[List[str]] = None
	size_images: Optional[Dict[str, List[str]]] = None  # {"42": ["url1", "url2"], "43": ["url3"]}
	size_colors: Optional[Dict[str, List[str]]] = None  # {"42": ["azul", "preto"], "43": ["vermelho"]}
	size_stock: Optional[Dict[str, int]] = None  # {"42": 5, "43": 3}
	category: Optional[str] = None
	stock: int = 0
	main_category: Optional[str] = None
	sub_category: Optional[str] = None
	attributes: Optional[Dict[str, Any]] = None


class ProductCreate(ProductBase):
	pass


class ProductUpdate(BaseModel):
	name: Optional[str] = None
	price: Optional[float] = None
	description: Optional[str] = None
	image_url: Optional[str] = None
	image_urls: Optional[List[str]] = None
	size_images: Optional[Dict[str, List[str]]] = None
	size_colors: Optional[Dict[str, List[str]]] = None
	size_stock: Optional[Dict[str, int]] = None
	category: Optional[str] = None
	stock: Optional[int] = None
	main_category: Optional[str] = None
	sub_category: Optional[str] = None
	attributes: Optional[Dict[str, Any]] = None


class ProductOut(ProductBase):
	id: int

	class Config:
		from_attributes = True


# Allowed attributes by main/sub category
ALLOWED_ATTRS: Dict[str, Dict[str, List[str]]] = {
    "Vestuário": {
        "Sapato": ["marca", "tamanho", "cor", "preco_promocional", "rating"],
        "Camisa": ["marca", "tamanho", "cor", "estilo", "rating"],
        "Camiseta": ["marca", "tamanho", "cor", "estampa", "rating"],
        "Calça": ["marca", "tamanho", "cor", "estilo", "rating"],
    },
    "Tecnologia": {
        "Computador": ["marca", "referencia", "armazenamento", "ram", "tipo_memoria", "rating"],
        "Laptop": ["marca", "referencia", "armazenamento", "ram", "tipo_memoria", "rating"],
        "Telefone": ["marca", "referencia", "armazenamento", "ram", "rating"],
    },
}


def sanitize_attributes(main_category: Optional[str], sub_category: Optional[str], attrs: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not attrs:
        return None
    # image_urls is allowed to pass-through
    image_urls = attrs.get("image_urls")
    allowed: Optional[List[str]] = None
    if main_category and sub_category:
        allowed = ALLOWED_ATTRS.get(main_category, {}).get(sub_category)
    if not allowed:
        # keep only primitive key/values plus image_urls
        filtered = {k: v for k, v in attrs.items() if k != "image_urls" and isinstance(v, (str, int, float))}
    else:
        filtered = {k: attrs[k] for k in allowed if k in attrs}
    if image_urls:
        filtered["image_urls"] = image_urls
    return filtered or None


class OrderItemCreate(BaseModel):
	product_id: int
	quantity: int = 1


class OrderItemOut(BaseModel):
	id: int
	product_id: int
	quantity: int
	unit_price: float
	product: ProductOut

	class Config:
		from_attributes = True


class OrderCreate(BaseModel):
	items: List[OrderItemCreate]


class OrderOut(BaseModel):
	id: int
	user_id: int
	status: OrderStatus
	created_at: datetime
	items: List[OrderItemOut]

	class Config:
		from_attributes = True


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewWithUserOut(ReviewOut):
    user_name: str


class MessageCreate(BaseModel):
    order_id: int | None = None
    text: str
    target_user_id: int | None = None
    auto_reply_text: str | None = None


class MessageOut(BaseModel):
    id: int
    user_id: int
    order_id: int | None
    from_role: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True
