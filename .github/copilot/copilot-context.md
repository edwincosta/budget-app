# 📋 GitHub Copilot Context - Sistema de Orçamentos Pessoais

## 🎯 VISÃO GERAL DO SISTEMA

O **Budget App** é um sistema completo de gerenciamento de orçamentos pessoais com arquitetura cliente-servidor, desenvolvido em **React + TypeScript** (frontend) e **Node.js + Express + TypeScript** (backend), utilizando **PostgreSQL** com **Prisma ORM**.

### Funcionalidades Principais
- ✅ Gestão de usuários com autenticação JWT
- ✅ Criação e gerenciamento de múltiplos orçamentos
- ✅ Sistema de contas bancárias por tipos
- ✅ Categorização de receitas e despesas
- ✅ Transações financeiras com validações
- ✅ Orçamentos planejados vs realizados
- ✅ Sistema de compartilhamento de orçamentos (READ/WRITE)
- ✅ Seleção de orçamento ativo (próprio ou compartilhado)
- ✅ Navegação entre orçamentos com persistência de seleção
- ✅ Relatórios e análises financeiras
- ✅ Dashboard com métricas

---

## 🏗️ ARQUITETURA DO PROJETO

```
budget/
├── client/                 # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── contexts/       # React Context (BudgetContext)
│   │   ├── components/     # Componentes reutilizáveis (BudgetSelector, ShareManager)
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # APIs e serviços
│   │   ├── types/          # Definições TypeScript
│   │   └── utils/          # Utilitários (cookies, formatação)
├── server/                 # Node.js + Express + Prisma + PostgreSQL
├── docker-compose.yml      # Containerização
└── Documentação           # .md files
```

### Stack Tecnológica
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Query, React Hook Form, Recharts, React Context API
**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT, bcrypt
**DevOps:** Docker, Docker Compose

---

## 📊 MODELO DE DADOS (Prisma Schema)

### Entidades Principais

#### 1. **User** - Usuários do sistema
```prisma
model User {
  id              String   # Identificador único (cuid)
  email           String   # Email único para login
  name            String   # Nome do usuário
  password        String   # Hash da senha (bcrypt)
  defaultBudgetId String?  # Orçamento padrão ativo
  
  # Relacionamentos
  ownedBudgets    Budget[] # Orçamentos criados pelo usuário
  sharedBudgets   BudgetShare[] # Orçamentos compartilhados com o usuário
  defaultBudget   Budget?  # Referência ao orçamento padrão
}
```

#### 2. **Budget** - Orçamentos (container principal)
```prisma
model Budget {
  id          String   # Identificador único
  name        String   # Nome do orçamento
  description String?  # Descrição opcional
  ownerId     String   # Proprietário do orçamento
  
  # Entidades filhas
  accounts     Account[]     # Contas bancárias
  categories   Category[]    # Categorias de receita/despesa
  transactions Transaction[] # Transações financeiras
  budgetItems  BudgetItem[]  # Orçamentos planejados por categoria
  shares       BudgetShare[] # Compartilhamentos
}
```

#### 3. **Account** - Contas bancárias
```prisma
model Account {
  id          String      # Identificador único
  name        String      # Nome da conta (ex: "Conta Corrente Banco X")
  type        AccountType # Tipo da conta
  balance     Decimal     # Saldo atual (precisão: 12,2)
  description String?     # Descrição opcional
  budgetId    String      # Pertence a um orçamento
  inactive    Boolean     # Indica quando está inativa
}

enum AccountType {
  CHECKING     # Conta corrente
  SAVINGS      # Poupança
  CREDIT_CARD  # Cartão de crédito
  INVESTMENT   # Investimentos
  CASH         # Dinheiro
}
```

#### 4. **Category** - Categorias de transações
```prisma
model Category {
  id       String       # Identificador único
  name     String       # Nome da categoria
  type     CategoryType # Tipo: receita ou despesa
  color    String       # Cor para UI (hex)
  icon     String?      # Ícone opcional
  budgetId String       # Pertence a um orçamento
  inactive Boolean    # Indica quando está inativa
}

enum CategoryType {
  INCOME   # Receita
  EXPENSE  # Despesa
}
```

#### 5. **Transaction** - Transações financeiras
```prisma
model Transaction {
  id          String          # Identificador único
  description String          # Descrição da transação
  amount      Decimal         # Valor (precisão: 12,2)
  type        TransactionType # Tipo da transação
  date        DateTime        # Data da transação
  accountId   String          # Conta de origem
  categoryId  String          # Categoria
  budgetId    String          # Orçamento
}

enum TransactionType {
  INCOME   # Receita
  EXPENSE  # Despesa
  TRANSFER # Transferência entre contas
}
```

#### 6. **BudgetItem** - Orçamentos planejados
```prisma
model BudgetItem {
  id         String       # Identificador único
  amount     Decimal      # Valor planejado (precisão: 12,2)
  period     BudgetPeriod # Período do orçamento
  isActive   Boolean      # Se está ativo
  categoryId String       # Categoria associada
  budgetId   String       # Orçamento
}

enum BudgetPeriod {
  MONTHLY    # Mensal
  QUARTERLY  # Trimestral
  YEARLY     # Anual
}
```

#### 7. **BudgetShare** - Sistema de compartilhamento
```prisma
model BudgetShare {
  id           String          # Identificador único
  budgetId     String          # Orçamento compartilhado
  sharedWithId String          # Usuário que recebe o compartilhamento
  permission   SharePermission # Nível de permissão
  status       ShareStatus     # Status do convite
}

enum SharePermission {
  READ   # Somente visualização
  WRITE  # Visualização e edição
}

enum ShareStatus {
  PENDING   # Convite pendente
  ACCEPTED  # Convite aceito
  REJECTED  # Convite rejeitado
  REVOKED   # Acesso revogado
}
```

---

## 🔐 SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO

### Middleware de Autenticação
- **`auth`**: Valida JWT token e extrai dados do usuário
- **`budgetAuth`**: Verifica acesso a orçamentos específicos
- **`requireWritePermission`**: Exige permissão de escrita
- **`requireOwnership`**: Exige ser proprietário do orçamento

### Hierarquia de Permissões
1. **OWNER**: Proprietário - acesso total (CRUD + compartilhamento)
2. **WRITE**: Escrita - pode criar/editar/excluir dados (exceto compartilhamento)
3. **READ**: Leitura - apenas visualização

