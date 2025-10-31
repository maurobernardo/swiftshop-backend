from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
import enum

from backend.database import Base


class UserRole(str, enum.Enum):
	admin = "admin"
	client = "client"


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	name: Mapped[str] = mapped_column(String(100), nullable=False)
	email: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
	password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
	role: Mapped[str] = mapped_column(Enum(UserRole), default=UserRole.client, nullable=False)
	is_blocked: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
	avatar_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
	# Contact
	phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
	# Address
	country: Mapped[str | None] = mapped_column(String(80), nullable=True)
	state: Mapped[str | None] = mapped_column(String(120), nullable=True)
	city: Mapped[str | None] = mapped_column(String(120), nullable=True)
	street: Mapped[str | None] = mapped_column(String(200), nullable=True)
	number: Mapped[str | None] = mapped_column(String(30), nullable=True)
	reference: Mapped[str | None] = mapped_column(String(200), nullable=True)

	orders: Mapped[list["Order"]] = relationship("Order", back_populates="user")


class Product(Base):
	__tablename__ = "products"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	name: Mapped[str] = mapped_column(String(150), nullable=False)
	price: Mapped[float] = mapped_column(Float, nullable=False)
	description: Mapped[str | None] = mapped_column(Text, nullable=True)
	image_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
	image_urls_json: Mapped[str | None] = mapped_column(Text, nullable=True)     # JSON array com múltiplas imagens
	size_images_json: Mapped[str | None] = mapped_column(Text, nullable=True)    # JSON com múltiplas fotos por tamanho {"42": ["url1", "url2"], "43": ["url3"]}
	size_colors_json: Mapped[str | None] = mapped_column(Text, nullable=True)    # JSON com cores por tamanho {"42": "azul", "43": "vermelho"}
	size_stock_json: Mapped[str | None] = mapped_column(Text, nullable=True)     # JSON com estoque por tamanho {"42": 5, "43": 3}
	category: Mapped[str | None] = mapped_column(String(100), nullable=True)
	stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
	main_category: Mapped[str | None] = mapped_column(String(80), nullable=True)  # ex: Vestuário, Tecnologia
	sub_category: Mapped[str | None] = mapped_column(String(80), nullable=True)   # ex: Sapato, Camisa, Laptop
	attributes_json: Mapped[str | None] = mapped_column(Text, nullable=True)      # JSON com atributos dinâmicos

	items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")


class OrderStatus(str, enum.Enum):
	pending = "Pendente"
	processing = "Processando"
	shipped = "Enviado"
	delivered = "Entregue"


class Order(Base):
	__tablename__ = "orders"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
	status: Mapped[str] = mapped_column(Enum(OrderStatus), default=OrderStatus.pending)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

	user: Mapped["User"] = relationship("User", back_populates="orders")
	items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
	__tablename__ = "order_items"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
	product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
	quantity: Mapped[int] = mapped_column(Integer, default=1)
	unit_price: Mapped[float] = mapped_column(Float, nullable=False)

	order: Mapped["Order"] = relationship("Order", back_populates="items")
	product: Mapped["Product"] = relationship("Product", back_populates="items")


class Favorite(Base):
	__tablename__ = "favorites"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
	product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))

	__table_args__ = (UniqueConstraint('user_id', 'product_id', name='uq_user_product_fav'),)


class Review(Base):
	__tablename__ = "reviews"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
	rating: Mapped[int] = mapped_column(Integer, nullable=False)
	comment: Mapped[str | None] = mapped_column(Text, nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    order_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    from_role: Mapped[str] = mapped_column(String(20))  # 'client' | 'admin'
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    # 0 = mensagem normal; 1 = mensagem originada por card (FAQ)
    from_card: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
