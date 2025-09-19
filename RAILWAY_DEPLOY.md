# Budget App - Railway Deployment Configuration

Este arquivo contém as configurações necessárias para deploy no Railway.

## Variáveis de Ambiente Necessárias

### Automáticas (fornecidas pelo Railway)
- `DATABASE_URL` - URL do PostgreSQL (automaticamente configurada)
- `PORT` - Porta do servidor (automaticamente configurada)

### Manuais (configurar no Railway Dashboard)
```bash
# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_here
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
NODE_ENV=production

# CORS (será o URL do seu app Railway)
CORS_ORIGIN=https://your-app-name.railway.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

## Passos para Deploy

1. **Criar conta no Railway**: https://railway.app
2. **Conectar repositório GitHub**
3. **Adicionar PostgreSQL addon**
4. **Configurar variáveis de ambiente** (acima)
5. **Deploy automático será executado**

## Configurações do Projeto

- **Build Command**: `npm run build` (no diretório server)
- **Start Command**: `npm start` (no diretório server)
- **Root Directory**: `server`
- **Port**: `$PORT` (automático)

## Estrutura de Deploy

```
Railway Service
├── PostgreSQL Database (addon)
├── Server (Node.js + Express)
└── Static Files (React build)
```

## URLs Importantes

- **API**: https://your-app-name.railway.app/api
- **Health Check**: https://your-app-name.railway.app/health
- **Frontend**: Será servido pelo mesmo domínio

## Monitoramento

- Railway Dashboard mostra logs em tempo real
- Health check endpoint para monitoramento
- Métricas de performance automáticas