### Fluxo de Autorização
```typescript
// 1. Autenticação básica
router.use(auth); // Valida JWT

// 2. Autorização de orçamento (quando aplicável)
router.use('/:budgetId/*', budgetAuth); // Valida acesso ao orçamento

// 3. Permissões específicas
router.post('/', requireWritePermission); // Para criação
router.delete('/', requireOwnership);     // Para deleção
```

---

## 🛣️ ROTAS E ENDPOINTS DA API

### **Auth Routes** (`/api/auth`)
```typescript
POST /register    # Criar nova conta
POST /login       # Fazer login
```

### **Users Routes** (`/api/users`)
```typescript
GET /profile      # Obter perfil do usuário logado
```

### **Budgets Routes** (`/api/budgets`)
```typescript
GET    /                    # Listar orçamentos (próprios + compartilhados)
POST   /                    # Criar novo orçamento
GET    /:budgetId          # Detalhes de um orçamento específico
PUT    /:budgetId          # Atualizar orçamento (somente proprietário)
DELETE /:budgetId          # Deletar orçamento (somente proprietário)
POST   /:budgetId/set-default # Definir como orçamento padrão

# Itens de orçamento (planejamento)
GET    /items              # Listar itens de orçamento do orçamento padrão
POST   /items              # Criar item de orçamento
PUT    /items/:itemId      # Atualizar item de orçamento
DELETE /items/:itemId      # Deletar item de orçamento

# Análises
GET    /analysis           # Análise orçado vs realizado
```

### **Accounts Routes** (`/api/accounts`)
```typescript
GET    /         # Listar contas do orçamento padrão
POST   /         # Criar nova conta
PUT    /:id      # Atualizar conta
DELETE /:id      # Deletar conta (se não tiver transações)
```

### **Categories Routes** (`/api/categories`)
```typescript
GET    /         # Listar categorias do orçamento padrão
POST   /         # Criar nova categoria
PUT    /:id      # Atualizar categoria
DELETE /:id      # Deletar categoria (se não tiver transações)
```

### **Transactions Routes** (`/api/transactions`)
```typescript
GET    /         # Listar transações do orçamento padrão
POST   /         # Criar nova transação
PUT    /:id      # Atualizar transação
DELETE /:id      # Deletar transação
```

### **Sharing Routes** (`/api/sharing`)
```typescript
POST   /invite                       # Enviar convite de compartilhamento
GET    /invitations                  # Listar convites recebidos
GET    /sent                         # Listar convites enviados
PUT    /respond/:shareId             # Responder a convite (aceitar/rejeitar)
GET    /active                       # Listar compartilhamentos ativos
DELETE /:shareId                     # Revogar compartilhamento

# Rotas legacy (compatibilidade)
POST   /:budgetId/share              # Compartilhar orçamento específico
```

### **Reports Routes** (`/api/reports`)
```typescript
GET /comparison           # Comparação de períodos
GET /monthly-detail       # Detalhes mensais
GET /performance         # Análise de performance
```

### **Dashboard Routes** (`/api/dashboard`)
```typescript
GET /stats               # Estatísticas do orçamento padrão
GET /overview           # Visão geral financeira
```

### **Rotas com Suporte a Orçamento Específico**
```typescript
# Todas as rotas abaixo também funcionam com orçamento específico:

# Contas de um orçamento específico
GET    /budgets/:budgetId/accounts
POST   /budgets/:budgetId/accounts
PUT    /budgets/:budgetId/accounts/:id
DELETE /budgets/:budgetId/accounts/:id

# Categorias de um orçamento específico  
GET    /budgets/:budgetId/categories
POST   /budgets/:budgetId/categories
PUT    /budgets/:budgetId/categories/:id
DELETE /budgets/:budgetId/categories/:id

# Transações de um orçamento específico
GET    /budgets/:budgetId/transactions
POST   /budgets/:budgetId/transactions
PUT    /budgets/:budgetId/transactions/:id
DELETE /budgets/:budgetId/transactions/:id

# Itens de orçamento específico
GET    /budgets/:budgetId/items
POST   /budgets/:budgetId/items
PUT    /budgets/:budgetId/items/:id
DELETE /budgets/:budgetId/items/:id

# Dashboard e relatórios de orçamento específico
GET    /budgets/:budgetId/dashboard/stats
GET    /budgets/:budgetId/reports
GET    /budgets/:budgetId/reports/export
GET    /budgets/:budgetId/reports/forecast
GET    /budgets/:budgetId/analysis

# Middleware budgetAuth valida automaticamente:
# - Se usuário é proprietário → permissão total
# - Se usuário tem acesso compartilhado → conforme permissão (READ/WRITE)
# - Caso contrário → erro 403
```

---

## 📋 REGRAS DE NEGÓCIO ESSENCIAIS

### 1. **Orçamentos e Acesso**
- ✅ Cada usuário pode ter múltiplos orçamentos
- ✅ Todo usuário tem um "orçamento padrão" (defaultBudgetId)
- ✅ Primeiro orçamento criado automaticamente vira padrão
- ✅ Orçamentos podem ser compartilhados com outros usuários
- ✅ Somente proprietário pode compartilhar e deletar orçamentos
- ✅ Não é possível deletar orçamento que é padrão de algum usuário

### 2. **Contas Bancárias**
- ✅ Cada conta pertence a um orçamento específico
- ✅ Tipos suportados: CHECKING, SAVINGS, CREDIT_CARD, INVESTMENT, CASH
- ✅ Saldo calculado automaticamente com base nas transações
- ✅ Não é possível deletar conta com transações associadas

### **FLUXO COMPLETO DE NAVEGAÇÃO ENTRE ORÇAMENTOS**

#### **1. Inicialização do Sistema**
```
App.tsx → BudgetProvider carrega:
├── Orçamentos compartilhados (sharingService.getActiveShares)
├── Restaura seleção do cookie (active_budget_id)
└── Define orçamento ativo (próprio ou compartilhado)
```

#### **2. Seleção de Orçamento**
```
BudgetSelector.tsx permite escolher:
├── 🏠 "Meu Orçamento" (dados próprios - activeBudget = null)
├── 📊 Orçamento Compartilhado A (permission: READ)
├── 📊 Orçamento Compartilhado B (permission: WRITE)
└── Salva escolha em cookie automaticamente
```

#### **3. Navegação nas Páginas**
```
Todas as páginas (Dashboard, Accounts, Categories, Transactions, Reports):
├── Usam useBudget() para obter contexto
├── Exibem banner quando em orçamento compartilhado
├── Chamam APIs com budgetId correto
├── Aplicam controles de permissão (READ/WRITE)
└── Atualizam dados automaticamente ao trocar orçamento
```

