# 🚀 Deploy Guide - Budget App Production

> **Stack de Produção**: Render + Supabase | **Custo**: $0/mês

## 🎯 Arquitetura Final

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Render        │    │   Render        │    │   Supabase      │
│   Static Site   │────│   Docker        │────│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **Frontend**: React + Vite (build estático)
- **Backend**: Node.js + Express + Prisma (Docker container)
- **Database**: PostgreSQL (connection pooler)

## 📋 Passos Realizados

### ✅ 1. Database Setup (Supabase)

- Projeto criado: `budget-app-prod`
- Schema executado: `server/create-tables.sql`
- Connection string: Session pooler configurado
- Todas as tabelas criadas com relacionamentos

### ✅ 2. Backend Deploy (Render Docker)

- Serviço: `budget-app-docker-server`
- Dockerfile: `server/Dockerfile.production`
- Build: Multi-stage otimizado
- Environment Variables configuradas

### ✅ 3. Frontend Deploy (Render Static Site)

- Serviço: `budget-app-client`
- Build: `npm run build` (Vite)
- Output: `dist/` directory
- Environment Variables configuradas

### ✅ 4. CORS Configuration

- Backend: `CORS_ORIGIN` configurado
- Comunicação entre domínios funcionando

## 🔧 Environment Variables

### Backend (Render Docker)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres.esgxdyazrnozmsjpgtxz:NaaoFR0CgsOKVlza@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=budget_app_super_secret_jwt_key_production_2024_minimum_32_characters_long
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://budget-app-docker-client.onrender.com
```

### Frontend (Render Static Site)

```bash
VITE_API_URL=https://budget-app-docker-server.onrender.com
```

## 🌐 URLs de Produção

- **Frontend**: https://budget-app-docker-client.onrender.com
- **Backend API**: https://budget-app-docker-server.onrender.com
- **Health Check**: https://budget-app-docker-server.onrender.com/health
- **API Test**: https://budget-app-docker-server.onrender.com/api/test

## 🔄 Deploy Automático

### Trigger de Deploy

- **Branch**: `client`
- **Auto-deploy**: Habilitado
- **Qualquer push** na branch `client` dispara deploy automático

### Process Flow

1. **Git push** → GitHub
2. **Render detect** → Nova build
3. **Backend**: Docker build + deploy
4. **Frontend**: npm build + deploy
5. **Health check** → Serviços live

## 📊 Monitoramento

### Backend Health

```bash
# Test endpoint
curl https://budget-app-docker-server.onrender.com/api/test

# Expected response
{
  "message": "Complete budget architecture working with TS-NODE!",
  "database": {"users": 0, "budgets": 0, ...},
  "timestamp": "2025-11-06T18:55:08.294Z"
}
```

### Database Status

- **Connection**: Session pooler (6543)
- **Performance**: Otimizado para containers
- **Monitoring**: Supabase dashboard

## 🚨 Troubleshooting

### Backend Issues

- **Build fails**: Check Docker logs
- **Database connection**: Verify pooler URL
- **Environment**: Check all variables set

### Frontend Issues

- **API calls fail**: Check CORS configuration
- **Build fails**: Check VITE_API_URL variable
- **Static files**: Verify build output in `dist/`

### Database Issues

- **Connection timeout**: Use pooler instead of direct
- **SSL errors**: Ensure `?pgbouncer=true` in URL
- **Migration issues**: Run SQL manually in Supabase

## 🔐 Security Checklist

### ✅ Production Security

- JWT secret: 32+ characters
- CORS: Specific origins only
- Rate limiting: Configured
- Headers: Helmet security headers
- Passwords: bcrypt with 12 rounds

### ✅ Database Security

- Connection pooling
- Environment variables (no hardcoded credentials)
- Supabase built-in security

## 📈 Performance

### Current Metrics

- **Backend**: Docker optimized build
- **Frontend**: Static files via CDN
- **Database**: Connection pooling
- **Cold start**: ~1-2 seconds (Render free tier)

### Optimization

- Multi-stage Docker build
- Production dependencies only
- Compressed assets
- Efficient Prisma queries

## 🔄 Updates & Maintenance

### Regular Updates

- **Dependencies**: Monthly security updates
- **Monitoring**: Check Render/Supabase dashboards
- **Backups**: Supabase automatic backups

### Manual Deploy

```bash
# Force redeploy if needed
# Render Dashboard → Deploys → "Deploy latest commit"
```

## 💰 Cost Breakdown

| Service               | Plan                 | Cost       |
| --------------------- | -------------------- | ---------- |
| **Render Backend**    | Free (Docker)        | $0/mês     |
| **Render Frontend**   | Free (Static)        | $0/mês     |
| **Supabase Database** | Free                 | $0/mês     |
| **Domain**            | Render subdomain     | $0/mês     |
| **SSL**               | Auto (Let's Encrypt) | $0/mês     |
| **Total**             |                      | **$0/mês** |

## 🎉 Success Criteria

### ✅ All Working

- [x] User registration/login
- [x] Budget creation/management
- [x] Account management
- [x] Transaction CRUD
- [x] Category management
- [x] Budget sharing system
- [x] File import system
- [x] Dashboard analytics
- [x] Responsive design
- [x] Production deployment

---

**🚀 Budget App is live and running in production with zero monthly cost!**
