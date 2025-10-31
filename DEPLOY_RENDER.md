# 🚀 Guia de Deploy no Render - SwiftShop Backend

## Campos a Preencher no Render

### ✅ Campos que já estão corretos (não alterar):

1. **Source Code**: `maurobernardo / swiftshop-backend` ✅
2. **Name**: `swiftshop-backend` ✅
3. **Language**: `Python 3` ✅
4. **Branch**: `main` ✅ (verifique se seu branch principal é `main`)
5. **Region**: `Oregon (US West)` ✅ (ou escolha outra se preferir)

### ⚠️ Campos que PRECISAM ser alterados:

#### 6. **Root Directory**
   - **Deixe VAZIO** ✅
   - Não preencha nada aqui

#### 7. **Build Command**
   - **Altere para:**
   ```bash
   pip install -r backend/requirements.txt
   ```
   - Ou se já estiver `pip install -r requirements.txt`, verifique se seu `requirements.txt` está na raiz. Se estiver em `backend/requirements.txt`, use o comando acima.

#### 8. **Start Command** ⚠️ **IMPORTANTE - ALTERAR!**
   - **Substitua o comando atual por:**
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
   - Este é o comando correto para FastAPI com Uvicorn

#### 9. **Instance Type**
   - `Free` está selecionado ✅
   - **Atenção**: Instâncias gratuitas entram em "sleep" após inatividade (15 minutos sem requisições)
   - Para produção, considere fazer upgrade para plano pago

---

## 🔧 Variáveis de Ambiente (Environment Variables)

Após criar o serviço, vá em **Environment** e adicione estas variáveis:

### Obrigatórias:
```
SECRET_KEY=<gere-uma-chave-aleatoria-segura>
```

### Opcionais (mas recomendadas):
```
DATABASE_URL=sqlite:///./swiftshop.db
# Para produção, considere usar PostgreSQL do Render

PAYPAL_CLIENT_ID=<seu-paypal-client-id>
PAYPAL_CLIENT_SECRET=<seu-paypal-secret>
PAYPAL_BASE=https://api-m.sandbox.paypal.com

MAIL_USERNAME=<seu-email@gmail.com>
MAIL_PASSWORD=<sua-senha-de-app>
MAIL_FROM=<seu-email@gmail.com>
MAIL_FROM_NAME=SwiftShop
```

### Geração de SECRET_KEY:
Execute no terminal Python:
```python
import secrets
print(secrets.token_urlsafe(32))
```

---

## 📋 Checklist de Deploy

- [ ] Start Command alterado para `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- [ ] Build Command verificado (`pip install -r backend/requirements.txt`)
- [ ] Root Directory deixado vazio
- [ ] Variáveis de ambiente configuradas (pelo menos SECRET_KEY)
- [ ] Clique em **"Create Web Service"**

---

## 🔗 Após o Deploy

1. Aguarde o build terminar (pode levar alguns minutos)
2. Anote a URL gerada (ex: `https://swiftshop-backend.onrender.com`)
3. Teste acessando: `https://swiftshop-backend.onrender.com/docs` (documentação do FastAPI)

---

## 📱 Configuração do Frontend

Após o backend estar no ar, configure o frontend:

1. Crie um arquivo `.env` na raiz do projeto React Native
2. Adicione:
   ```
   EXPO_PUBLIC_API_URL=https://swiftshop-backend.onrender.com
   ```
3. Reinicie o Expo: `npm start`

---

## ⚠️ Problemas Comuns

### Backend demora para responder na primeira requisição
- Isso é normal no plano Free (cold start)
- Após 15 minutos sem uso, o serviço "dorme"
- A primeira requisição após dormir pode levar 30-60 segundos

### Erro de build
- Verifique se o `requirements.txt` está no caminho correto
- Confirme que o Python está na versão 3.8 ou superior

### Erro de porta
- O Render define `$PORT` automaticamente
- Não defina uma porta manualmente, use sempre `$PORT` no Start Command

