"""
Serviço de Geração de Recibos em PDF - SwiftShop
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from datetime import datetime
from typing import List, Dict, Any
import os
from backend.timezone_utils import format_moz_datetime, now_moz


def format_currency(value: float) -> str:
    """Formata valor para moeda moçambicana"""
    return f"{value:,.2f} MT"


def generate_receipt_pdf(
    order_id: int,
    order_date: datetime,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    shipping_address: str,
    payment_method: str,
    items: List[Dict[str, Any]],
    subtotal: float,
    shipping_cost: float,
    total: float,
    output_path: str
) -> str:
    """
    Gera um recibo em PDF para um pedido
    
    Args:
        order_id: ID do pedido
        order_date: Data do pedido
        customer_name: Nome do cliente
        customer_email: Email do cliente
        customer_phone: Telefone do cliente
        shipping_address: Endereço de entrega
        payment_method: Método de pagamento
        items: Lista de itens do pedido
        subtotal: Subtotal
        shipping_cost: Custo de envio
        total: Total
        output_path: Caminho onde salvar o PDF
        
    Returns:
        Caminho do arquivo PDF gerado
    """
    
    # Criar o documento PDF
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    # Container para os elementos do PDF
    elements = []
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo customizado para o título
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#6366f1'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Estilo para subtítulos
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    # Estilo para seções
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    # Estilo normal
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#374151')
    )
    
    # ===== CABEÇALHO =====
    title = Paragraph("🛍️ SwiftShop", title_style)
    elements.append(title)
    
    subtitle = Paragraph("RECIBO DE COMPRA", subtitle_style)
    elements.append(subtitle)
    
    # Linha separadora
    elements.append(Spacer(1, 5*mm))
    
    # ===== INFORMAÇÕES DO PEDIDO =====
    elements.append(Paragraph("📋 Informações do Pedido", section_style))
    
    order_info_data = [
        ['Número do Pedido:', f'#{order_id}'],
        ['Data:', order_date.strftime('%d/%m/%Y às %H:%M')],
        ['Método de Pagamento:', payment_method],
        ['Status:', 'Pago ✓']
    ]
    
    order_info_table = Table(order_info_data, colWidths=[70*mm, 100*mm])
    order_info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1f2937')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(order_info_table)
    elements.append(Spacer(1, 5*mm))
    
    # ===== INFORMAÇÕES DO CLIENTE =====
    elements.append(Paragraph("👤 Informações do Cliente", section_style))
    
    customer_info_data = [
        ['Nome:', customer_name],
        ['Email:', customer_email],
        ['Telefone:', customer_phone or 'Não informado'],
        ['Endereço:', shipping_address]
    ]
    
    customer_info_table = Table(customer_info_data, colWidths=[70*mm, 100*mm])
    customer_info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1f2937')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(customer_info_table)
    elements.append(Spacer(1, 5*mm))
    
    # ===== PRODUTOS =====
    elements.append(Paragraph("🛍️ Produtos", section_style))
    
    # Cabeçalho da tabela de produtos
    products_data = [['Produto', 'Qtd', 'Preço Unit.', 'Total']]
    
    # Adicionar produtos
    for item in items:
        product_name = item['product_name']
        if item.get('size'):
            product_name += f" (Tam: {item['size']})"
        if item.get('color'):
            product_name += f" (Cor: {item['color']})"
        
        products_data.append([
            product_name,
            str(item['quantity']),
            format_currency(item['unit_price']),
            format_currency(item['total_price'])
        ])
    
    products_table = Table(products_data, colWidths=[90*mm, 20*mm, 30*mm, 30*mm])
    products_table.setStyle(TableStyle([
        # Cabeçalho
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        
        # Conteúdo
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1f2937')),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        
        # Linhas
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#6366f1')),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
    ]))
    
    elements.append(products_table)
    elements.append(Spacer(1, 5*mm))
    
    # ===== TOTAIS =====
    totals_data = [
        ['Subtotal:', format_currency(subtotal)],
        ['Frete:', format_currency(shipping_cost)],
        ['', ''],  # Linha vazia
        ['TOTAL PAGO:', format_currency(total)]
    ]
    
    totals_table = Table(totals_data, colWidths=[120*mm, 50*mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, 2), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 2), 11),
        ('TEXTCOLOR', (0, 0), (-1, 2), colors.HexColor('#374151')),
        
        # Linha do total
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 3), (-1, 3), 14),
        ('TEXTCOLOR', (0, 3), (-1, 3), colors.HexColor('#6366f1')),
        ('LINEABOVE', (0, 3), (-1, 3), 2, colors.HexColor('#6366f1')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 3), (-1, 3), 12),
    ]))
    
    elements.append(totals_table)
    elements.append(Spacer(1, 10*mm))
    
    # ===== RODAPÉ =====
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#9ca3af'),
        alignment=TA_CENTER
    )
    
    footer_text = f"""
    <para align=center>
    <b>Obrigado pela sua compra!</b><br/>
    SwiftShop - Sua loja online de confiança<br/>
    Email: support@swiftshop.com | Telefone: +258 84 000 0000<br/><br/>
    <i>Este recibo foi gerado automaticamente em {format_moz_datetime(now_moz())}</i><br/>
    Código de verificação: SW-{order_id:06d}
    </para>
    """
    
    elements.append(Paragraph(footer_text, footer_style))
    
    # Construir o PDF
    doc.build(elements)
    
    return output_path

