# 🚀 GitHub Copilot Context - Exemplos Práticos e Casos de Uso

## 📋 EXEMPLOS DE IMPLEMENTAÇÃO

### 1. **Criação de Nova Rota com Validação Completa**

```typescript
// Exemplo: Nova rota para relatório personalizado
import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { budgetAuth, BudgetAuthRequest } from '../middleware/budgetAuth';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Schema de validação
const customReportSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  categories: Joi.array().items(Joi.string()).optional()
});

// Rota para orçamento padrão
router.post('/custom', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Validação de entrada
    const { error, value } = customReportSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    // 2. Buscar orçamento padrão
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(404).json({ message: 'No default budget found' });
      return;
    }

    // 3. Lógica específica
    const { startDate, endDate, categories } = value;
    
    const transactions = await prisma.transaction.findMany({
      where: {
        budgetId: user.defaultBudgetId,
        date: { gte: startDate, lte: endDate },
        ...(categories && { categoryId: { in: categories } })
      },
      include: {
        category: { select: { name: true, type: true } },
        account: { select: { name: true, type: true } }
      }
    });

    // 4. Resposta estruturada
    res.json({
      success: true,
      data: transactions,
      summary: {
        total: transactions.length,
        period: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rota para orçamento específico (com compartilhamento)
router.post('/:budgetId/custom', auth, budgetAuth, async (req: BudgetAuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = customReportSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    // req.budget já está disponível pelo middleware budgetAuth
    const { startDate, endDate, categories } = value;
    
    const transactions = await prisma.transaction.findMany({
      where: {
        budgetId: req.budget!.id,
        date: { gte: startDate, lte: endDate },
        ...(categories && { categoryId: { in: categories } })
      }
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error generating budget custom report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

### 2. **Componente React com React Query**

```typescript
// Exemplo: Componente de relatório personalizado
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { api } from '../services/api';

interface CustomReportProps {
  budgetId?: string; // Opcional - usa orçamento padrão se não fornecido
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  categories?: string[];
}

export const CustomReport: React.FC<CustomReportProps> = ({ budgetId }) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(new Date(), 'yyyy-MM-01'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Query para buscar categorias
  const { data: categories } = useQuery({
    queryKey: ['categories', budgetId],
    queryFn: () => budgetId ? api.getBudgetCategories(budgetId) : api.getCategories()
  });

  // Mutation para gerar relatório
  const generateReportMutation = useMutation({
    mutationFn: (data: ReportFilters) => 
      budgetId ? api.generateCustomReport(budgetId, data) : api.generateCustomReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customReport'] });
    }
  });

  const handleGenerateReport = () => {
    generateReportMutation.mutate(filters);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Relatório Personalizado
      </h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Início
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Fim
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categorias
          </label>
          <select
            multiple
            value={filters.categories || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              setFilters(prev => ({ ...prev, categories: selected }));
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {categories?.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botão de geração */}
      <button
        onClick={handleGenerateReport}
        disabled={generateReportMutation.isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {generateReportMutation.isPending ? 'Gerando...' : 'Gerar Relatório'}
      </button>

      {/* Resultados */}
      {generateReportMutation.data && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Resultados</h3>
          {/* Renderizar dados do relatório */}
        </div>
      )}

      {/* Erros */}
      {generateReportMutation.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">
            {generateReportMutation.error.message || 'Erro ao gerar relatório'}
          </p>
        </div>
      )}
    </div>
  );
};
```

---

## 🔍 CASOS DE USO ESPECÍFICOS

### 1. **Implementação de Nova Funcionalidade: Metas Financeiras**

#### Backend - Nova tabela e modelo
```prisma
// Adicionar ao schema.prisma
model FinancialGoal {
  id          String   @id @default(cuid())
  name        String
  targetAmount Decimal  @db.Decimal(12, 2)
  currentAmount Decimal @default(0) @db.Decimal(12, 2)
  targetDate  DateTime
  isActive    Boolean  @default(true)
  budgetId    String
  categoryId  String?  // Meta por categoria (opcional)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  budget      Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  category    Category? @relation(fields: [categoryId], references: [id])
  
  @@map("financial_goals")
}
```

#### Rota para CRUD de metas
```typescript
// server/src/routes/goals.ts
import { Router } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { budgetAuth, BudgetAuthRequest, requireWritePermission } from '../middleware/budgetAuth';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

const goalSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  targetAmount: Joi.number().positive().required(),
  targetDate: Joi.date().min('now').required(),
  categoryId: Joi.string().optional()
});

// Listar metas do orçamento padrão
router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.json([]);
      return;
    }

    const goals = await prisma.financialGoal.findMany({
      where: { budgetId: user.defaultBudgetId, isActive: true },
      include: {
        category: { select: { name: true, color: true } }
      },
      orderBy: { targetDate: 'asc' }
    });

    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Criar nova meta
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const { error, value } = goalSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(400).json({ message: 'No default budget found' });
      return;
    }

    // Validar categoria se fornecida
    if (value.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: value.categoryId, budgetId: user.defaultBudgetId }
      });

      if (!category) {
        res.status(400).json({ message: 'Category not found' });
        return;
      }
    }

    const goal = await prisma.financialGoal.create({
      data: {
        ...value,
        budgetId: user.defaultBudgetId
      },
      include: {
        category: { select: { name: true, color: true } }
      }
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Atualizar progresso da meta (baseado em transações)
router.post('/:goalId/update-progress', auth, async (req: AuthRequest, res) => {
  try {
    const { goalId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(400).json({ message: 'No default budget found' });
      return;
    }

    const goal = await prisma.financialGoal.findFirst({
      where: { id: goalId, budgetId: user.defaultBudgetId }
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    // Calcular progresso com base em transações
    let currentAmount = 0;

    if (goal.categoryId) {
      // Meta por categoria específica
      const transactions = await prisma.transaction.findMany({
        where: {
          budgetId: user.defaultBudgetId,
          categoryId: goal.categoryId,
          date: { gte: goal.createdAt, lte: goal.targetDate }
        }
      });

      currentAmount = transactions.reduce((sum, t) => {
        return t.type === 'INCOME' ? sum + Number(t.amount) : sum;
      }, 0);
    } else {
      // Meta geral (todas as receitas)
      const transactions = await prisma.transaction.findMany({
        where: {
          budgetId: user.defaultBudgetId,
          type: 'INCOME',
          date: { gte: goal.createdAt, lte: goal.targetDate }
        }
      });

      currentAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    }

    // Atualizar meta
    const updatedGoal = await prisma.financialGoal.update({
      where: { id: goalId },
      data: { currentAmount },
      include: {
        category: { select: { name: true, color: true } }
      }
    });

    res.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

### 2. **Implementação de Validação Complexa**

```typescript
// Exemplo: Validação de transferência entre contas
router.post('/transfer', auth, async (req: AuthRequest, res) => {
  try {
    const transferSchema = Joi.object({
      fromAccountId: Joi.string().required(),
      toAccountId: Joi.string().required(),
      amount: Joi.number().positive().required(),
      description: Joi.string().required()
    });

    const { error, value } = transferSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    const { fromAccountId, toAccountId, amount, description } = value;

    // Validação: contas diferentes
    if (fromAccountId === toAccountId) {
      res.status(400).json({ message: 'Cannot transfer to the same account' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(400).json({ message: 'No default budget found' });
      return;
    }

    // Validar ambas as contas pertencem ao orçamento
    const accounts = await prisma.account.findMany({
      where: {
        id: { in: [fromAccountId, toAccountId] },
        budgetId: user.defaultBudgetId
      }
    });

    if (accounts.length !== 2) {
      res.status(400).json({ message: 'One or both accounts not found' });
      return;
    }

    const fromAccount = accounts.find(a => a.id === fromAccountId)!;
    const toAccount = accounts.find(a => a.id === toAccountId)!;

    // Validar saldo suficiente (se conta corrente/poupança)
    if (['CHECKING', 'SAVINGS'].includes(fromAccount.type) && Number(fromAccount.balance) < amount) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    // Buscar categoria de transferência (criar se não existir)
    let transferCategory = await prisma.category.findFirst({
      where: { name: 'Transferência', budgetId: user.defaultBudgetId }
    });

    if (!transferCategory) {
      transferCategory = await prisma.category.create({
        data: {
          name: 'Transferência',
          type: 'EXPENSE', // Arbitrário para transferências
          budgetId: user.defaultBudgetId,
          color: '#6B7280'
        }
      });
    }

    // Transação em lote (atomic)
    const result = await prisma.$transaction(async (tx) => {
      // Saída da conta origem
      const outTransaction = await tx.transaction.create({
        data: {
          description: `${description} (Para: ${toAccount.name})`,
          amount: amount,
          type: 'EXPENSE',
          date: new Date(),
          accountId: fromAccountId,
          categoryId: transferCategory.id,
          budgetId: user.defaultBudgetId!
        }
      });

      // Entrada na conta destino
      const inTransaction = await tx.transaction.create({
        data: {
          description: `${description} (De: ${fromAccount.name})`,
          amount: amount,
          type: 'INCOME',
          date: new Date(),
          accountId: toAccountId,
          categoryId: transferCategory.id,
          budgetId: user.defaultBudgetId!
        }
      });

      // Atualizar saldos
      await tx.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } }
      });

      await tx.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } }
      });

      return { outTransaction, inTransaction };
    });

    res.status(201).json({
      message: 'Transfer completed successfully',
      transactions: result
    });

  } catch (error) {
    console.error('Error processing transfer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

---

## 📊 PADRÕES DE RESPOSTA PARA DIFERENTES CENÁRIOS

### 1. **Listagem com Paginação**
```typescript
router.get('/transactions', auth, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.json({ transactions: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
      return;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { budgetId: user.defaultBudgetId },
        include: {
          account: { select: { name: true, type: true } },
          category: { select: { name: true, color: true, type: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({
        where: { budgetId: user.defaultBudgetId }
      })
    ]);

    const pages = Math.ceil(total / limit);

    res.json({
      transactions,
      pagination: { page, limit, total, pages }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

### 2. **Resposta com Agregações**
```typescript
router.get('/summary', auth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.json({ totalIncome: 0, totalExpenses: 0, balance: 0, accountsCount: 0 });
      return;
    }

    const [incomeSum, expenseSum, accountsCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { budgetId: user.defaultBudgetId, type: 'INCOME' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { budgetId: user.defaultBudgetId, type: 'EXPENSE' },
        _sum: { amount: true }
      }),
      prisma.account.count({
        where: { budgetId: user.defaultBudgetId }
      })
    ]);

    const totalIncome = Number(incomeSum._sum.amount || 0);
    const totalExpenses = Number(expenseSum._sum.amount || 0);
    const balance = totalIncome - totalExpenses;

    res.json({
      totalIncome,
      totalExpenses,
      balance,
      accountsCount
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

---

## 🛠️ DEBUGGING E TROUBLESHOOTING

### 1. **Logs Estruturados**
```typescript
// Padrão para logging
console.log('=== [OPERATION] Debug Info ===');
console.log('User ID:', req.user?.id);
console.log('Budget ID:', req.budget?.id);
console.log('Permission:', req.budget?.permission);
console.log('Request Body:', JSON.stringify(req.body, null, 2));
console.log('========================');
```

### 2. **Validação de Estado**
```typescript
// Sempre verificar estado antes de operações críticas
const debugBudgetState = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      defaultBudget: true,
      ownedBudgets: { select: { id: true, name: true } },
      sharedBudgets: { 
        where: { status: 'ACCEPTED' },
        include: { budget: { select: { id: true, name: true } } }
      }
    }
  });

  console.log('=== Budget State Debug ===');
  console.log('Default Budget:', user?.defaultBudget?.name || 'None');
  console.log('Owned Budgets:', user?.ownedBudgets.length || 0);
  console.log('Shared Budgets:', user?.sharedBudgets.length || 0);
  console.log('========================');

  return user;
};
```

---

## 📈 PERFORMANCE E OTIMIZAÇÃO

### 1. **Queries Otimizadas**
```typescript
// ❌ Múltiplas queries
const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
const accounts = await prisma.account.findMany({ where: { budgetId } });
const categories = await prisma.category.findMany({ where: { budgetId } });

// ✅ Query única com includes
const budgetWithData = await prisma.budget.findUnique({
  where: { id: budgetId },
  include: {
    accounts: { select: { id: true, name: true, type: true, balance: true } },
    categories: { select: { id: true, name: true, type: true, color: true } },
    _count: { select: { transactions: true } }
  }
});
```

### 2. **Índices Recomendados**
```sql
-- Adicionar ao migration
CREATE INDEX idx_transactions_budget_date ON transactions(budget_id, date DESC);
CREATE INDEX idx_transactions_category_date ON transactions(category_id, date DESC);
CREATE INDEX idx_budget_shares_user_status ON budget_shares(shared_with_id, status);
CREATE INDEX idx_budget_items_budget_active ON budget_items(budget_id, is_active);
```

---

## 📱 EXEMPLOS DE RESPONSIVIDADE (OBRIGATÓRIOS)

### 1. **Layout Principal Responsivo**

```typescript
// Exemplo: Layout principal com navegação responsiva
import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Contas', href: '/accounts', icon: WalletIcon },
    { name: 'Transações', href: '/transactions', icon: ArrowsRightLeftIcon },
    { name: 'Orçamentos', href: '/budgets', icon: ChartBarIcon },
    { name: 'Relatórios', href: '/reports', icon: DocumentChartBarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* MOBILE: Header + Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold text-gray-900">Budget App</h1>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* MOBILE: Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-black opacity-50" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-4">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* TABLET: Bottom Navigation */}
      <nav className="hidden sm:block lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-5 h-16">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* DESKTOP: Sidebar permanente */}
      <div className="hidden lg:flex">
        <nav className="w-64 bg-white shadow-sm">
          <div className="p-6">
            <h1 className="text-xl font-semibold text-gray-900">Budget App</h1>
          </div>
          <ul className="space-y-1 px-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Conteúdo principal desktop */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* MOBILE/TABLET: Conteúdo principal */}
      <main className="lg:hidden pt-16 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
};
```

### 2. **Componente de Cards Responsivos**

```typescript
// Exemplo: Cards que se adaptam de tabela para lista
import React from 'react';
import { Account } from '../types';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export const AccountList: React.FC<AccountListProps> = ({ accounts, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* DESKTOP/TABLET: Tabela */}
      <div className="hidden md:block">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saldo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{account.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {account.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onEdit(account)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => onDelete(account.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE: Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {accounts.map((account) => (
          <div key={account.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {account.name}
                </h3>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {account.type}
                  </span>
                </div>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="ml-4 flex flex-col space-y-2">
                <button 
                  onClick={() => onEdit(account)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Editar
                </button>
                <button 
                  onClick={() => onDelete(account.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lista vazia */}
      {accounts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">Nenhuma conta cadastrada</div>
        </div>
      )}
    </div>
  );
};
```

### 3. **Formulário Responsivo**

```typescript
// Exemplo: Formulário que se adapta ao tamanho da tela
import React from 'react';
import { useForm } from 'react-hook-form';

interface AccountFormProps {
  onSubmit: (data: AccountFormData) => void;
  initialData?: Partial<AccountFormData>;
  isLoading?: boolean;
}

interface AccountFormData {
  name: string;
  type: string;
  balance: number;
  description?: string;
}

export const AccountForm: React.FC<AccountFormProps> = ({ 
  onSubmit, 
  initialData, 
  isLoading = false 
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<AccountFormData>({
    defaultValues: initialData
  });

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
        {initialData ? 'Editar Conta' : 'Nova Conta'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        {/* Grid responsivo para campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Nome da conta */}
          <div className="md:col-span-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Conta
            </label>
            <input
              {...register('name', { required: 'Nome é obrigatório' })}
              type="text"
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              placeholder="Ex: Conta Corrente Banco X"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Tipo da conta */}
          <div className="md:col-span-1">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo da Conta
            </label>
            <select
              {...register('type', { required: 'Tipo é obrigatório' })}
              id="type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
            >
              <option value="">Selecione o tipo</option>
              <option value="CHECKING">Conta Corrente</option>
              <option value="SAVINGS">Poupança</option>
              <option value="CREDIT_CARD">Cartão de Crédito</option>
              <option value="INVESTMENT">Investimentos</option>
              <option value="CASH">Dinheiro</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Saldo inicial */}
          <div className="md:col-span-1">
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">
              Saldo Inicial
            </label>
            <input
              {...register('balance', { 
                required: 'Saldo é obrigatório',
                min: { value: 0, message: 'Saldo deve ser positivo' }
              })}
              type="number"
              step="0.01"
              id="balance"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              placeholder="0,00"
            />
            {errors.balance && (
              <p className="mt-1 text-sm text-red-600">{errors.balance.message}</p>
            )}
          </div>

          {/* Descrição - span full width */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              placeholder="Informações adicionais sobre a conta..."
            />
          </div>
        </div>

        {/* Botões - responsivos */}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => window.history.back()}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Salvando...' : (initialData ? 'Salvar' : 'Criar Conta')}
          </button>
        </div>
      </form>
    </div>
  );
};
```

### 4. **Dashboard Responsivo com Métricas**

```typescript
// Exemplo: Dashboard com cards que se reorganizam por dispositivo
import React from 'react';
import { 
  BanknotesIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ScaleIcon 
} from '@heroicons/react/24/outline';

interface DashboardProps {
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    accountsCount: number;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({ metrics }) => {
  const { totalIncome, totalExpenses, balance, accountsCount } = metrics;

  const stats = [
    {
      name: 'Receitas',
      value: totalIncome,
      icon: ArrowUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      name: 'Despesas',
      value: totalExpenses,
      icon: ArrowDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      name: 'Saldo',
      value: balance,
      icon: ScaleIcon,
      color: balance >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: balance >= 0 ? 'bg-green-50' : 'bg-red-50',
      borderColor: balance >= 0 ? 'border-green-200' : 'border-red-200'
    },
    {
      name: 'Contas',
      value: accountsCount,
      icon: BanknotesIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm md:text-base text-gray-600">
          Visão geral das suas finanças
        </p>
      </div>

      {/* Cards de métricas - Grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`bg-white rounded-lg shadow border-l-4 ${stat.borderColor} p-4 md:p-6`}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
              </div>
              <div className="ml-3 md:ml-4 flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </p>
                <p className={`text-lg md:text-xl font-semibold ${stat.color} truncate`}>
                  {stat.name === 'Contas' 
                    ? stat.value
                    : `R$ ${stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seção de gráficos - Layout responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de receitas vs despesas */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Receitas vs Despesas
          </h3>
          <div className="h-48 md:h-64">
            {/* Componente de gráfico aqui */}
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-md">
              <p className="text-gray-500 text-sm md:text-base">Gráfico de barras</p>
            </div>
          </div>
        </div>

        {/* Distribuição por categorias */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Gastos por Categoria
          </h3>
          <div className="h-48 md:h-64">
            {/* Componente de gráfico aqui */}
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-md">
              <p className="text-gray-500 text-sm md:text-base">Gráfico de pizza</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transações recentes - Full width */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h3 className="text-base md:text-lg font-medium text-gray-900">
            Transações Recentes
          </h3>
        </div>
        
        {/* Lista responsiva de transações */}
        <div className="divide-y divide-gray-200">
          {/* Cada item adapta layout para mobile */}
          <div className="p-4 md:p-6 hover:bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm md:text-base font-medium text-gray-900 truncate">
                  Supermercado XYZ
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  Conta Corrente • Alimentação • Hoje
                </p>
              </div>
              <div className="text-right md:text-left">
                <p className="text-sm md:text-base font-semibold text-red-600">
                  -R$ 125,50
                </p>
              </div>
            </div>
          </div>
          
          {/* Mais transações... */}
        </div>
        
        <div className="p-4 md:p-6 bg-gray-50">
          <button className="w-full md:w-auto text-sm text-blue-600 hover:text-blue-900 font-medium">
            Ver todas as transações →
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 5. **Modal/Dialog Responsivo**

```typescript
// Exemplo: Modal que se adapta ao tamanho da tela
import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all`}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
                  <Dialog.Title className="text-lg md:text-xl font-medium text-gray-900">
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar</span>
                    <XMarkIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Uso do modal responsivo
export const ExampleUsage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Abrir Modal
      </button>

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirmar Ação"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm md:text-base text-gray-600">
            Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
          </p>
          
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              onClick={() => {
                // Lógica de exclusão
                setIsModalOpen(false);
              }}
            >
              Excluir
            </button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
};
```

---

Este arquivo complementa o contexto principal e fornece exemplos práticos para implementação de novas funcionalidades seguindo os padrões estabelecidos no sistema.
