import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as path from 'path';
import * as os from 'os';
import { auth, AuthRequest } from '../middleware/auth';
import { budgetAuth, requireWritePermission, requireOwnership, BudgetAuthRequest } from '../middleware/budgetAuth';
import { ImportController } from '../controllers/importController';

const router = Router();
const prisma = new PrismaClient();

// Listar itens de orçamento por categoria (para a página de Orçamentos)
router.get('/items', auth, async (req: BudgetAuthRequest, res) => {
  try {
    // Buscar orçamento padrão do usuário
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.json([]);
      return;
    }

    // Buscar itens de orçamento do orçamento padrão
    const budgetItems = await prisma.budgetItem.findMany({
      where: {
        budgetId: user.defaultBudgetId,
        isActive: true
      },
      include: {
        category: true
      },
      orderBy: [
        { category: { name: 'asc' } }
      ]
    });

    // Transformar para o formato esperado pelo frontend
    const budgets = budgetItems.map(item => ({
      id: item.id,
      amount: parseFloat(item.amount.toString()),
      period: item.period,
      isActive: item.isActive,
      categoryId: item.categoryId,
      userId: req.user!.id,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      category: item.category
    }));

    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budget items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Listar todos os orçamentos do usuário (próprios e compartilhados)
router.get('/', auth, async (req: BudgetAuthRequest, res) => {
  try {
    // Orçamentos próprios
    const ownedBudgets = await prisma.budget.findMany({
      where: { ownerId: req.user!.id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            accounts: true,
            transactions: true,
            categories: true
          }
        }
      }
    });

    // Orçamentos compartilhados aceitos
    const sharedBudgets = await prisma.budgetShare.findMany({
      where: {
        sharedWithId: req.user!.id,
        status: 'ACCEPTED'
      },
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            owner: {
              select: { name: true, email: true }
            },
            _count: {
              select: {
                accounts: true,
                transactions: true,
                categories: true
              }
            }
          }
        }
      }
    });

    // Orçamento padrão
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        defaultBudgetId: true,
        defaultBudget: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      ownedBudgets: ownedBudgets.map(budget => ({
        ...budget,
        permission: 'OWNER',
        isOwner: true
      })),
      sharedBudgets: sharedBudgets.map(share => ({
        ...share.budget,
        permission: share.permission,
        isOwner: false
      })),
      defaultBudget: user?.defaultBudget || null
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Criar novo orçamento
router.post('/', auth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Budget name is required' });
      return;
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        description,
        ownerId: req.user!.id
      }
    });

    // Se é o primeiro orçamento do usuário, definir como padrão
    const userBudgetsCount = await prisma.budget.count({
      where: { ownerId: req.user!.id }
    });

    if (userBudgetsCount === 1) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { defaultBudgetId: budget.id }
      });
    }

    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Criar novo item de orçamento (orçamento por categoria)
router.post('/items', auth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { categoryId, amount, period } = req.body;

    if (!categoryId || !amount || !period) {
      res.status(400).json({ message: 'CategoryId, amount and period are required' });
      return;
    }

    // Buscar orçamento padrão do usuário
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(400).json({ message: 'User does not have a default budget' });
      return;
    }

    // Verificar se a categoria pertence ao orçamento do usuário
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        budgetId: user.defaultBudgetId
      }
    });

    if (!category) {
      res.status(400).json({ message: 'Category not found or does not belong to user budget' });
      return;
    }

    // Verificar se já existe um item de orçamento ativo para esta categoria
    const existingItem = await prisma.budgetItem.findFirst({
      where: {
        categoryId,
        budgetId: user.defaultBudgetId,
        isActive: true
      }
    });

    if (existingItem) {
      res.status(400).json({ message: 'Budget item already exists for this category' });
      return;
    }

    const budgetItem = await prisma.budgetItem.create({
      data: {
        categoryId,
        budgetId: user.defaultBudgetId,
        amount: parseFloat(amount.toString()),
        period,
        isActive: true
      },
      include: {
        category: true
      }
    });

    // Transformar para o formato esperado pelo frontend
    const budget = {
      id: budgetItem.id,
      amount: parseFloat(budgetItem.amount.toString()),
      period: budgetItem.period,
      isActive: budgetItem.isActive,
      categoryId: budgetItem.categoryId,
      userId: req.user!.id,
      createdAt: budgetItem.createdAt.toISOString(),
      updatedAt: budgetItem.updatedAt.toISOString(),
      category: budgetItem.category
    };

    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Atualizar item de orçamento
