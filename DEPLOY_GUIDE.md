# 🚀 Deploy no Railway - Guia Passo a Passo

## ✅ Preparação Concluída!

Seu projeto está 100% preparado para deploy no Railway:
- ✅ Build de produção executado
- ✅ Railway CLI instalado
- ✅ Configurações otimizadas
- ✅ Scripts de deploy configurados

## 🎯 Opção 1: Deploy via GitHub (Recomendado)

### Passo 1: Preparar Repositório GitHub
```bash
# Se ainda não commitou as alterações:
git add .
git commit -m "feat: prepare for Railway deployment"
git push origin upgrade-lib

# Ou fazer merge na main:
git checkout main
git merge upgrade-lib
git push origin main
```

### Passo 2: Configurar no Railway
1. **Acesse**: https://railway.app
2. **Faça login** com sua conta GitHub
3. **Clique em "New Project"**
4. **Selecione "Deploy from GitHub repo"**
5. **Escolha seu repositório**: `edwincosta/budget-app`
6. **Selecione a branch** (main ou upgrade-lib)

### Passo 3: Configurar Serviços
O Railway irá detectar automaticamente e criar:
- **Web Service** (sua aplicação)
- Você precisa **adicionar PostgreSQL**:
  - Clique em "+ New" → "Database" → "Add PostgreSQL"

### Passo 4: Variáveis de Ambiente (CRÍTICAS)
Na aba **Variables** do seu serviço web, adicione:

```bash
# JWT Configuration (OBRIGATÓRIO)
JWT_SECRET=meu_jwt_super_secreto_de_32_caracteres_ou_mais
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
NODE_ENV=production

# CORS (será fornecido pelo Railway após deploy)
CORS_ORIGIN=${{RAILWAY_PUBLIC_DOMAIN}}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

**⚠️ IMPORTANTE**: `DATABASE_URL` será automaticamente configurada pelo PostgreSQL addon.

## 🚀 Opção 2: Deploy via Railway CLI

```bash
# Login no Railway
railway login

# Inicializar projeto
railway init

# Adicionar PostgreSQL
railway add --database postgresql

# Fazer deploy
railway up
```

## 🔧 Configurações Automáticas

O Railway usará automaticamente:
- **Build Command**: `cd server && npm run railway:build`
- **Start Command**: `cd server && npm run railway:start`
- **Health Check**: `/health`
- **Port**: `$PORT` (automático)

## ✅ Verificações Pós-Deploy

1. **Health Check**: https://seu-app.railway.app/health
2. **Frontend**: https://seu-app.railway.app
3. **API**: https://seu-app.railway.app/api/auth/status

## 🎯 Próximos Passos

1. **Atualize CORS_ORIGIN** com sua URL final do Railway
2. **Configure domínio customizado** (opcional)
3. **Monitore logs** via Railway Dashboard
4. **Configure backups** do PostgreSQL

## 🆘 Troubleshooting

### Problema comum: Build failure
```bash
# Execute localmente primeiro:
cd server && npm run railway:build
cd client && npm run build
```

### Logs do Railway
```bash
railway logs
```

### Variáveis de ambiente
```bash
railway variables
```

---

**🎉 Seu Budget App estará rodando em produção em poucos minutos!**