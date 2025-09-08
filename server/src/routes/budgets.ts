import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth, AuthRequest } from '../middleware/auth';
import { budgetAuth, requireWritePermission, requireOwnership, BudgetAuthRequest } from '../middleware/budgetAuth';

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

export default router;
