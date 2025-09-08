# Budget App 💰

Aplicativo web completo de gerenciamento de orçamento pessoal com arquitetura cliente-servidor.

## 🚀 Tecnologias

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Query (state management)
- React Hook Form (forms)
- Recharts (gráficos)

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication
- bcrypt (hash de senhas)
- Helmet + CORS (segurança)

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

- ✅ Autenticação segura (JWT)
- ✅ Dashboard responsivo com análises financeiras
- ✅ Gestão completa de receitas e despesas
- ✅ Categorização inteligente de transações
- ✅ Sistema de contas múltiplas
- ✅ Orçamentos mensais/trimestrais/anuais
- ✅ **Sistema de Compartilhamento** 🤝
  - Convites para outros usuários
  - Permissões granulares (READ/WRITE)
  - Gestão de acesso e revogação
  - Interface responsiva para mobile
- ✅ Gráficos e relatórios avançados
- ✅ Exportação de dados (CSV)
- ✅ Design responsivo e moderno
- ✅ PWA ready

## 🚢 Deploy

Este projeto está configurado para deploy em:
- **Railway** (recomendado)
- **Render**
- **Vercel** (frontend only)

## 📄 Licença

MIT License
