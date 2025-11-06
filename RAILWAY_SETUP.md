# 🚂 CONFIGURAÇÃO DO RAILWAY (Backend)

## 🌟 **POR QUE RAILWAY?**
- ✅ **$5 de crédito gratuito** por mês (suficiente para baixo uso)
- ✅ **Deploy automático** via GitHub
- ✅ **Suporte nativo** ao Node.js e PostgreSQL
- ✅ **Configuração simples** de variáveis de ambiente
- ✅ **Monitoramento** e logs incluídos

## 📋 **PRÉ-REQUISITOS**
- ✅ Conta no GitHub com o repositório
- ✅ Supabase configurado e funcionando
- ✅ Projeto commitado no Git

## 🚀 **CONFIGURAÇÃO PASSO A PASSO**

### **1. Criar conta no Railway**
1. Acesse: https://railway.app
2. Clique em "Login" 
3. Use "Login with GitHub"
4. Autorize o Railway

### **2. Criar novo projeto**
1. Dashboard do Railway → "New Project"
2. Selecione "Deploy from GitHub repo"
3. Escolha seu repositório `budget-app`
4. Clique em "Deploy Now"

### **3. Configurar o serviço**
1. Na dashboard, clique no serviço criado
2. Vá em "Settings"
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### **4. Configurar variáveis de ambiente**
Na aba "Variables", adicione:

```bash
# Database (sua connection string do Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# JWT (gere uma chave forte)
JWT_SECRET=sua_chave_super_secreta_minimo_32_caracteres_muito_segura

# Node
NODE_ENV=production
PORT=3001

# Supabase (opcional)
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_KEY=[SERVICE_KEY]
```

### **5. Deploy automático**
1. O Railway detectará mudanças no GitHub
2. Fará deploy automático a cada push
3. Você receberá uma URL como: `https://your-app.railway.app`

## 🔧 **CONFIGURAÇÃO AVANÇADA**

### **Dockerfile para Railway**
Crie `server/Dockerfile.railway`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE $PORT

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### **Railway.json (opcional)**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "server/Dockerfile.railway"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 📊 **MONITORAMENTO**

### **Logs em tempo real**
```bash
# Via Railway CLI
railway logs --follow

# Via dashboard
Dashboard → Seu serviço → "Logs"
```

### **Métricas**
- CPU usage
- Memory usage
- Request count
- Response time

## ⚡ **COMANDOS ÚTEIS**

### **Railway CLI (opcional)**
```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Logs
railway logs

# Variáveis
railway variables

# Status
railway status
```

## 💰 **CUSTOS E LIMITES**

### **Tier Gratuito**
- ✅ **$5 de crédito/mês**
- ✅ **512MB RAM**
- ✅ **1GB storage**
- ✅ **100GB bandwidth**

### **Para 2 usuários**
- Uso estimado: **$1-2/mês**
- **Sobra crédito** para crescimento

## 🔄 **ALTERNATIVAS GRATUITAS**

### **Render.com**
- ✅ 100% gratuito (com limitações)
- ⚠️ Hiberna após 15min de inatividade
- ⚠️ Mais lento para inicializar

### **Heroku**
- ❌ Tier gratuito descontinuado
- 💰 $7/mês mínimo

## 🎯 **PRÓXIMOS PASSOS**

Após configurar o Railway:
1. ✅ Anote a URL do backend
2. ✅ Atualize `VITE_API_URL` no cliente
3. ✅ Re-deploy do Firebase
4. ✅ Teste a aplicação completa

## 🚨 **IMPORTANTE**

### **Primeira migração**
O Railway executará automaticamente:
```bash
npx prisma migrate deploy
```

### **Verificar funcionamento**
Acesse: `https://sua-url.railway.app/health`
Deve retornar: `{"status": "OK"}`