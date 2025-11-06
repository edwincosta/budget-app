# 🌐 CONFIGURAÇÃO DO RENDER.COM (Backend 100% Gratuito)

## 🌟 **POR QUE RENDER?**
- ✅ **100% gratuito** para sempre
- ✅ **PostgreSQL incluído** (1GB)
- ✅ **Deploy automático** via GitHub
- ✅ **HTTPS automático** SSL
- ✅ **Logs e monitoramento** incluídos
- ⚠️ **Hiberna após 15min** (acordar leva ~30s)

## 📋 **PRÉ-REQUISITOS**
- ✅ Conta no GitHub com o repositório
- ✅ Supabase configurado (ou usar PostgreSQL do Render)
- ✅ Projeto commitado no Git

## 🚀 **CONFIGURAÇÃO PASSO A PASSO**

### **1. Criar conta no Render**
1. Acesse: https://render.com
2. Clique em "Get Started for Free"
3. Use "Sign up with GitHub" 
4. Autorize o Render

### **2. Criar PostgreSQL Database (Opcional)**
Se não quiser usar Supabase:
1. Dashboard → "New +"
2. Selecione "PostgreSQL"
3. Configure:
   - **Name**: `budget-database`
   - **Database**: `budget_db`
   - **User**: `budget_user`
   - **Region**: `Ohio (US East)`
   - **Plan**: `Free` (1GB)

### **3. Criar Web Service (Backend)**
1. Dashboard → "New +"
2. Selecione "Web Service"
3. "Connect a repository" → Selecione seu repo
4. Configure:
   - **Name**: `budget-backend`
   - **Region**: `Ohio (US East)`
   - **Branch**: `main` ou `client`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### **4. Configurar variáveis de ambiente**
Na seção "Environment", adicione:

```bash
# Database (se usando Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# OU Database (se usando PostgreSQL do Render)
DATABASE_URL=[URL_INTERNO_DO_RENDER]

# JWT
JWT_SECRET=sua_chave_super_secreta_minimo_32_caracteres_muito_segura
JWT_EXPIRES_IN=7d

# Node
NODE_ENV=production
PORT=10000

# Security
BCRYPT_ROUNDS=12
```

### **5. Deploy automático**
1. O Render detectará mudanças no GitHub
2. Fará build e deploy automático
3. Você receberá uma URL: `https://budget-backend.onrender.com`

## 🔧 **CONFIGURAÇÃO AVANÇADA**

### **Render.yaml (opcional)**
Crie `render.yaml` na raiz do projeto:
```yaml
services:
  - type: web
    name: budget-backend
    env: node
    plan: free
    buildCommand: cd server && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - fromDatabase:
          name: budget-database
          property: connectionString
          envVarKey: DATABASE_URL

databases:
  - name: budget-database
    plan: free
    databaseName: budget_db
    user: budget_user
```

## 📊 **MONITORAMENTO**

### **Verificar status**
```bash
# Health check
curl https://budget-backend.onrender.com/health

# Via dashboard
Dashboard → Seu serviço → "Logs"
```

### **Logs em tempo real**
- Dashboard → Serviço → "Logs"
- Busca por keywords
- Download de logs

## ⚡ **HIBERNAÇÃO E WAKE-UP**

### **Como funciona**
- ✅ **Ativo**: Enquanto recebe requests
- 😴 **Hiberna**: Após 15min sem uso
- ⏰ **Acorda**: 30-60s no primeiro request

### **Para minimizar impacto**
```javascript
// Adicione no seu código um health check que chama a si mesmo
setInterval(() => {
  if (process.env.NODE_ENV === 'production') {
    fetch(`${process.env.BASE_URL}/health`).catch(() => {});
  }
}, 14 * 60 * 1000); // A cada 14 minutos
```

## 💡 **DICAS DE OTIMIZAÇÃO**

### **1. Reduzir cold start**
```javascript
// server/src/index.ts
// Adicione no final do arquivo
if (process.env.NODE_ENV === 'production') {
  // Keep alive ping
  setInterval(() => {
    fetch(`https://budget-backend.onrender.com/health`)
      .catch(() => console.log('Keep alive ping failed'));
  }, 14 * 60 * 1000);
}
```

### **2. Cache de dependências**
No `package.json`:
```json
{
  "scripts": {
    "build": "npm ci --only=production && npx prisma generate && tsc"
  }
}
```

## 🆚 **COMPARAÇÃO COM OUTRAS OPÇÕES**

| Aspecto | Render | Railway | Firebase Functions |
|---------|--------|---------|-------------------|
| **Custo** | 🟢 Grátis | 🟡 $5/mês | 🟢 Grátis |
| **PostgreSQL** | 🟢 Incluído | 🟡 Pago | 🔴 Não |
| **Cold Start** | 🟡 30-60s | 🟢 Sempre ativo | 🟡 1-3s |
| **Facilidade** | 🟢 Simples | 🟢 Simples | 🟡 Complexo |

## 🎯 **PRÓXIMOS PASSOS**

Após configurar o Render:
1. ✅ Anote a URL do backend
2. ✅ Atualize `VITE_API_URL` no cliente
3. ✅ Re-deploy do Firebase
4. ✅ Teste com usuários reais

## 🚨 **IMPORTANTE**

### **Primeira migração**
```bash
# O Render executará automaticamente:
npm install
npm run build
npx prisma generate
npx prisma migrate deploy
npm start
```

### **Verificar funcionamento**
- URL: `https://budget-backend.onrender.com/health`
- Deve retornar: `{"status": "OK"}`
- Logs no dashboard do Render

## 🆘 **TROUBLESHOOTING**

### **Build falhou**
- Verifique logs de build no dashboard
- Confirme se `server/package.json` tem script `build`
- Verifique se todas as dependências estão no `package.json`

### **App não responde**
- Verifique se a PORT está como `10000`
- Confirme variáveis de ambiente
- Verifique logs de runtime

**💡 Para 2 usuários ocasionais, a hibernação não será um problema real!**