#### **4. Fluxo de API**
```
Frontend: accountService.getAccounts(budgetId)
├── budgetId = null → GET /api/accounts (orçamento próprio)
└── budgetId = "123" → GET /api/budgets/123/accounts (compartilhado)

Backend: budgetAuth middleware valida:
├── É proprietário? → Acesso total
├── Tem compartilhamento? → Conforme permissão
└── Não autorizado → 403 Forbidden
```
- ✅ Nome único por orçamento não é obrigatório (pode ter contas com mesmo nome)
- ✅ É possível desativar uma conta com transações associadas

### 3. **Categorias**
- ✅ Cada categoria pertence a um orçamento específico
- ✅ Tipos: INCOME (receita) ou EXPENSE (despesa)
- ✅ Nome único por orçamento (constraint no banco)
- ✅ Cor padrão: #3B82F6 (azul)
- ✅ Não é possível deletar categoria com transações associadas
- ✅ É possível desativar uma categoria com transações associadas

### 4. **Transações**
- ✅ Cada transação pertence a um orçamento, conta e categoria
- ✅ Tipos: INCOME, EXPENSE, TRANSFER
- ✅ Validação: conta e categoria devem pertencer ao mesmo orçamento
- ✅ Validação: conta e categoria devem devem estar ativos
- ✅ Valores sempre positivos (tipo define se é entrada ou saída)
- ✅ Atualização automática do saldo das contas (não implementado ainda)

### 5. **Itens de Orçamento (Planejamento)**
- ✅ Define quanto planeja gastar/receber por categoria
- ✅ Períodos: MONTHLY, QUARTERLY, YEARLY
- ✅ Somente um item ativo por categoria/orçamento (constraint unique)
- ✅ Usado para comparar planejado vs realizado

### 6. **Sistema de Compartilhamento e Orçamento Ativo**
- ✅ Usuário pode enviar convites para seu orçamento padrão por email
- ✅ Convite via email (usuário deve existir no sistema)
- ✅ Status: PENDING → ACCEPTED/REJECTED/REVOKED
- ✅ Permissões: READ (visualizar) ou WRITE (editar)
- ✅ Não é possível compartilhar consigo mesmo
- ✅ Não pode haver compartilhamentos duplicados (constraint unique)
- ✅ **Seleção de Orçamento Ativo**: Usuário pode escolher qual orçamento visualizar:
  - Orçamento próprio (padrão)
  - Orçamentos compartilhados com ele (com permissões READ/WRITE)
- ✅ **Persistência de Seleção**: A escolha do orçamento ativo é salva em cookies
- ✅ **Contexto Global**: BudgetContext gerencia o estado do orçamento ativo
- ✅ **Indicador Visual**: Banner informativo mostra qual orçamento está sendo visualizado
- ✅ **Permissões Dinâmicas**: Interface adapta-se às permissões do usuário no orçamento ativo
- ✅ Interface responsiva com três seções:
  - Convites recebidos (aceitar/rejeitar)
  - Convites enviados (visualizar status + revogar se PENDING/ACCEPTED)
  - Compartilhamentos ativos (separados por "compartilhados por mim" e "comigo")
- ✅ Ações baseadas em status: PENDING (revogar), ACCEPTED (remover acesso), REJECTED/REVOKED (visualização)

### 7. **Validações de Segurança**
- ✅ Usuário só acessa dados de orçamentos que possui ou que foram compartilhados
- ✅ Todas as operações validam se entidades pertencem ao orçamento correto
- ✅ JWT token obrigatório para todas as operações (exceto register/login)
- ✅ Senhas hasheadas com bcrypt (salt 12)

---

## 🔄 FLUXOS DE TRABALHO PRINCIPAIS

### 1. **Novo Usuário**
```
1. POST /api/auth/register (nome, email, senha)
2. POST /api/auth/login (email, senha) → JWT token
3. POST /api/budgets (criar primeiro orçamento) → automaticamente vira padrão
4. POST /api/accounts (criar contas)
5. POST /api/categories (criar categorias)
```

### 2. **Compartilhamento de Orçamento**
```
Usuário proprietário (enviando convite):
1. POST /api/sharing/invite (email, permission) → envia convite para orçamento padrão
2. GET /api/sharing/sent → acompanha status dos convites enviados
3. DELETE /api/sharing/:shareId → revoga compartilhamento (se PENDING ou ACCEPTED)

Usuário convidado:
1. GET /api/sharing/invitations → ver convites recebidos pendentes
2. PUT /api/sharing/respond/:shareId (action: "accept"/"reject") → responder convite
3. GET /api/sharing/active → visualizar orçamentos compartilhados comigo

Ambos:
4. GET /api/sharing/active → ver todos compartilhamentos ativos (sharedByMe + sharedWithMe)
```

### 3. **Registro de Transação**
```
1. GET /api/accounts (escolher conta)
2. GET /api/categories (escolher categoria)
3. POST /api/transactions (dados da transação)
   - Validação: conta e categoria pertencem ao orçamento do usuário
```

### 4. **Planejamento Orçamentário**
```
1. GET /api/categories (listar categorias)
2. POST /api/budgets/items (definir valor planejado por categoria)
3. GET /api/budgets/analysis (comparar planejado vs realizado)
```

### 5. **Navegação entre Orçamentos (Orçamento Ativo)**
```
Cliente (Frontend):
1. BudgetContext carrega orçamentos disponíveis automaticamente
2. BudgetSelector permite escolher: "Meu Orçamento" ou orçamentos compartilhados
3. Seleção é persistida em cookies (active_budget_id)
4. Todas as APIs passam budgetId quando necessário

Backend (rotas com suporte a orçamento específico):
- GET /api/budgets/:budgetId/accounts
- GET /api/budgets/:budgetId/categories  
- GET /api/budgets/:budgetId/transactions
- GET /api/budgets/:budgetId/dashboard/stats
- GET /api/budgets/:budgetId/reports
- POST/PUT/DELETE em /api/budgets/:budgetId/* (com verificação de permissão)
```

---

## 🧩 COMPONENTES E HOOKS PRINCIPAIS (Frontend)

### **BudgetContext** (`/contexts/BudgetContext.tsx`)
Context React que gerencia o estado global do orçamento ativo:
```typescript
interface BudgetContextType {
  availableBudgets: UserShare[];      # Orçamentos compartilhados disponíveis
  activeBudget: UserShare | null;     # Orçamento atualmente ativo (null = próprio)
  isOwner: boolean;                   # Se usuário é proprietário do orçamento ativo
  setActiveBudget: (budget) => void;  # Alterar orçamento ativo
  refreshAvailableBudgets: () => Promise<void>; # Recarregar lista
  loading: boolean;                   # Estado de carregamento
}
```

