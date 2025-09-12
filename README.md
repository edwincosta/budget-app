# Budget App 💰

Aplicativo web completo de gerenciamento de orçamento pessoal com **arquitetura budget-centric** e cliente-servidor.

> **🏗️ Arquitetura Budget-Centric**: Todos os dados pertencem a um orçamento específico, garantindo isolamento total e suporte nativo a compartilhamento com permissões granulares.

## 🚀 Tecnologias

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Query (state management)
- React Hook Form (forms)
- Recharts (gráficos)
- React Context API (BudgetContext)

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication
- bcrypt (hash de senhas)
- Helmet + CORS (segurança)
- Multer (upload de arquivos)
- File Processing: csv-parser, pdf-parse, iconv-lite

### DevOps
- Docker & Docker Compose
- Railway/Render ready

## 🏗️ Estrutura do Projeto

```
budget/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API calls
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utilitários
│   ├── public/
│   └── package.json
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── controllers/   # Lógica de negócio
│   │   ├── routes/        # Rotas da API
│   │   ├── middleware/    # Middlewares
│   │   ├── models/        # Modelos de dados
│   │   └── utils/         # Utilitários
│   ├── prisma/           # Schema do banco
│   └── package.json
├── docker-compose.yml    # Configuração Docker
└── .env.example         # Variáveis de ambiente
```

## 🔧 Como executar

### Desenvolvimento
```bash
# Clone e instale dependências
cd budget
npm run install:all

# Execute com Docker
docker-compose up --build

# Ou execute manualmente
npm run dev:server    # Backend na porta 3001
npm run dev:client    # Frontend na porta 5173
```

### Produção
```bash
# Build e execute
docker-compose -f docker-compose.prod.yml up --build
```

## 📱 Funcionalidades

### 🔐 Sistema de Autenticação e Orçamentos
- ✅ Autenticação segura (JWT)
- ✅ Múltiplos orçamentos por usuário
- ✅ **Sistema de Compartilhamento Avançado** 🤝
  - Convites para outros usuários com permissões granulares
  - **OWNER**: Acesso total + gestão de compartilhamentos
  - **WRITE**: Criar/editar/excluir dados (exceto compartilhamento)
  - **READ**: Apenas visualização
  - Interface responsiva para gestão de acesso

### 💰 Gestão Financeira
- ✅ Dashboard responsivo com análises financeiras
- ✅ Gestão completa de receitas e despesas
- ✅ Categorização inteligente de transações
- ✅ Sistema de contas múltiplas (Corrente, Poupança, Cartão, Investimentos)
- ✅ Orçamentos mensais/trimestrais/anuais (planejado vs realizado)

### 📄 **Importação de Extratos Bancários** 🆕
- ✅ **Suporte a múltiplos formatos**: CSV, PDF, Excel
- ✅ **Bancos brasileiros suportados**: 
  - Nubank, BTG Pactual, Bradesco, Itaú
  - C6 Bank, Clear, Inter, XP Investimentos
- ✅ **Detecção automática de duplicatas**
- ✅ **Classificação manual** de transações importadas
- ✅ **Filtro por período de datas** (opcional)
- ✅ **Detecção automática de encoding** (UTF-8, ISO-8859-1)
- ✅ **Gestão de sessões de importação** com status

### 📊 Análises e Relatórios
- ✅ Gráficos e relatórios avançados
- ✅ Exportação de dados (CSV)
- ✅ Análise orçado vs realizado
- ✅ Design responsivo e moderno
- ✅ PWA ready

## 🚢 Deploy

Este projeto está configurado para deploy em:
- **Railway** (recomendado)
- **Render**
- **Vercel** (frontend only)

## 📄 Licença

MIT License
