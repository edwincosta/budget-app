# 🚀 Deploy no Railway - Guia Passo a Passo (Railpack)

## ✅ Preparação Concluída!

Seu projeto está 100% preparado para deploy no Railway com **Railpack**:
- ✅ Build de produção executado
- ✅ Railway CLI instalado
- ✅ Configurações otimizadas para Railpack
- ✅ Scripts de deploy configurados
- ✅ Cache control configurado via `REBUILD_TRIGGER`
- ✅ Biblioteca PDF compatível (`pdf-parse`)

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
6. **Railway detectará automaticamente** o `railway.toml` e usará **Railpack**

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

# Cache Control (mude para forçar rebuild)
REBUILD_TRIGGER=1
```

**⚠️ IMPORTANTE**: 
- `DATABASE_URL` será automaticamente configurada pelo PostgreSQL addon
- **NUNCA** use o JWT_SECRET de exemplo acima - gere um novo!

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

## 🔧 Railpack: Configuração Automática

O Railway com **Railpack** detecta automaticamente:
- ✅ **Node.js 20** (via `package.json`)
- ✅ **Workspace monorepo** (client + server)
- ✅ **Build Command**: `cd server && npm ci && npm run railway:build`
- ✅ **Start Command**: `cd server && npm run railway:start`
- ✅ **Health Check**: `/health`
- ✅ **Port**: `$PORT` (automático)
- ✅ **Prisma**: Migrations automáticas no start

## 🔄 Como Forçar Rebuild no Railway

### Método 1: Variável de Ambiente (Mais Fácil) ⭐
1. Railway Dashboard → **Variables**
2. Mude `REBUILD_TRIGGER=1` para `REBUILD_TRIGGER=2`
3. Salvar → Deploy automático com cache limpo

### Método 2: Via Dashboard
1. **Deployments** → Clique nos 3 pontos (`...`)
2. **"Redeploy with cleared build cache"**

### Método 3: Via CLI
```bash
railway up --no-cache
```

## ✅ Verificações Pós-Deploy

1. **Health Check**: https://seu-app.railway.app/health
2. **Frontend**: https://seu-app.railway.app
3. **API**: https://seu-app.railway.app/api/auth/status

## � Troubleshooting

### Problema: Build failure
```bash
# Teste localmente primeiro
cd server
npm ci
npm run railway:build
npm run railway:start
```

### Problema: Migrations não rodaram
```bash
# Rode manualmente
railway run npx prisma migrate deploy
```

### Problema: Cache desatualizado (biblioteca antiga)
1. Mude `REBUILD_TRIGGER=2` nas variáveis do Railway
2. Ou use: `railway up --no-cache`

### Problema: Erro ERR_REQUIRE_ESM
✅ **Resolvido!** Agora usamos `pdf-parse` (compatível com CommonJS)

## 🎯 Checklist Final

- [ ] PostgreSQL addon adicionado
- [ ] `JWT_SECRET` gerado e configurado (mínimo 32 caracteres)
- [ ] `REBUILD_TRIGGER=1` configurado
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Health check respondendo (`/health`)
- [ ] Frontend carregando
- [ ] API funcionando
- [ ] Migrations executadas
- [ ] CORS configurado corretamente
- [ ] Logs sem erros

## 🚀 Deploy Contínuo

Após o setup inicial, todo `git push` na branch main dispara:
1. ✅ Railway detecta commit
2. ✅ Railpack faz build otimizado
3. ✅ Migrations rodam automaticamente
4. ✅ Health check valida deploy
5. ✅ Tráfego migrado automaticamente

---

**🎉 Seu Budget App está rodando em produção com Railpack!**
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