### **BudgetSelector** (`/components/BudgetSelector.tsx`)
Componente dropdown para seleção de orçamento ativo:
- 🏠 "Meu Orçamento" (dados próprios)
- 📊 Orçamentos compartilhados (com nome do proprietário + permissão)
- Salva seleção em cookies automaticamente

### **ShareManager** (`/components/ShareManager.tsx`) 
Interface completa de compartilhamento com:
- Lista de convites recebidos (aceitar/rejeitar)
- Lista de convites enviados (status + ações)
- Compartilhamentos ativos (separados por direção)

### **Modificações nas Páginas Principais**
Todas as páginas foram atualizadas para usar o contexto de orçamento ativo:

#### **Dashboard.tsx**
- Usa `useBudget()` para obter orçamento ativo
- Chama `dashboardService.getStats(budgetId)` com contexto
- Exibe banner informativo para orçamentos compartilhados
- Controla permissões para criação rápida de transações

#### **Accounts.tsx**
- Integra com `accountService.getAccounts(budgetId)`
- Desabilita botões de criar/editar/excluir conforme permissões
- Banner informativo quando em orçamento compartilhado

#### **Categories.tsx** 
- Usa `categoryService.getCategories(budgetId)`
- Controles de permissão para CRUD de categorias
- Banner contextual com informações do orçamento

#### **Transactions.tsx**
- Integra com `transactionService.getTransactions(budgetId)`
- Filtra contas e categorias do orçamento ativo
- Permissões para criar/editar baseadas no contexto

#### **Reports.tsx**
- Chama `reportService.getReports(budgetId)` com contexto de orçamento
- **5 tipos de relatórios completos** com suporte a orçamentos compartilhados:
  - **Visão Geral**: Dados mensais, categorias, resumo financeiro
  - **Orçamento**: BudgetAnalysis com `budgetId` - análise planejado vs realizado
  - **Comparação**: PerformanceComparison com `budgetId` - períodos comparativos  
  - **Previsões**: FinancialForecast com `budgetId` - projeções futuras
  - **Detalhado Diário**: MonthlyDetail com `budgetId` - análise por dia
- Banner informativo sempre visível para orçamentos compartilhados
- Todos os componentes recebem `activeBudget?.budget?.id` como prop

#### **Budgets.tsx**
- Mantém funcionalidade de gerenciar orçamento próprio
- ShareManager integrado para compartilhamentos
- BudgetSelector para navegar entre orçamentos

### **Hook useBudget**
Hook customizado que encapsula o uso do BudgetContext:
```typescript
export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within BudgetProvider');
  }
  return context;
};
```

### **Integração no App.tsx**
O BudgetProvider envolve toda a aplicação garantindo acesso global:
```typescript
function App() {
  return (
    <BudgetProvider>
      <Router>
        <Routes>
          {/* todas as rotas */}
        </Routes>
      </Router>
    </BudgetProvider>
  );
}
```

### **Padrão de Uso do Contexto**
```typescript
// Em qualquer página/componente
const { activeBudget, isOwner } = useBudget();

// Chamadas de API com orçamento ativo
const budgetId = activeBudget?.budget?.id;
const data = await accountService.getAccounts(budgetId);

// Controle de permissões na interface
{(isOwner || activeBudget?.permission === 'WRITE') && (
  <button>Editar</button>
)}
```

### **Banner Informativo**
Todas as páginas exibem banner quando navegando em orçamento compartilhado:
```typescript
{activeBudget && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <Users className="h-5 w-5 text-blue-600 mr-3" />
    <div>
      <h3>Visualizando: {activeBudget.budget?.name}</h3>
      <p>Por {activeBudget.budget?.owner?.name} • {activeBudget.permission}</p>
    </div>
  </div>
)}
```

### **Componentes de Relatórios Atualizados**

Todos os componentes de relatórios foram atualizados para suporte completo a orçamentos compartilhados:

#### **FinancialForecast** (`/components/FinancialForecast.tsx`)
```typescript
interface FinancialForecastProps {
  period: string;
  budgetId?: string; // ✅ Suporte a orçamento compartilhado
}
```
- **APIs Padronizadas**: 
  - `/api/reports/forecast` (orçamento próprio)
  - `/api/budgets/${budgetId}/reports/forecast` (compartilhado)
  - **Ambas retornam formato idêntico**: `{ data: { forecastData, summary } }`
- **Funcionalidades**: Previsões otimistas/pessimistas, tendências, recomendações
- **Simplificação**: Código único para ambos os tipos de orçamento

#### **BudgetAnalysis** (`/components/BudgetAnalysis.tsx`)
```typescript
interface BudgetAnalysisProps {
  period: string;
  budgetId?: string; // ✅ Atualizado para orçamentos compartilhados
}
```
- **APIs**: `/api/budgets/${budgetId}/analysis` para compartilhados
- **Funcionalidades**: Análise planejado vs realizado por categoria
- **Validação**: Middleware budgetAuth para permissões

#### **PerformanceComparison** (`/components/PerformanceComparison.tsx`)
```typescript
interface PerformanceComparisonProps {
  selectedPeriod: string;
  budgetId?: string; // ✅ Preparado para orçamentos compartilhados
}
```
- **APIs**: `/api/reports/comparison/${budgetId}` (rota existente)

#### **MonthlyDetail** (`/components/MonthlyDetail.tsx`)
```typescript
interface MonthlyDetailProps {
  selectedMonth: string;
  budgetId?: string; // ✅ Já preparado para orçamentos compartilhados
}
```
- **APIs**: `/api/reports/monthly-detail/${budgetId}` (rota existente)

### **Padrão de Integração nos Relatórios**
```typescript
// Em Reports.tsx - todos os componentes recebem budgetId
const { activeBudget } = useBudget();

{activeReport === 'forecast' && (
  <FinancialForecast 
    period={viewMode === 'monthly' ? selectedMonth : selectedPeriod} 
    budgetId={activeBudget?.budget?.id}
  />
)}
```

---

## 🎨 PADRÕES DE CÓDIGO

### Backend (TypeScript + Express)
```typescript
// Estrutura padrão de route
router.method('path', auth, [middleware], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Validação de entrada (Joi)
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    // 2. Buscar orçamento padrão (quando aplicável)
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    // 3. Validações de negócio
    // 4. Operação no banco (Prisma)
    // 5. Resposta

    res.json(result);
  } catch (error) {
    console.error('Error in [operation]:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

### Frontend (React + TypeScript)
```typescript
// Estrutura de componente
interface ComponentProps {
  // props tipadas
}

