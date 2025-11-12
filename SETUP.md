# �️ Setup do Budget App - Render + Supabase

Este guia explica como configurar o Budget App para desenvolvimento e produção usando **Render + Supabase**.

## 🎯 Arquitetura de Deploy

- **Frontend**: Render Static Site
- **Backend**: Render Docker Container
- **Database**: Supabase PostgreSQL (Gratuito)
- **Custo Total**: **$0/mês**

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Git](https://git-scm.com/)
- Conta [GitHub](https://github.com/)
- Conta [Supabase](https://supabase.com/) (gratuita)
- Conta [Render](https://render.com/) (gratuita)

## 🛠️ Instalação

### 1. Clone e navegue para o projeto

```bash
cd C:\src\budget
```

### 2. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
## 🗄️ PASSO 1: Setup do Database (Supabase)

### 1.1 Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Clique em **"Start your project"**
3. Faça login com GitHub
4. Clique em **"New project"**
5. Configure:
   - **Name**: `budget-app-prod`
   - **Database Password**: Anote uma senha forte
   - **Region**: `South America (São Paulo)`
   - **Pricing Plan**: **Free** (2 projetos gratuitos)
6. Clique em **"Create new project"**
7. Aguarde 2-3 minutos para o projeto ser criado

### 1.2 Criar Schema do Banco

1. No dashboard do Supabase, vá em **"SQL Editor"**
2. Clique em **"New query"**
3. Copie todo o conteúdo do arquivo `server/create-tables.sql`
4. Cole no SQL Editor
5. Clique em **"Run"** para executar
6. Verifique se todas as tabelas foram criadas na aba **"Table Editor"**

### 1.3 Obter Connection String

1. Vá em **Settings → Database**
2. Na seção **"Connection string"**, copie a **Connection pooling** URL:
```

postgresql://postgres.projeto:senha@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

````

## 🐳 PASSO 2: Deploy do Backend (Render Docker)

### 2.1 Criar Web Service

1. Acesse https://render.com
2. Faça login com sua conta GitHub
3. Clique em **"New +"** → **"Web Service"**
4. Conecte seu repositório `seu-usuario/budget-app`

### 2.2 Configurar Serviço

**Configurações básicas:**
- **Name**: `budget-app-docker-server`
- **Branch**: `client`
- **Language**: `Docker`
- **Root Directory**: `server`
- **Dockerfile Path**: `Dockerfile.production`
- **Docker Build Context Directory**: `./`

**Instance Type:** `Free`

### 2.3 Environment Variables

Clique em **"Add Environment Variable"** e adicione:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres.esgxdyazrnozmsjpgtxz:SUA_SENHA@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=budget_app_super_secret_jwt_key_production_2024_minimum_32_characters_long
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
````

> ⚠️ **Importante**: Substitua `SUA_SENHA` e o host pela sua connection string do Supabase

### 2.4 Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build Docker (5-10 minutos)
3. Quando estiver **Live**, anote a URL (ex: `https://budget-app-docker-server-xxxx.onrender.com`)

## 🌐 PASSO 3: Deploy do Frontend (Render Static Site)

### 3.1 Criar Static Site

1. No Render, clique em **"New +"** → **"Static Site"**
2. Conecte o mesmo repositório `seu-usuario/budget-app`

### 3.2 Configurar Static Site

**Configurações básicas:**

- **Name**: `budget-app-client`
- **Branch**: `client`
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### 3.3 Environment Variables

Adicione a variável:

```bash
VITE_API_URL=https://budget-app-docker-server-xxxx.onrender.com
```

> ⚠️ Use a URL exata do seu backend do passo anterior

### 3.4 Deploy

1. Clique em **"Create Static Site"**
2. Aguarde o build (2-5 minutos)
3. Quando estiver **Live**, anote a URL (ex: `https://budget-app-client-xxxx.onrender.com`)

## � PASSO 4: Configurar CORS

### 4.1 Atualizar Backend

1. No serviço **backend** do Render, vá em **Settings → Environment Variables**
2. Adicione/edite a variável:
   ```bash
   CORS_ORIGIN=https://budget-app-client-xxxx.onrender.com
   ```
3. Use a URL exata do seu frontend
4. **Save Changes** e aguarde redeploy automático

## ✅ PASSO 5: Teste Final

### 5.1 Verificar APIs

1. Teste o backend: `https://seu-backend.onrender.com/api/test`
2. Deve retornar JSON com informações do sistema

### 5.2 Teste Completo da Aplicação

1. Acesse seu frontend: `https://seu-frontend.onrender.com`
2. **Crie uma conta** de teste
3. **Faça login**
4. **Crie um orçamento**
5. **Adicione uma conta bancária**
6. **Crie uma transação**

## 🛠️ Desenvolvimento Local

### Setup Rápido com Docker

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/budget-app.git
cd budget-app

# Configure variáveis locais
cp server/.env.example server/.env
# Edite server/.env com DATABASE_URL local

# Suba o ambiente
docker-compose up -d

# Aplicação estará disponível:
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Setup Manual

1. **Backend**:

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Configure DATABASE_URL no .env
   npx prisma migrate dev
   npm run seed
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 👥 Usuários de Teste

O sistema seed cria automaticamente:

- **Email**: joao@example.com, maria@example.com, pedro@example.com
- **Senha**: 123456

## 🔄 Atualizações e Deploy Contínuo

### Auto-Deploy

Ambos os serviços estão configurados para **deploy automático**:

- Qualquer push na branch `client` dispara novo deploy
- Backend: Build Docker + redeploy
- Frontend: Build estático + deploy

### Deploy Manual

Se necessário, force um redeploy:

1. Vá na aba **"Deploys"** do serviço
2. Clique em **"Deploy latest commit"**

## 🐛 Troubleshooting

### Backend não conecta no banco

- Verifique se a `DATABASE_URL` está correta
- Confirme se o projeto Supabase está ativo
- Use o **pooler** ao invés da conexão direta

### Frontend não acessa a API

- Verifique se `VITE_API_URL` está correto
- Confirme se `CORS_ORIGIN` foi configurado no backend
- Teste a API diretamente no navegador

### Build falha

- Verifique se não há arquivos de teste sendo compilados
- Confirme se todas as dependencies estão no `package.json`
- Cheque os logs de build para erros específicos

## 📚 Links Úteis

- **Supabase Docs**: https://supabase.com/docs
- **Render Docs**: https://render.com/docs
- **Prisma Docs**: https://www.prisma.io/docs

## 🌐 URLs de Produção

Após o deploy completo, suas URLs serão:

- **Frontend**: https://budget-app-docker-client.onrender.com (ou sua URL específica)
- **Backend API**: https://budget-app-docker-server.onrender.com (ou sua URL específica)
- **Health Check**: https://seu-backend.onrender.com/health
- **API Test**: https://seu-backend.onrender.com/api/test

## 💰 Resumo de Custos

| Serviço               | Plan                 | Custo      |
| --------------------- | -------------------- | ---------- |
| **Render Backend**    | Free (Docker)        | $0/mês     |
| **Render Frontend**   | Free (Static)        | $0/mês     |
| **Supabase Database** | Free                 | $0/mês     |
| **Domain**            | Render subdomain     | $0/mês     |
| **SSL**               | Auto (Let's Encrypt) | $0/mês     |
| **Total**             |                      | **$0/mês** |

---

**🎉 Parabéns!** Seu Budget App está rodando em produção com $0/mês de custo!

Se encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Confirme se as portas 3001, 5173 e 5432 estão livres
3. Verifique as variáveis de ambiente no arquivo `.env`
4. Consulte os logs do Docker: `docker-compose logs`

**Aplicação criada com ❤️ usando React, Node.js, TypeScript, Prisma e Docker**
