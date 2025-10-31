"""
Serviço de Email para SwiftShop
Gerencia o envio de emails transacionais
"""
from fastapi_mail import FastMail, MessageSchema, MessageType
from backend.email_config import conf, email_settings
from backend.timezone_utils import format_moz_datetime
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Instância do FastMail
fm = FastMail(conf)


def format_date(date: datetime) -> str:
    """Formata uma data para exibição em português (Moçambique UTC+2)"""
    return format_moz_datetime(date)


def format_price(value: float) -> str:
    """Formata um preço para exibição"""
    return f"{value:.2f}"


async def send_new_order_email_to_customer(
    customer_email: str,
    customer_name: str,
    order_id: int,
    order_date: datetime,
    payment_method: str,
    shipping_address: str,
    items: List[Dict[str, Any]],
    subtotal: float,
    shipping_cost: float,
    total: float
):
    """
    Envia email de confirmação de pedido para o cliente
    """
    try:
        # Preparar dados dos produtos
        formatted_items = []
        for item in items:
            formatted_items.append({
                'product_name': item.get('product_name', 'Produto'),
                'quantity': item.get('quantity', 1),
                'size': item.get('size'),
                'color': item.get('color'),
                'price': format_price(item.get('price', 0))
            })
        
        template_data = {
            'customer_name': customer_name,
            'order_id': order_id,
            'order_date': format_date(order_date),
            'payment_method': payment_method,
            'shipping_address': shipping_address,
            'items': formatted_items,
            'subtotal': format_price(subtotal),
            'shipping_cost': format_price(shipping_cost),
            'total': format_price(total)
        }
        
        message = MessageSchema(
            subject=f"✅ Pedido #{order_id} Confirmado - SwiftShop",
            recipients=[customer_email],
            template_body=template_data,
            subtype=MessageType.html,
        )
        
        await fm.send_message(message, template_name="novo_pedido_cliente.html")
        logger.info(f"Email de novo pedido enviado para {customer_email}")
        
    except Exception as e:
        logger.error(f"Erro ao enviar email para cliente: {str(e)}")
        # Não levanta exceção para não bloquear o processo de pedido


async def send_new_order_email_to_admin(
    order_id: int,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    order_date: datetime,
    payment_method: str,
    shipping_address: str,
    items: List[Dict[str, Any]],
    subtotal: float,
    shipping_cost: float,
    total: float
):
    """
    Envia email de notificação de novo pedido para o administrador
    """
    try:
        # Preparar dados dos produtos
        formatted_items = []
        for item in items:
            formatted_items.append({
                'product_name': item.get('product_name', 'Produto'),
                'quantity': item.get('quantity', 1),
                'size': item.get('size'),
                'color': item.get('color'),
                'price': format_price(item.get('price', 0))
            })
        
        template_data = {
            'order_id': order_id,
            'customer_name': customer_name,
            'customer_email': customer_email,
            'customer_phone': customer_phone,
            'order_date': format_date(order_date),
            'payment_method': payment_method,
            'shipping_address': shipping_address,
            'items': formatted_items,
            'subtotal': format_price(subtotal),
            'shipping_cost': format_price(shipping_cost),
            'total': format_price(total)
        }
        
        message = MessageSchema(
            subject=f"🔔 Novo Pedido #{order_id} - SwiftShop",
            recipients=[email_settings.ADMIN_EMAIL],
            template_body=template_data,
            subtype=MessageType.html,
        )
        
        await fm.send_message(message, template_name="novo_pedido_admin.html")
        logger.info(f"Email de novo pedido enviado para admin")
        
    except Exception as e:
        logger.error(f"Erro ao enviar email para admin: {str(e)}")


async def send_order_processing_email(
    customer_email: str,
    customer_name: str,
    order_id: int,
    order_date: datetime,
    items: List[Dict[str, Any]]
):
    """
    Envia email quando o pedido está sendo processado
    """
    try:
        formatted_items = []
        for item in items:
            formatted_items.append({
                'product_name': item.get('product_name', 'Produto'),
                'quantity': item.get('quantity', 1),
                'size': item.get('size'),
                'color': item.get('color'),
                'price': format_price(item.get('price', 0))
            })
        
        template_data = {
            'customer_name': customer_name,
            'order_id': order_id,
            'order_date': format_date(order_date),
            'items': formatted_items
        }
        
        message = MessageSchema(
            subject=f"⚙️ Pedido #{order_id} em Processamento - SwiftShop",
            recipients=[customer_email],
            template_body=template_data,
            subtype=MessageType.html,
        )
        
        await fm.send_message(message, template_name="pedido_processado.html")
        logger.info(f"Email de pedido processado enviado para {customer_email}")
        
    except Exception as e:
        logger.error(f"Erro ao enviar email de processamento: {str(e)}")


async def send_order_shipped_email(
    customer_email: str,
    customer_name: str,
    order_id: int,
    shipping_address: str,
    shipping_date: datetime,
    items: List[Dict[str, Any]],
    tracking_code: Optional[str] = None,
    estimated_delivery: Optional[str] = None
):
    """
    Envia email quando o pedido é enviado
    """
    try:
        formatted_items = []
        for item in items:
            formatted_items.append({
                'product_name': item.get('product_name', 'Produto'),
                'quantity': item.get('quantity', 1),
                'size': item.get('size'),
                'color': item.get('color'),
                'price': format_price(item.get('price', 0))
            })
        
        template_data = {
            'customer_name': customer_name,
            'order_id': order_id,
            'shipping_address': shipping_address,
            'shipping_date': format_date(shipping_date),
            'items': formatted_items,
            'tracking_code': tracking_code,
            'estimated_delivery': estimated_delivery
        }
        
        message = MessageSchema(
            subject=f"🚚 Pedido #{order_id} Enviado - SwiftShop",
            recipients=[customer_email],
            template_body=template_data,
            subtype=MessageType.html,
        )
        
        await fm.send_message(message, template_name="pedido_enviado.html")
        logger.info(f"Email de pedido enviado para {customer_email}")
        
    except Exception as e:
        logger.error(f"Erro ao enviar email de envio: {str(e)}")


async def send_order_delivered_email(
    customer_email: str,
    customer_name: str,
    order_id: int,
    delivery_date: datetime,
    shipping_address: str,
    items: List[Dict[str, Any]],
    received_by: str = "Destinatário"
):
    """
    Envia email quando o pedido é entregue
    """
    try:
        formatted_items = []
        for item in items:
            formatted_items.append({
                'product_name': item.get('product_name', 'Produto'),
                'quantity': item.get('quantity', 1),
                'size': item.get('size'),
                'color': item.get('color'),
                'price': format_price(item.get('price', 0))
            })
        
        template_data = {
            'customer_name': customer_name,
            'order_id': order_id,
            'delivery_date': format_date(delivery_date),
            'shipping_address': shipping_address,
            'items': formatted_items,
            'received_by': received_by
        }
        
        message = MessageSchema(
            subject=f"🎉 Pedido #{order_id} Entregue - SwiftShop",
            recipients=[customer_email],
            template_body=template_data,
            subtype=MessageType.html,
        )
        
        await fm.send_message(message, template_name="pedido_entregue.html")
        logger.info(f"Email de pedido entregue enviado para {customer_email}")
        
    except Exception as e:
        logger.error(f"Erro ao enviar email de entrega: {str(e)}")