export const Component: React.FC<ComponentProps> = ({ props }) => {
  // hooks (React Query para APIs)
  const { data, isLoading, error } = useQuery({
    queryKey: ['key'],
    queryFn: () => api.getData()
  });

  // lógica do componente
  
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};
```

### 📱 REGRAS DE RESPONSIVIDADE (OBRIGATÓRIAS)

**TODAS as páginas e componentes devem ser totalmente responsivos e seguir estas regras:**

#### 🎯 Breakpoints do Tailwind
```css
/* Mobile First - Padrão sem prefixo */
/* sm: 640px+ (tablet pequeno) */
/* md: 768px+ (tablet) */  
/* lg: 1024px+ (desktop pequeno) */
/* xl: 1280px+ (desktop) */
/* 2xl: 1536px+ (desktop grande) */
```

#### 📐 Layout de Navegação por Dispositivo

**📱 Mobile (< 768px):**
- ✅ Menu principal **OCULTO** por padrão
- ✅ Hamburger menu (3 linhas) para abrir menu lateral
- ✅ Menu lateral deslizante (drawer/sidebar)
- ✅ Conteúdo ocupa toda a largura disponível

**📟 Tablet (768px - 1024px):**
- ✅ Menu na **BARRA INFERIOR** (bottom navigation)
- ✅ Ícones + labels nos itens do menu
- ✅ Conteúdo principal acima da barra de navegação
- ✅ Layout em 2 colunas quando possível

**🖥️ Desktop (1024px+):**
- ✅ Menu lateral **SEMPRE VISÍVEL** (sidebar permanente)
- ✅ Largura fixa do sidebar (ex: 250px)
- ✅ Conteúdo principal ao lado do menu
- ✅ Layout em 3-4 colunas quando apropriado

#### 🚫 REGRA CRÍTICA: Overflow Horizontal
```typescript
// ❌ NUNCA fazer isso - pode causar scroll horizontal
<div className="w-[1200px]">           // Largura fixa
<div className="min-w-[500px]">        // Largura mínima grande
<Table columns={20}>                   // Muitas colunas

// ✅ SEMPRE fazer assim - responsivo
<div className="w-full max-w-7xl">     // Largura responsiva
<div className="min-w-0 flex-1">      // Largura flexível
<div className="overflow-x-auto">     // Scroll apenas quando necessário
```

#### 🔄 Transformação de Layout

**Linha → Coluna (Responsivo):**
```typescript
// ✅ Padrão para cards, forms, listas
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Card 1</div>
  <div className="flex-1">Card 2</div>
</div>

// ✅ Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

**Tabelas → Cards (Mobile):**
```typescript
// ✅ Tabela desktop, cards mobile
<div className="hidden md:block">
  <Table />
</div>
<div className="md:hidden space-y-4">
  {data.map(item => <Card key={item.id} data={item} />)}
</div>
```

#### 📏 Classes Tailwind Obrigatórias

**Container Principal:**
```typescript
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Conteúdo */}
  </div>
</div>
```

**Cards/Componentes:**
```typescript
<div className="bg-white rounded-lg shadow p-4 md:p-6">
  {/* Conteúdo do card */}
</div>
```

**Formulários:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <input className="w-full px-3 py-2 border rounded-md" />
</div>
```

**Botões:**
```typescript
<button className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md">
  Ação
</button>
```

#### 🎨 Menu de Navegação - Implementação

**Mobile (Hamburger + Sidebar):**
```typescript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

return (
  <>
    {/* Header mobile */}
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold">Budget App</h1>
        <button onClick={() => setMobileMenuOpen(true)}>
          <HamburgerIcon />
        </button>
      </div>
    </div>

    {/* Sidebar mobile */}
    {mobileMenuOpen && (
      <div className="md:hidden fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black opacity-50" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white">
          {/* Menu items */}
        </div>
      </div>
    )}
  </>
);
```

**Tablet (Bottom Navigation):**
```typescript
return (
  <div className="min-h-screen pb-16 md:pb-0">
    {/* Conteúdo principal */}
    <main className="p-4">
      {children}
    </main>

    {/* Bottom navigation - só no tablet */}
    <nav className="hidden sm:block md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="grid grid-cols-4 h-16">
        <NavItem icon={HomeIcon} label="Início" />
        <NavItem icon={WalletIcon} label="Contas" />
        <NavItem icon={ChartIcon} label="Relatórios" />
        <NavItem icon={UserIcon} label="Perfil" />
      </div>
    </nav>
  </div>
);
```

**Desktop (Sidebar Permanente):**
```typescript
return (
  <div className="hidden lg:flex min-h-screen">
    {/* Sidebar permanente */}
    <nav className="w-64 bg-white shadow-sm">
      <div className="p-6">
        <h1 className="text-xl font-semibold">Budget App</h1>
      </div>
      <ul className="space-y-2 px-4">
        <NavItem href="/dashboard" icon={HomeIcon} label="Dashboard" />
        <NavItem href="/accounts" icon={WalletIcon} label="Contas" />
        {/* ... mais itens */}
      </ul>
    </nav>

    {/* Conteúdo principal */}
    <main className="flex-1 overflow-hidden">
      {children}
    </main>
  </div>
);
```

#### ✅ Checklist de Responsividade

**Para cada componente criado, verificar:**
- [ ] Funciona corretamente em mobile (< 768px)
- [ ] Funciona corretamente em tablet (768px - 1024px) 
- [ ] Funciona corretamente em desktop (> 1024px)
- [ ] Não possui scroll horizontal em nenhum dispositivo
- [ ] Menu segue o padrão por dispositivo
- [ ] Textos são legíveis em todos os tamanhos
- [ ] Botões têm tamanho adequado para touch
- [ ] Formulários são fáceis de usar em mobile
- [ ] Tabelas se transformam em cards no mobile
- [ ] Imagens são responsivas
- [ ] Layout não quebra com conteúdo longo

---

## 🎨 REGRAS DE UX/UI E TRATAMENTO DE ERROS

### 💡 **Estados de Interface**

#### 1. **Estados Vazios (Empty States)**
- ✅ Sempre mostrar interfaces informativas quando não há dados
- ✅ Incluir ícones explicativos (não apenas texto)
- ✅ Fornecer ações sugeridas (CTAs) nos estados vazios
- ✅ Usar linguagem amigável e não técnica

```typescript
// ✅ Exemplo: Estado vazio bem implementado
<div className="bg-white rounded-lg shadow p-6 sm:p-8">
  <div className="text-center">
    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
      <UsersIcon className="h-8 w-8 text-blue-600" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Nenhum compartilhamento encontrado
    </h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      Você ainda não possui compartilhamentos ativos. Comece convidando outro usuário.
    </p>
    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
      Convidar Primeiro Usuário
    </button>
  </div>
