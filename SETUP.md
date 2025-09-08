# 🚀 Guia de Instalação e Execução - Budget App

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Docker** e **Docker Compose** (opcional, mas recomendado)
- **Git**

## 🛠️ Instalação

### 1. Clone e navegue para o projeto
```bash
cd C:\src\budget
```

### 2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
copy .env.example .env

# Edite o arquivo .env com suas configurações
# DATABASE_URL, JWT_SECRET, etc.
```

### 3. Opção A: Executar com Docker (Recomendado)

```bash
# Instalar dependências e executar tudo
npm run docker:up
```

Isso irá:
- ✅ Criar e configurar o banco PostgreSQL
- ✅ Instalar dependências do server e client
- ✅ Executar server na porta 3001
- ✅ Executar client na porta 5173

### 3. Opção B: Executar manualmente

#### Backend (Server)
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Frontend (Client)
```bash
# Em outro terminal
cd client
npm install
npm run dev
```

## 🌐 Acessar a aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Prisma Studio**: `npm run prisma:studio` (porta 5555)

## 📱 Funcionalidades Disponíveis

### ✅ Implementado
- Autenticação completa (login/registro)
- Dashboard responsivo
- Layout com navegação
- Estrutura de banco de dados
- APIs seguras com JWT
- Docker containerizado

### 🔄 Próximos passos
- CRUD de contas
- CRUD de categorias
- CRUD de transações
- Gráficos e relatórios
- Exportação de dados
- Testes automatizados

## 🚢 Deploy

### Railway (Recomendado)
1. Conecte seu repositório ao Railway
2. Configure as variáveis de ambiente
3. Deploy automático!

### Render
1. Conecte seu repositório ao Render
2. Configure o build: `npm run build:server`
3. Configure start: `npm run start:server`

## 🔧 Comandos Úteis

```bash
# Instalar todas as dependências
npm run install:all

# Executar desenvolvimento
npm run dev:server    # Server apenas
npm run dev:client     # Client apenas

# Build para produção
npm run build:server
npm run build:client

# Docker
npm run docker:up      # Subir containers
npm run docker:down    # Parar containers

# Banco de dados
npm run prisma:generate  # Gerar client
npm run prisma:migrate   # Executar migrações
npm run prisma:studio    # Interface visual
```

## 🆘 Solução de Problemas

### Erro de dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro no banco de dados
```bash
# Reset do banco
cd server
npx prisma migrate reset
```

### Erro no Docker
```bash
# Rebuild completo
docker-compose down -v
docker-compose up --build
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todas as dependências estão instaladas
2. Confirme se as portas 3001, 5173 e 5432 estão livres
3. Verifique as variáveis de ambiente no arquivo `.env`
4. Consulte os logs do Docker: `docker-compose logs`

**Aplicação criada com ❤️ usando React, Node.js, TypeScript, Prisma e Docker**
