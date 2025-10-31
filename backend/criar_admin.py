#!/usr/bin/env python3
"""Script para criar usuário admin"""

from backend.database import SessionLocal, engine, Base
from backend.models import User, UserRole
from backend.auth import get_password_hash

# Criar tabelas
Base.metadata.create_all(bind=engine)

# Criar sessão
db = SessionLocal()

# Verificar se já existe admin
existing = db.query(User).filter(User.email == 'admin@admin.com').first()
if existing:
    print("❌ Usuário admin já existe!")
    print(f"Email: admin@admin.com")
    db.close()
    exit(0)

# Criar usuário admin
admin_user = User(
    name='Admin',
    email='admin@admin.com',
    password_hash=get_password_hash('admin123'),
    role=UserRole.admin,
    is_blocked=0
)

db.add(admin_user)
db.commit()

print("✅ Usuário admin criado com sucesso!")
print(f"📧 Email: admin@admin.com")
print(f"🔑 Senha: admin123")

# Criar usuário cliente de teste
client_user = User(
    name='Cliente Teste',
    email='cliente@teste.com',
    password_hash=get_password_hash('123456'),
    role=UserRole.client,
    is_blocked=0
)

db.add(client_user)
db.commit()

print("\n✅ Usuário cliente criado com sucesso!")
print(f"📧 Email: cliente@teste.com")
print(f"🔑 Senha: 123456")

db.close()