</div>
```

#### 2. **Tratamento de Erros**
- ✅ **NUNCA** usar `alert()` - sempre usar toast notifications (Sonner)
- ✅ Distinguir entre "sem dados" e "erro de conectividade"
- ✅ Fornecer opções de retry em caso de erro
- ✅ Mensagens específicas e acionáveis

```typescript
// ✅ Tratamento correto de erros
try {
  const data = await api.getData();
} catch (error) {
  if (error?.response?.status === 404) {
    // Estado vazio - não é erro
    setData([]);
  } else {
    // Erro real - mostrar interface de erro
    setHasError(true);
    toast.error(error?.response?.data?.message || 'Erro ao carregar dados');
  }
}
```

#### 3. **Loading States**
- ✅ Sempre mostrar feedback visual durante carregamento
- ✅ Usar skeletons para listas/cards
- ✅ Usar spinners para ações pontuais

```typescript
// ✅ Loading bem implementado
{loading && (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)}
```

### 🔔 **Sistema de Notificações**

**Usar Sonner Toast:**
```typescript
import { toast } from 'sonner';

// ✅ Sucesso
toast.success('Dados salvos com sucesso!');

// ✅ Erro
toast.error('Erro ao salvar dados');

// ✅ Loading
toast.loading('Salvando...');

// ❌ NUNCA usar alert
alert('Mensagem'); // PROIBIDO
```

---

## 🧩 COMPONENTES PRINCIPAIS

### ShareManager (`client/src/components/ShareManager.tsx`)

**Componente principal do sistema de compartilhamento** com três seções responsivas:

```typescript
interface BudgetShare {
  id: string;
  budgetId: string;
  sharedWithId: string;
  permission: 'READ' | 'WRITE';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED';
  createdAt: string;
  updatedAt: string;
  budget?: {
    id: string;
    name: string;
    description?: string;
    owner?: {
      id: string;
      name: string;
      email: string;
    };
  };
  sharedWith?: {
    id: string;
    name: string;
    email: string;
  };
}

const ShareManager: React.FC = () => {
  const [invitations, setInvitations] = useState<BudgetShare[]>([]);      // Convites recebidos
  const [sentInvitations, setSentInvitations] = useState<BudgetShare[]>([]);  // Convites enviados
  const [activeShares, setActiveShares] = useState({
    sharedByMe: [],     // Orçamentos que compartilhei
    sharedWithMe: []    // Orçamentos compartilhados comigo
  });

  // Três APIs principais
  const loadData = async () => {
    const invitationsData = await sharingService.getInvitations();
    const sentInvitationsData = await sharingService.getSentInvitations();
    const activeSharesData = await sharingService.getActiveShares();
  };
};
```

**Seções da Interface:**
1. **Convites Recebidos**: Cards com ações Aceitar/Rejeitar
2. **Convites Enviados**: Cards com status colorido + ações baseadas no status:
   - `PENDING`: Botão "Revogar Convite" (amarelo)
   - `ACCEPTED`: Botão "Remover Acesso" (vermelho)
   - `REJECTED/REVOKED`: Apenas visualização (cinza)
3. **Compartilhamentos Ativos**: Separados em "Por mim" e "Comigo"

**Padrões de Design:**
```typescript
// Status colors
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  REVOKED: 'bg-gray-100 text-gray-800 border-gray-200'
};

// Responsive cards
className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow 
          border-l-4 border-l-blue-500"

// Mobile-first grid
className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
```

### API Services (`client/src/services/api.ts`)

**TODOS os serviços foram atualizados para suportar orçamento ativo (budgetId opcional):**

```typescript
// Serviços de dados principais - TODOS suportam budgetId
export const dashboardService = {
  async getStats(budgetId?: string): Promise<DashboardStats>
};

export const accountService = {
  async getAccounts(budgetId?: string): Promise<Account[]>,
  async createAccount(data: CreateAccountRequest, budgetId?: string): Promise<Account>,
  async updateAccount(id: string, data: UpdateAccountRequest, budgetId?: string): Promise<Account>,
  async deleteAccount(id: string, budgetId?: string): Promise<void>
};

export const categoryService = {
  async getCategories(budgetId?: string): Promise<Category[]>,
  async createCategory(data: CreateCategoryRequest, budgetId?: string): Promise<Category>,
  async updateCategory(id: string, data: UpdateCategoryRequest, budgetId?: string): Promise<Category>,
  async deleteCategory(id: string, budgetId?: string): Promise<void>
};

export const transactionService = {
  async getTransactions(budgetId?: string): Promise<Transaction[]>,
  async createTransaction(data: CreateTransactionRequest, budgetId?: string): Promise<Transaction>,
  async updateTransaction(id: string, data: UpdateTransactionRequest, budgetId?: string): Promise<Transaction>,
  async deleteTransaction(id: string, budgetId?: string): Promise<void>
};

export const reportService = {
  async getReports(params: object, budgetId?: string): Promise<ReportData>,
  async exportReport(period: string, format: 'pdf'|'excel', budgetId?: string): Promise<void>
};

// Serviços adicionais usados pelos componentes de relatórios
export const budgetService = {
  async getBudgetAnalysis(budgetId?: string): Promise<BudgetAnalysis[]>
};

// Serviços de compartilhamento
export const sharingService = {
  async sendInvite(data: {email: string, permission: SharePermission}): Promise<BudgetShare>,
  async getInvitations(): Promise<BudgetShare[]>,
  async getSentInvitations(): Promise<BudgetShare[]>,
  async respondToInvite(shareId: string, action: {action: "accept"|"reject"}): Promise<BudgetShare>,
  async getActiveShares(): Promise<{sharedByMe: BudgetShare[], sharedWithMe: BudgetShare[]}>,
  async revokeShare(shareId: string): Promise<void>
};

// Lógica interna: quando budgetId é fornecido, usa rotas específicas
// Exemplo: getAccounts(budgetId) → GET /api/budgets/:budgetId/accounts
//          getAccounts()         → GET /api/accounts (orçamento próprio)
```

### **Persistência em Cookies**
O sistema salva automaticamente a seleção do orçamento ativo:
```typescript
// BudgetContext.tsx
const COOKIE_NAME = 'active_budget_id';

