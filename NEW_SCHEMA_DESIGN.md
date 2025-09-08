# Nova Estrutura de Orçamentos Compartilhados

## Conceitos Principais

### 1. Budget como Container Completo
- Cada Budget é uma entidade independente que contém **TODAS** as informações financeiras
- 1 usuário é proprietário de 1 Budget principal
- Quando compartilha, compartilha **TUDO**: contas, categorias, transações, itens de orçamento
- Usuário pode ter acesso a múltiplos Budgets compartilhados

### 2. Hierarquia de Dados
```
Budget (Orçamento) - TUDO é compartilhado
├── Owner (Proprietário)
├── Accounts (Contas) ✅ Compartilhadas
├── Categories (Categorias) ✅ Compartilhadas
├── Transactions (Transações) ✅ Compartilhadas
├── BudgetItems (Itens de orçamento) ✅ Compartilhadas
└── BudgetShares (Compartilhamentos)
```

### 3. Sistema de Compartilhamento GERAL
- BudgetShare: compartilha Budget **COMPLETO**
- Permissões simples: READ (visualizar) ou WRITE (editar)
- Não há permissões granulares por entidade
- Status de convite (PENDING, ACCEPTED, REJECTED, REVOKED)

### 4. Tipos de Permissão Simplificadas
```
READ: Pode visualizar tudo (contas, categorias, transações, orçamentos)
WRITE: Pode editar tudo (criar/editar/excluir contas, categorias, transações, orçamentos)
```

### 5. Seleção de Orçamento Ativo
- User.defaultBudgetId: orçamento padrão do usuário
- Sistema de "switch" entre orçamentos disponíveis
- Sessão mantém orçamento ativo selecionado

## Modelos Prisma Reformulados

### User
- Adicionar: defaultBudgetId
- Manter: dados pessoais e autenticação

### Budget (Reformulado)
- Container principal com nome e descrição
- Proprietário obrigatório
- Data de criação

### Account, Category, Transaction
- Relacionamento com Budget, não User diretamente
- User implícito através do Budget

### BudgetShare (Novo)
- Substitui UserShare
- Referência específica ao Budget
- Permissões simples: READ ou WRITE
- Compartilha TUDO do orçamento

### BudgetItem (Novo) 
- Substitui o atual Budget
- Representa item de orçamento dentro de um Budget
