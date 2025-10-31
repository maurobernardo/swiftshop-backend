"""
Configuração de Email para SwiftShop
"""
from fastapi_mail import ConnectionConfig
from pydantic_settings import BaseSettings
from typing import Optional
import os


class EmailSettings(BaseSettings):
    """Configurações de email usando variáveis de ambiente"""
    
    MAIL_USERNAME: str = "swiftshop.noreply@gmail.com"
    MAIL_PASSWORD: str = ""  # Será preenchido via variável de ambiente
    MAIL_FROM: str = "swiftshop.noreply@gmail.com"
    MAIL_FROM_NAME: str = "SwiftShop"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True
    
    # Email do administrador para receber notificações
    ADMIN_EMAIL: str = "admin@swiftshop.com"
    
    class Config:
        env_file = "backend/.env"
        case_sensitive = True


# Instância global das configurações
email_settings = EmailSettings()


# Configuração do FastAPI-Mail
conf = ConnectionConfig(
    MAIL_USERNAME=email_settings.MAIL_USERNAME,
    MAIL_PASSWORD=email_settings.MAIL_PASSWORD,
    MAIL_FROM=email_settings.MAIL_FROM,
    MAIL_PORT=email_settings.MAIL_PORT,
    MAIL_SERVER=email_settings.MAIL_SERVER,
    MAIL_FROM_NAME=email_settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=email_settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=email_settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=email_settings.USE_CREDENTIALS,
    VALIDATE_CERTS=email_settings.VALIDATE_CERTS,
    TEMPLATE_FOLDER='backend/email_templates'
)