// Salvar seleção
const setActiveBudget = (budget: UserShare | null) => {
  if (budget) {
    Cookies.set(COOKIE_NAME, budget.id, { expires: 30 });
  } else {
    Cookies.remove(COOKIE_NAME);
  }
  setActiveBudgetState(budget);
};

// Restaurar na inicialização
const savedBudgetId = Cookies.get(COOKIE_NAME);
```

### **Controles de Permissão por Página**
Cada página implementa controles específicos baseados no contexto:

```typescript
// Padrão usado em todas as páginas
const { activeBudget, isOwner } = useBudget();
const canWrite = isOwner || activeBudget?.permission === 'WRITE';
const canRead = isOwner || activeBudget?.permission === 'READ' || activeBudget?.permission === 'WRITE';

// Exemplos de uso:
// Botões de ação
{canWrite && (
  <button onClick={handleCreate}>Criar Novo</button>
)}

// Formulários de edição
{canWrite ? (
  <input type="text" />
) : (
  <span className="text-gray-600">{value}</span>
)}

// Ações de exclusão
{canWrite && (
  <button onClick={handleDelete} className="text-red-600">
    Excluir
  </button>
)}
```

### **Layout.tsx Integração**
O Layout principal integra o BudgetSelector e gerencia a exibição:
```typescript
// Layout.tsx inclui:
// 1. BudgetSelector no header/sidebar
// 2. Banner informativo contextual
// 3. Navigation baseada em permissões
```

---

## 🚨 PONTOS DE ATENÇÃO PARA O COPILOT

### Sempre Validar
1. **Orçamento padrão**: Usuário sempre deve ter defaultBudgetId válido
2. **Permissões**: Verificar se usuário tem acesso ao orçamento
3. **Relacionamentos**: Contas/categorias/transações pertencem ao mesmo orçamento
4. **Constraint uniqueness**: Nome de categoria único por orçamento

### Padrão de APIs Padronizadas
5. **Formato Unificado**: Rotas paralelas (`/api/resource` vs `/api/budgets/:id/resource`) devem retornar estruturas idênticas
6. **Estrutura de Resposta**: Sempre usar `{ data: { ... } }` para consistência
7. **Campos Obrigatórios**: Manter campos essenciais iguais entre rotas próprias e compartilhadas

### Padrões de Resposta
```typescript
// Sucesso
res.json(data);
res.status(201).json(createdData);

// Erro de validação
res.status(400).json({ message: 'Validation error message' });

// Não encontrado
res.status(404).json({ message: 'Resource not found' });

// Sem permissão
res.status(403).json({ message: 'Permission denied' });

// Erro interno
res.status(500).json({ message: 'Internal server error' });
```

### Middleware Obrigatório
- `auth`: Para todas as rotas protegidas
- `budgetAuth`: Para rotas com `:budgetId`
- `requireWritePermission`: Para operações de escrita em orçamentos compartilhados
- `requireOwnership`: Para operações exclusivas do proprietário

---

## 📝 CONVENÇÕES DE NOMENCLATURA

### Banco de Dados
- Tabelas: snake_case (users, budget_items, budget_shares)
- Campos: camelCase (defaultBudgetId, createdAt)
- Enums: UPPER_CASE (CHECKING, MONTHLY, PENDING)

### TypeScript
- Interfaces: PascalCase (User, BudgetAuthRequest)
- Variáveis: camelCase (budgetId, userData)
- Constantes: UPPER_CASE (JWT_SECRET)

### Rotas
- Endpoints: kebab-case (/monthly-detail, /set-default)
- Parâmetros: camelCase (:budgetId, :shareId)

---

## 🔧 COMANDOS ÚTEIS

### Docker
```bash
docker-compose up -d          # Iniciar serviços
docker-compose logs server    # Logs do backend
docker-compose logs client    # Logs do frontend
```

### Banco de Dados (Prisma)
```bash
cd server
npx prisma migrate dev        # Aplicar migrações
npx prisma generate          # Gerar cliente
npx prisma studio            # Interface visual
```

### Desenvolvimento
```bash
# Backend
cd server && npm run dev     # Desenvolvimento com nodemon

# Frontend  
cd client && npm run dev     # Desenvolvimento com Vite
```

---

## 👥 USUÁRIOS DE TESTE

O sistema possui os seguintes usuários de teste configurados no banco de dados:

### Credenciais Padrão
**Senha padrão para todos os usuários:** `123456`

### Usuários Disponíveis

1. **João Silva**
   - Email: `joao@example.com`
   - ID: `cmfb1z9fc0000dm80vlhtkur9`
   - Senha: `123456`

2. **Maria Santos**
   - Email: `maria@example.com`
   - ID: `cmfb1z9fu0001dm80n5cwjf5u`
   - Senha: `123456`

3. **Pedro Costa**
   - Email: `pedro@example.com`
   - ID: `cmfb1z9fz0002dm802es6wf59`
   - Senha: `123456`

4. **Test User**
   - Email: `test@example.com`
   - ID: `cmfb2i0m500003o061ja0tuqy`
   - Senha: `123456`

### Exemplo de Login via API
```bash
# PowerShell
$loginData = @{ email = 'joao@example.com'; password = '123456' } | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' -Method POST -Body $loginData -ContentType 'application/json'

