# 💰 Budget App - Sistema de Orçamentos Pessoais

> **Sistema completo de gerenciamento financeiro pessoal com arquitetura budget-centric**

## 🎯 Visão Geral

O Budget App é um sistema moderno de gestão financeira pessoal que permite criar múltiplos orçamentos, gerenciar contas bancárias, categorizar transações, compartilhar orçamentos e importar extratos bancários automaticamente.

### 🌟 Funcionalidades Principais

- ✅ **Gestão de Múltiplos Orçamentos** - Crie e gerencie vários orçamentos (pessoal, familiar, negócios)
- ✅ **Contas Bancárias** - Suporte a conta corrente, poupança, cartão de crédito, investimentos
- ✅ **Categorização Inteligente** - Organize receitas e despesas por categorias personalizáveis
- ✅ **Compartilhamento de Orçamentos** - Compartilhe com permissões READ/WRITE
- ✅ **Importação de Extratos** - CSV, PDF e Excel de bancos brasileiros (Nubank, BTG, Bradesco, etc.)
- ✅ **Dashboard e Relatórios** - Análises financeiras e métricas em tempo real
- ✅ **Detecção de Duplicatas** - Sistema avançado para evitar lançamentos duplicados
- ✅ **Interface Responsiva** - Design mobile-first com Tailwind CSS

## 🏗️ Arquitetura

### Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Deploy**: Render (Docker + Static Site)
- **Auth**: JWT customizado

### Arquitetura Budget-Centric

Todo o sistema é organizado em torno de **orçamentos**:

- Cada usuário pode ter múltiplos orçamentos
- Todas as entidades (contas, transações, categorias) pertencem a um orçamento
- Isolamento total entre orçamentos
- Sistema de compartilhamento com permissões granulares

## 🚀 Deploy e Produção

### URLs de Produção

- **Frontend**: https://budget-app-docker-client.onrender.com
- **Backend API**: https://budget-app-docker-server.onrender.com
- **Database**: Supabase PostgreSQL

### Stack de Produção

- **Frontend**: Render Static Site
- **Backend**: Render Docker Container
- **Database**: Supabase PostgreSQL (Gratuito)
- **Custo Total**: $0/mês
  │ │ └── utils/ # Utilitários

## 📋 Guia de Deploy

### Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Conta no [Render](https://render.com)
- Repositório no GitHub

### 1. Setup do Database (Supabase)

1. **Criar projeto** no Supabase
2. **Executar SQL** do arquivo `server/create-tables.sql`
3. **Copiar** connection string do pooler

### 2. Deploy do Backend (Render Docker)

1. **Render** → New Web Service → Docker
2. **Configurar**:

   - Repository: `seu-usuario/budget-app`
   - Branch: `client`
   - Root Directory: `server`
   - Dockerfile Path: `Dockerfile.production`

3. **Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres.projeto:senha@pooler.supabase.com:6543/postgres?pgbouncer=true
   JWT_SECRET=sua_chave_secreta_32_caracteres_minimo
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   ```

### 3. Deploy do Frontend (Render Static Site)

1. **Render** → New Static Site
2. **Configurar**:

   - Repository: `seu-usuario/budget-app`
   - Branch: `client`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Publish Directory: `dist`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://seu-backend.onrender.com
   ```

### 4. Configurar CORS

**No backend Render**, adicionar:

```
CORS_ORIGIN=https://seu-frontend.onrender.com
```

## 🛠️ Desenvolvimento Local

### Usando Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/budget-app.git
cd budget-app

# Suba os serviços
docker-compose up -d

# Aplicação estará disponível em:
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# Database: PostgreSQL na porta 5432
```

### Setup Manual

1. **Database**:

   ```bash
   # PostgreSQL local ou usar Supabase
   createdb budget_db
   ```

2. **Backend**:

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Configurar DATABASE_URL no .env
   npx prisma migrate dev
   npm run seed
   npm run dev
   ```

3. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 👥 Usuários de Teste

Para testes em desenvolvimento, use:

- **Email**: joao@example.com, maria@example.com, pedro@example.com
- **Senha**: 123456

## 📚 Documentação Técnica

- **Contexto Copilot**: `.github/copilot/copilot-context.md`
- **Regras de Desenvolvimento**: `.github/copilot/instructions/development-rules.md`
- **Checklist**: `.github/copilot/instructions/development-checklist.md`
- **Schema Database**: `server/prisma/schema.prisma`

## 🔒 Segurança

- **Autenticação**: JWT com expiração configurável
- **Autorização**: Middleware de verificação de orçamento
- **Rate Limiting**: Proteção contra spam
- **Validação**: Joi para validação de dados
- **CORS**: Configurado para produção
- **Headers de Segurança**: Helmet configurado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## � Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

---

**🚀 Budget App** - Gerencie suas finanças com inteligência e simplicidade!