router.put('/items/:itemId', auth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { amount, period, isActive } = req.body;

    // Buscar orçamento padrão do usuário
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(400).json({ message: 'User does not have a default budget' });
      return;
    }

    // Verificar se o item pertence ao usuário
    const existingItem = await prisma.budgetItem.findFirst({
      where: {
        id: itemId,
        budgetId: user.defaultBudgetId
      }
    });

    if (!existingItem) {
      res.status(404).json({ message: 'Budget item not found' });
      return;
    }

    const updatedItem = await prisma.budgetItem.update({
      where: { id: itemId },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount.toString()) }),
        ...(period !== undefined && { period }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        category: true
      }
    });

    // Transformar para o formato esperado pelo frontend
    const budget = {
      id: updatedItem.id,
      amount: parseFloat(updatedItem.amount.toString()),
      period: updatedItem.period,
      isActive: updatedItem.isActive,
      categoryId: updatedItem.categoryId,
      userId: req.user!.id,
      createdAt: updatedItem.createdAt.toISOString(),
      updatedAt: updatedItem.updatedAt.toISOString(),
      category: updatedItem.category
    };

    res.json(budget);
  } catch (error) {
    console.error('Error updating budget item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Deletar item de orçamento
router.delete('/items/:itemId', auth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { itemId } = req.params;

    // Buscar orçamento padrão do usuário
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(400).json({ message: 'User does not have a default budget' });
      return;
    }

    // Verificar se o item pertence ao usuário
    const existingItem = await prisma.budgetItem.findFirst({
      where: {
        id: itemId,
        budgetId: user.defaultBudgetId
      }
    });

    if (!existingItem) {
      res.status(404).json({ message: 'Budget item not found' });
      return;
    }

    await prisma.budgetItem.delete({
      where: { id: itemId }
    });

    res.json({ message: 'Budget item deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Análise de orçamentos vs gastos reais
router.get('/analysis', auth, async (req: AuthRequest, res) => {
  try {
    // Buscar orçamento padrão do usuário
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.json([]);
      return;
    }

    // Buscar itens de orçamento ativos
    const budgetItems = await prisma.budgetItem.findMany({
      where: {
        budgetId: user.defaultBudgetId,
        isActive: true
      },
      include: {
        category: true
      }
    });

    // Calcular período baseado no query param
    const period = req.query.period as string || 'current';
    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case '3months':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'current':
      default:
        // Mês atual
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
        break;
    }

    // Buscar gastos reais por categoria no período
    const transactions = await prisma.transaction.findMany({
      where: {
        budgetId: user.defaultBudgetId,
        date: {
          gte: startDate,
          lte: endDate
        },
        category: {
          type: 'EXPENSE'
        }
      },
      include: {
        category: true
      }
    });

    // Agrupar gastos por categoria
    const spentByCategory = new Map();
    transactions.forEach(transaction => {
      const categoryId = transaction.categoryId;
      const amount = Math.abs(parseFloat(transaction.amount.toString()));
      spentByCategory.set(categoryId, (spentByCategory.get(categoryId) || 0) + amount);
    });

    // Criar análise para cada item de orçamento
    const analysis = budgetItems.map(item => {
      const budgetAmount = parseFloat(item.amount.toString());
      let spentAmount = spentByCategory.get(item.categoryId) || 0;

      // Ajustar para período mensal se necessário
      if (period !== 'current' && item.period === 'MONTHLY') {
        const monthsDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        spentAmount = spentAmount / monthsDiff;
      }

      const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

      let status: 'good' | 'warning' | 'exceeded';
      if (percentage <= 70) {
        status = 'good';
      } else if (percentage <= 100) {
        status = 'warning';
      } else {
        status = 'exceeded';
      }

      return {
        id: item.id,
        category: item.category,
        budgetAmount,
        spentAmount,
        remainingAmount: budgetAmount - spentAmount,
        percentage: Math.round(percentage),
        status,
        period: item.period
      };
    });

    res.json(analysis);
  } catch (error) {
    console.error('Error generating budget analysis:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Obter detalhes de um orçamento específico
router.get('/:budgetId', auth, budgetAuth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: req.budget!.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        accounts: {
          select: {
            id: true,
            name: true,
            type: true,
            balance: true,
            description: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            icon: true
          }
        },
        shares: {
          where: { status: 'ACCEPTED' },
          select: {
            id: true,
            permission: true,
            sharedWith: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            transactions: true,
            budgetItems: true
          }
        }
      }
    });

    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }

    res.json({
      ...budget,
      userPermission: req.budget!.permission
    });
  } catch (error) {
    console.error('Error fetching budget details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Atualizar orçamento (somente proprietário)
router.put('/:budgetId', auth, budgetAuth, requireOwnership, async (req: BudgetAuthRequest, res) => {
  try {
    const { name, description } = req.body;

    const updatedBudget = await prisma.budget.update({
      where: { id: req.budget!.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      }
    });

    res.json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Deletar orçamento (somente proprietário)
router.delete('/:budgetId', auth, budgetAuth, requireOwnership, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    // Verificar se não é o orçamento padrão de algum usuário
    const usersWithDefaultBudget = await prisma.user.findMany({
      where: { defaultBudgetId: req.budget!.id },
      select: { id: true }
    });

    if (usersWithDefaultBudget.length > 0) {
      res.status(400).json({
        message: 'Cannot delete budget that is set as default for users'
      });
      return;
    }

    await prisma.budget.delete({
      where: { id: req.budget!.id }
    });

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Definir orçamento padrão
router.post('/:budgetId/set-default', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { defaultBudgetId: req.budget!.id }
    });

    res.json({ message: 'Default budget updated successfully' });
  } catch (error) {
    console.error('Error setting default budget:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===== ROTAS PARA CONTEXTO DE ORÇAMENTO COMPARTILHADO =====

// Dashboard Stats para orçamento específico
router.get('/:budgetId/dashboard/stats', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const budgetId = req.budget!.id;

    // Saldo total das contas
    const accounts = await prisma.account.findMany({
      where: { budgetId },
      select: { balance: true }
    });
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance.toString()), 0);

    // Receitas do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyIncome = await prisma.transaction.aggregate({
      where: {
        budgetId,
        type: 'INCOME',
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { amount: true }
    });

    // Despesas do mês atual
    const monthlyExpenses = await prisma.transaction.aggregate({
      where: {
        budgetId,
        type: 'EXPENSE',
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { amount: true }
    });

    // Contagem de contas
    const accountsCount = await prisma.account.count({
      where: { budgetId }
    });

    // Transações recentes
    const recentTransactions = await prisma.transaction.findMany({
      where: { budgetId },
      include: {
        account: { select: { name: true, type: true } },
        category: { select: { name: true, type: true, color: true } }
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        totalBalance,
        monthlyIncome: parseFloat(monthlyIncome._sum.amount?.toString() || '0'),
        monthlyExpenses: parseFloat(monthlyExpenses._sum.amount?.toString() || '0'),
        accountsCount,
        recentTransactions: recentTransactions.map(t => ({
          ...t,
          amount: parseFloat(t.amount.toString())
        }))
      }
    });
  } catch (error) {
    console.error('Error getting budget dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Contas para orçamento específico
router.get('/:budgetId/accounts', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { budgetId: req.budget!.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: accounts.map((account: any) => ({
        ...account,
        balance: parseFloat(account.balance.toString())
      }))
    });
  } catch (error) {
    console.error('Error getting budget accounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Categorias para orçamento específico
router.get('/:budgetId/categories', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { budgetId: req.budget!.id },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting budget categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Transações para orçamento específico
router.get('/:budgetId/transactions', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { budgetId: req.budget!.id },
      include: {
        account: { select: { name: true, type: true } },
        category: { select: { name: true, type: true, color: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json({
      success: true,
      data: transactions.map(t => ({
        ...t,
        amount: parseFloat(t.amount.toString())
      }))
    });
  } catch (error) {
    console.error('Error getting budget transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Items de orçamento para orçamento específico
router.get('/:budgetId/items', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const budgetItems = await prisma.budgetItem.findMany({
      where: {
        budgetId: req.budget!.id,
        isActive: true
      },
      include: {
        category: true
      },
      orderBy: [
        { category: { name: 'asc' } }
      ]
    });

    const budgets = budgetItems.map(item => ({
      id: item.id,
      amount: parseFloat(item.amount.toString()),
      period: item.period,
      isActive: item.isActive,
      categoryId: item.categoryId,
      userId: req.user!.id,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      category: item.category
    }));

    res.json(budgets);
  } catch (error) {
    console.error('Error getting budget items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rota de relatórios para orçamento específico
router.get('/:budgetId/reports', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const budgetId = req.params.budgetId;
    const { mode, period, month } = req.query;

    // Definir período padrão se não especificado
    let startDate: Date;
    let endDate: Date = new Date();

    if (mode === 'monthly' && month) {
      // Modo mensal: relatório de um mês específico
      const [year, monthNum] = (month as string).split('-');
      startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(monthNum), 0); // Último dia do mês
    } else {
      // Modo período: últimos X meses
      const months = period === '3months' ? 3 :
        period === '12months' ? 12 : 6; // default 6 meses
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
    }

    // Buscar transações do período
    const transactions = await prisma.transaction.findMany({
      where: {
        budgetId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true,
        account: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calcular dados mensais
    const monthlyData = [];
    const monthsMap = new Map();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          month: monthName,
          income: 0,
          expenses: 0,
          balance: 0
        });
      }

      const monthData = monthsMap.get(monthKey);
      const amount = parseFloat(transaction.amount.toString());

      if (transaction.type === 'INCOME') {
        monthData.income += amount;
      } else {
        monthData.expenses += Math.abs(amount);
      }
    });

    // Calcular balance para cada mês
    monthsMap.forEach(data => {
      data.balance = data.income - data.expenses;
    });

    monthlyData.push(...Array.from(monthsMap.values()));

    // Calcular gastos por categoria
    const categoryExpenses = new Map();
    const categoryIncome = new Map();
    let totalExpenses = 0;
    let totalIncome = 0;

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount.toString());
      const categoryName = transaction.category.name;

      if (transaction.type === 'EXPENSE') {
        const absAmount = Math.abs(amount);
        categoryExpenses.set(categoryName, (categoryExpenses.get(categoryName) || 0) + absAmount);
        totalExpenses += absAmount;
      } else {
        categoryIncome.set(categoryName, (categoryIncome.get(categoryName) || 0) + amount);
        totalIncome += amount;
      }
    });

    // Converter para array com percentuais
    const expensesByCategory = Array.from(categoryExpenses.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0
    }));

    const incomeByCategory = Array.from(categoryIncome.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: totalIncome > 0 ? (value / totalIncome) * 100 : 0
    }));

    // Top gastos por categoria
    const topExpenses = Array.from(categoryExpenses.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        transactions: transactions.filter(t =>
          t.category.name === category && t.type === 'EXPENSE'
        ).length
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Resumo
    const summary = {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      averageMonthlyIncome: monthlyData.length > 0 ? totalIncome / monthlyData.length : 0,
      averageMonthlyExpenses: monthlyData.length > 0 ? totalExpenses / monthlyData.length : 0
    };

    res.json({
      data: {
        monthlyData: monthlyData.sort((a, b) => a.month.localeCompare(b.month)),
        expensesByCategory: expensesByCategory.sort((a, b) => b.value - a.value),
        incomeByCategory: incomeByCategory.sort((a, b) => b.value - a.value),
        topExpenses,
        summary
      }
    });

  } catch (error) {
    console.error('Error getting budget reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rota de exportação de relatórios para orçamento específico
router.get('/:budgetId/reports/export', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const budgetId = req.params.budgetId;
    const { period, format } = req.query;

    // Por enquanto, retorna uma mensagem indicando que a funcionalidade está em desenvolvimento
    res.json({
      message: `Exportação de relatórios em ${format || 'PDF'} para o período ${period || '6months'} está em desenvolvimento`,
      budgetId,
      period: period || '6months',
      format: format || 'PDF'
    });

  } catch (error) {
    console.error('Error exporting budget reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rota de previsões para orçamento específico
router.get('/:budgetId/reports/forecast', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const budgetId = req.params.budgetId;
    const { period, type } = req.query;

    // Buscar transações dos últimos meses para calcular previsões
    const months = period === '3months' ? 3 :
      period === '12months' ? 12 : 6; // default 6 meses

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await prisma.transaction.findMany({
      where: {
        budgetId,
        date: {
          gte: startDate,
          lte: new Date()
        }
      },
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calcular dados mensais históricos
    const monthlyData = new Map();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          income: 0,
          expenses: 0,
          balance: 0
        });
      }

      const monthData = monthlyData.get(monthKey);
      const amount = parseFloat(transaction.amount.toString());

      if (transaction.type === 'INCOME') {
        monthData.income += amount;
      } else {
        monthData.expenses += Math.abs(amount);
      }
    });

    // Calcular balanço para cada mês
    monthlyData.forEach(data => {
      data.balance = data.income - data.expenses;
    });

    const historicalData = Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));

    // Calcular médias e tendências
    let avgIncome = 0;
    let avgExpenses = 0;
    let avgBalance = 0;

    if (historicalData.length > 0) {
      avgIncome = historicalData.reduce((sum, d) => sum + d.income, 0) / historicalData.length;
      avgExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0) / historicalData.length;
      avgBalance = avgIncome - avgExpenses;
    }

    // Gerar previsões para os próximos 3 meses
    const forecast = [];
    const currentDate = new Date();

    for (let i = 1; i <= 3; i++) {
      const forecastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = forecastDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      // Adicionar pequena variação para previsão realística
      const variation = 1 + (Math.random() - 0.5) * 0.1; // +/- 5%

      const forecastIncome = avgIncome * variation;
      const forecastExpenses = avgExpenses * variation;
      const forecastBalance = forecastIncome - forecastExpenses;

      forecast.push({
        month: monthName,
        historical: null,
        predicted: type === 'income' ? forecastIncome :
          type === 'expenses' ? forecastExpenses : forecastBalance,
        optimistic: type === 'income' ? forecastIncome * 1.1 :
          type === 'expenses' ? forecastExpenses * 0.9 : forecastBalance * 1.1,
        pessimistic: type === 'income' ? forecastIncome * 0.9 :
          type === 'expenses' ? forecastExpenses * 1.1 : forecastBalance * 0.9
      });
    }

    // Adicionar dados históricos ao forecast
    const forecastData = historicalData.map(data => ({
      month: data.month,
      historical: type === 'income' ? data.income :
        type === 'expenses' ? data.expenses : data.balance,
      predicted: null,
      optimistic: null,
      pessimistic: null
    })).concat(forecast);

    // Calcular tendência
    let trend = 'stable';
    let growthRate = 0;

    if (historicalData.length >= 2) {
      const recent = historicalData[historicalData.length - 1];
      const previous = historicalData[historicalData.length - 2];

      const recentValue = type === 'income' ? recent.income :
        type === 'expenses' ? recent.expenses : recent.balance;
      const previousValue = type === 'income' ? previous.income :
        type === 'expenses' ? previous.expenses : previous.balance;

      if (previousValue !== 0) {
        growthRate = ((recentValue - previousValue) / previousValue) * 100;
        trend = growthRate > 5 ? 'up' : growthRate < -5 ? 'down' : 'stable';
      }
    }

    const summary = {
      nextMonthPrediction: forecast.length > 0 ? forecast[0].predicted : 0,
      growthRate,
      trend,
      confidence: Math.min(85, 50 + (historicalData.length * 5)), // Mais dados = maior confiança
      recommendation: trend === 'up' ? 'Tendência positiva mantida!' :
        trend === 'down' ? 'Atenção: tendência de queda detectada.' :
          'Comportamento estável nos últimos meses.'
    };

    res.json({
      data: {
        forecastData,
        summary
      }
    });

  } catch (error) {
    console.error('Error getting budget forecast:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rota de análise de orçamento para orçamento específico
router.get('/:budgetId/analysis', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const budgetId = req.params.budgetId;

    // Buscar itens de orçamento do orçamento específico
    const budgetItems = await prisma.budgetItem.findMany({
      where: {
        budgetId: budgetId,
        isActive: true
      },
      include: {
        category: true
      }
    });

    if (budgetItems.length === 0) {
      res.json([]);
      return;
    }

    // Calcular período atual (exemplo: mês atual)
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Para cada item de orçamento, calcular gastos reais
    const analysis = [];
    for (const item of budgetItems) {
      // Buscar gastos da categoria no período atual
      const transactions = await prisma.transaction.findMany({
        where: {
          budgetId: budgetId,
          categoryId: item.categoryId,
          type: 'EXPENSE',
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const spentAmount = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);
      const budgetAmount = parseFloat(item.amount.toString());
      const remainingAmount = budgetAmount - spentAmount;
      const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

      let status: 'good' | 'warning' | 'exceeded' = 'good';
      if (percentage > 100) status = 'exceeded';
      else if (percentage > 80) status = 'warning';

      analysis.push({
        id: item.id,
        category: {
          id: item.category.id,
          name: item.category.name,
          type: item.category.type,
          color: item.category.color || '#3B82F6'
        },
        budgetAmount,
        spentAmount,
        remainingAmount,
        percentage: Math.round(percentage * 100) / 100,
        status,
        period: item.period
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error getting budget analysis:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Configuração do multer para upload de arquivos (importação)
const upload = multer({
  dest: path.join(os.tmpdir(), 'budget-imports'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/pdf', 'text/plain'];
    const allowedExtensions = ['.csv', '.pdf', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Envie apenas CSV ou PDF.'));
    }
  }
});

// Rotas de importação para orçamentos específicos
/**
 * POST /api/budgets/:budgetId/import/upload
 * Upload para orçamento específico
 */
router.post('/:budgetId/import/upload', budgetAuth, requireWritePermission, upload.single('file'), (req, res, next) => {
  req.body.budgetId = req.params.budgetId;
  next();
}, ImportController.uploadFile);

/**
 * GET /api/budgets/:budgetId/import/sessions
 * Lista sessões de importação de orçamento específico
 */
router.get('/:budgetId/import/sessions', budgetAuth, ImportController.getSessions);

/**
 * GET /api/budgets/:budgetId/import/sessions/:sessionId
 * Obtém transações de uma sessão para classificação
 */
router.get('/:budgetId/import/sessions/:sessionId', budgetAuth, ImportController.getSessionTransactions);

/**
 * PUT /api/budgets/:budgetId/import/transactions/:transactionId/classify
 * Classifica uma transação individual
 */
router.put('/:budgetId/import/transactions/:transactionId/classify', budgetAuth, requireWritePermission, ImportController.classifyTransaction);

/**
 * POST /api/budgets/:budgetId/import/sessions/:sessionId/confirm
 * Confirma importação das transações classificadas
 */
router.post('/:budgetId/import/sessions/:sessionId/confirm', budgetAuth, requireWritePermission, ImportController.confirmImport);

/**
 * DELETE /api/budgets/:budgetId/import/sessions/:sessionId
 * Cancela sessão de importação
 */
router.delete('/:budgetId/import/sessions/:sessionId', budgetAuth, requireWritePermission, ImportController.cancelSession);

export default router;