# curl
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"123456"}'
```

---

## 🎯 STATUS DA IMPLEMENTAÇÃO - SISTEMA DE ORÇAMENTOS COMPARTILHADOS

### ✅ **FUNCIONALIDADES IMPLEMENTADAS E TESTADAS**

#### **Frontend (React + TypeScript)**
- ✅ **BudgetContext**: Sistema de contexto global para gerenciamento de orçamento ativo
- ✅ **BudgetProvider**: Provider que envolve toda aplicação no App.tsx
- ✅ **useBudget Hook**: Hook customizado para acesso ao contexto
- ✅ **BudgetSelector**: Componente dropdown para seleção de orçamento (próprio/compartilhados)
- ✅ **Persistência em Cookies**: Seleção salva automaticamente (active_budget_id)
- ✅ **Banner Informativo**: Exibido em todas as páginas quando navegando orçamento compartilhado
- ✅ **Controles de Permissão**: UI adaptada conforme READ/WRITE em cada página

#### **Páginas Atualizadas**
- ✅ **Dashboard.tsx**: Estatísticas e criação rápida com contexto de orçamento
- ✅ **Accounts.tsx**: Listagem e CRUD de contas com controles de permissão
- ✅ **Categories.tsx**: Gestão de categorias respeitando orçamento ativo
- ✅ **Transactions.tsx**: Transações filtradas por orçamento com permissões
- ✅ **Reports.tsx**: Relatórios específicos do orçamento selecionado
- ✅ **Budgets.tsx**: Mantém funcionalidade própria + ShareManager integrado
- ✅ **Layout.tsx**: BudgetSelector integrado no header/navegação

#### **API Services (Frontend)**
- ✅ **dashboardService.getStats(budgetId?)**: Estatísticas com contexto opcional
- ✅ **accountService.**(budgetId?)**: Todos os métodos CRUD suportam orçamento específico
- ✅ **categoryService.**(budgetId?)**: CRUD completo com contexto
- ✅ **transactionService.**(budgetId?)**: Gestão de transações por orçamento
- ✅ **reportService.getReports(budgetId?)**: Relatórios contextualizados

#### **Backend (Node.js + Express + TypeScript)**
- ✅ **budgetAuth Middleware**: Validação automática de permissões por orçamento
- ✅ **Rotas Específicas**: GET/POST/PUT/DELETE em `/api/budgets/:budgetId/*`
- ✅ **Validação de Acesso**: Proprietário (total) vs Compartilhado (READ/WRITE)
- ✅ **APIs Implementadas**:
  - `/budgets/:budgetId/dashboard/stats`
  - `/budgets/:budgetId/accounts` (+ CRUD completo)
  - `/budgets/:budgetId/categories` (+ CRUD completo)  
  - `/budgets/:budgetId/transactions` (+ CRUD completo)
  - `/budgets/:budgetId/reports` (relatórios gerais)
  - `/budgets/:budgetId/reports/export` (exportação)
  - `/budgets/:budgetId/reports/forecast` (previsões financeiras)
  - `/budgets/:budgetId/analysis` (análise orçamentária)

#### **Sistema de Compartilhamento**
- ✅ **ShareManager**: Interface completa para convites e permissões
- ✅ **Convites**: Envio, aceitação, rejeição de compartilhamentos
- ✅ **Permissões**: READ (visualização) e WRITE (edição completa)
- ✅ **Gestão Ativa**: Revogação de acessos compartilhados

### 🔄 **FLUXO VALIDADO**
1. ✅ Usuário pode alternar entre "Meu Orçamento" e orçamentos compartilhados
2. ✅ Todas as páginas carregam dados corretos conforme seleção
3. ✅ Controles de UI respeitam permissões (READ = só visualização, WRITE = edição)
4. ✅ Banner informativo sempre indica quando em orçamento compartilhado
5. ✅ Persistência de seleção entre sessões via cookies
6. ✅ APIs backend validam permissões automaticamente

### 📋 **REQUISITO ORIGINAL ATENDIDO**
> **"1 usuário pode acessar o orçamento compartilhado e navegar por todas as funcionalidades do sistema para visualizar/editar os dados do orçamento compartilhado"**

**✅ IMPLEMENTAÇÃO COMPLETA**: Sistema permite navegação completa em orçamentos compartilhados com controles apropriados de permissão em todas as funcionalidades (Dashboard, Contas, Categorias, Transações, Relatórios).

### 🚀 **CORREÇÕES RECENTES - SISTEMA DE RELATÓRIOS**

#### **Problemas Resolvidos (Setembro 2025)**
- ✅ **FinancialForecast**: Corrigido para orçamentos compartilhados
  - Rota: `/api/budgets/:budgetId/reports/forecast`
  - Frontend atualizado para usar budgetId correto
  - Backend implementa cálculos de previsão completos

- ✅ **BudgetAnalysis**: Atualizado com suporte completo
  - Rota: `/api/budgets/:budgetId/analysis`
  - Interface atualizada para aceitar budgetId
  - Análise planejado vs realizado por categoria

- ✅ **Todos os Componentes de Relatórios**: 
  - PerformanceComparison, MonthlyDetail, FinancialForecast, BudgetAnalysis
  - Todos recebem `budgetId={activeBudget?.budget?.id}` do Reports.tsx
  - Validação de permissões via middleware budgetAuth

#### **5 Tipos de Relatórios Funcionais**
1. **Visão Geral** ✅ - Dados mensais, resumo financeiro
2. **Orçamento** ✅ - Análise categoria por categoria  
3. **Comparação** ✅ - Performance entre períodos
4. **Previsões** ✅ - Projeções futuras com IA
5. **Detalhado** ✅ - Análise diária do mês

**Status**: Todos os relatórios funcionam para orçamentos próprios E compartilhados.

---

## 📝 **ATUALIZAÇÕES DO CONTEXTO**

### **Setembro 8, 2025 - Sistema de Relatórios Compartilhados**
**Mudanças Implementadas:**
- ✅ Novas rotas backend: `/budgets/:budgetId/reports/forecast` e `/budgets/:budgetId/analysis`
- ✅ Componentes atualizados: FinancialForecast, BudgetAnalysis com suporte a budgetId
- ✅ Props padronizadas: Todos os componentes de relatórios recebem budgetId opcional
- ✅ Middleware budgetAuth: Validação automática de permissões em todas as rotas
- ✅ Frontend: Reports.tsx passa `activeBudget?.budget?.id` para todos os componentes

**Resultado:** Sistema de relatórios 100% funcional para orçamentos compartilhados e próprios.

### **Setembro 8, 2025 - Padronização das APIs de Relatórios**
**Mudanças Implementadas:**
- ✅ **Formato Unificado**: `/api/reports/forecast` e `/api/budgets/:budgetId/reports/forecast`
- ✅ **Estrutura Padronizada**: Ambas retornam `{ data: { forecastData: [...], summary: {...} } }`
- ✅ **Simplificação Frontend**: FinancialForecast não precisa mais lidar com formatos diferentes
- ✅ **Consistência**: Todas as rotas de relatórios seguem o mesmo padrão de resposta

**Formato Padrão das APIs de Previsão:**
```typescript
{
  data: {
    forecastData: Array<{
      month: string;
      historical: number | null;
      predicted: number;
      optimistic: number;
      pessimistic: number;
    }>;
    summary: {
      nextMonthPrediction: number;
      growthRate: number;
      trend: 'up' | 'down' | 'stable';
      confidence: number;
      recommendation: string;
    }
  }
}
```

---

Esse contexto deve ser usado como referência para todas as interações com o sistema. Sempre consulte estas regras de negócio e padrões antes de implementar novas funcionalidades ou fazer alterações no código.

**Última atualização:** 8 de setembro de 2025
