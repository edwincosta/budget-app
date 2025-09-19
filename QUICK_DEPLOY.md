# 🚀 Quick Deploy Guide - Budget App v1.0

## TL;DR - Deploy em 5 minutos

```bash
# 1. Verificar se está tudo pronto
node production-check.js

# 2. Setup para deploy
node deploy-setup.js

# 3. Ir para Railway: https://railway.app
# 4. Conectar GitHub repo
# 5. Adicionar PostgreSQL
# 6. Configurar ENV vars (ver abaixo)
# 7. Deploy automático! 🎉
```

## 📋 Environment Variables (Railway)

```bash
NODE_ENV=production
JWT_SECRET=gere_uma_chave_super_segura_de_32_caracteres_aqui
CORS_ORIGIN=https://your-app-name.railway.app
BCRYPT_ROUNDS=12
```

## ✅ Checklist Final

- [ ] Repository no GitHub
- [ ] Railway account criada
- [ ] PostgreSQL addon adicionado
- [ ] Environment variables configuradas
- [ ] Deploy executado com sucesso
- [ ] Health check funcionando: `/health`
- [ ] App acessível no URL do Railway

## 🎯 URLs Importantes

- **App**: https://your-app-name.railway.app
- **Health**: https://your-app-name.railway.app/health
- **API**: https://your-app-name.railway.app/api

---

**🎉 Budget App v1.0 no ar!**
