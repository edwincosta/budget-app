# Budget App - GitHub Copilot Instructions

> **🤖 ATENÇÃO**: Este arquivo é automaticamente carregado pelo GitHub Copilot no VS Code.
> Todas as instruções aqui são seguidas automaticamente sem necessidade de referência manual.

## 🎯 Arquitetura e Stack Tecnológico
- **Architecture**: Budget-centric design (all entities belong to a budget)
- **Tech Stack**: React + TypeScript + Node.js + PostgreSQL + Prisma
- **Auth System**: JWT with budget-level permissions (READ/WRITE/OWNER)
- **Primary Context**: `.github/copilot/copilot-context.md` (documentação completa)

## 🚨 REGRAS OBRIGATÓRIAS PARA QUALQUER ALTERAÇÃO
[!IMPORTANT]
### 🐳 Ambiente Docker
- **Todo desenvolvimento e testes devem ser realizados em containers Docker**. Utilize sempre o `docker-compose.yml` para subir cliente, servidor e banco de dados.
- **Scripts, comandos e exemplos devem assumir que os serviços estão rodando em containers.**

### 👤 Usuários de Teste Padrão
- Utilize sempre os seguintes usuários para testes automatizados e exemplos:
	- joao@example.com
	- maria@example.com
	- pedro@example.com
- Senha padrão para todos: `123456`

### 📋 **PROTOCOLO PRÉ-DESENVOLVIMENTO**
1. **SEMPRE consulte `.github/copilot/copilot-context.md`** - Fonte única de verdade
2. **Leia `.github/copilot/instructions/development-rules.md`** - Regras técnicas
3. **Use `.github/copilot/instructions/development-checklist.md`** - Checklist completo
4. **Verifique padrões de responsividade** - Mobile-first obrigatório
5. **Considere sistema de compartilhamento** - Orçamentos compartilhados obrigatório
6. **Valide permissões** - READ vs WRITE em orçamentos compartilhados
7. **Mantenha isolamento por orçamento** - Dados nunca podem vazar entre orçamentos

### 🛠️ **DURANTE O DESENVOLVIMENTO**

#### **Responsividade (OBRIGATÓRIO)**
- **Container padrão**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Breakpoints**: mobile(<768px), tablet(768-1024px), desktop(>1024px)
- **Design mobile-first** sempre
- **Grid/flex responsivo** apropriado

#### **Sistema de Compartilhamento (OBRIGATÓRIO)**
- **Props obrigatórias**: `budgetId?: string` em componentes
- **Rotas duplas**: `/api/resource` e `/api/budgets/:budgetId/resource`
- **Banner informativo** para orçamentos compartilhados
- **Verificação de permissões**: READ/WRITE/OWNER
- **Desabilitar funcionalidades** para usuários READ-only
- **Usar BudgetContext**: `activeBudget?.budgetId`

#### **Segurança e Isolamento (CRÍTICO)**
- **Middleware obrigatório**: `auth`, `budgetAuth`, `requireWritePermission`
- **Filtros por orçamento** em todas as consultas SQL
- **Validação de entidades** pertencentes ao orçamento correto
- **TypeScript estrito** - sem `any` types
- **Tratamento de erros** apropriado
- **Validação de dados** com Joi/Zod

### 🔄 **PÓS-DESENVOLVIMENTO (OBRIGATÓRIO)**
1. **CRITICAL: Atualizar `.github/copilot/copilot-context.md`** com mudanças
2. **Documentar novas funcionalidades** na seção apropriada
3. **Adicionar exemplos de código** se necessário
4. **Registrar data da atualização** no final do arquivo
5. **Testar responsividade** (mobile, tablet, desktop)
6. **Testar compartilhamento** com permissões READ e WRITE

## 🏗️ **ARQUITETURA BUDGET-CENTRIC**

### **Princípios Fundamentais**
1. **Tudo pertence a um orçamento** - Nunca criar entidades órfãs
2. **Isolamento total** - Dados de orçamentos diferentes nunca se misturam
3. **Permissões granulares** - READ/WRITE respeitadas em toda interface
4. **Validação multicamada** - Frontend + Middleware + Controller + Database

### **Padrões de API**
```typescript
// Orçamento próprio
GET /api/accounts
POST /api/transactions

// Orçamento compartilhado  
GET /api/budgets/:budgetId/accounts
POST /api/budgets/:budgetId/transactions
```

### **Padrões de Interface**
```typescript
// Sempre verificar permissões
const { activeBudget, isOwner } = useBudget();
const hasWritePermission = activeBudget?.permission === 'WRITE' || activeBudget?.permission === 'OWNER';
```

## 🧰 Templates Disponíveis
- `budget-route` - Express route with auth middleware
- `budget-component` - React component template  
- `budget-model` - Prisma model template
- `budget-service` - API service template

## 📁 Arquivos de Contexto Detalhado
- **`.github/copilot/copilot-context.md`** - Documentação completa (1700+ linhas)
- **`.github/copilot/copilot-examples.md`** - Exemplos práticos
- **`.github/copilot/copilot-config.md`** - Configurações e snippets
- **`.github/copilot/instructions/`** - Regras e checklists específicos

---
**⚡ LEMBRE-SE**: Este arquivo garante que o GitHub Copilot siga automaticamente todas as diretrizes do projeto Budget App sem necessidade de referência manual.
