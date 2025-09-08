import { Router } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for user's default budget
// @access  Private
router.get('/stats', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get user's default budget
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(404).json({ message: 'No default budget found' });
      return;
    }

    // Get current month start and end
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all transactions for the budget
    const allTransactions = await prisma.transaction.findMany({
      where: { budgetId: user.defaultBudgetId },
      include: {
        account: { select: { name: true, type: true } },
        category: { select: { name: true, type: true, color: true } }
      }
    });

    // Get current month transactions
    const currentMonthTransactions = await prisma.transaction.findMany({
      where: {
        budgetId: user.defaultBudgetId,
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      include: {
        category: { select: { type: true } }
      }
    });

    // Calculate totals
    const totalBalance = allTransactions.reduce((sum: number, t: any) => {
      const amount = Number(t.amount);
      return sum + (t.category.type === 'INCOME' ? amount : -amount);
    }, 0);

    const monthlyIncome = currentMonthTransactions
      .filter((t: any) => t.category.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const monthlyExpenses = currentMonthTransactions
      .filter((t: any) => t.category.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    // Get accounts count
    const accountsCount = await prisma.account.count({
      where: { budgetId: user.defaultBudgetId }
    });

    // Get recent transactions (last 10)
    const recentTransactions = await prisma.transaction.findMany({
      where: { budgetId: user.defaultBudgetId },
      include: {
        account: { select: { name: true, type: true } },
        category: { select: { name: true, type: true, color: true } }
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Convert amounts to numbers
    const formattedRecentTransactions = recentTransactions.map((transaction: any) => ({
      ...transaction,
      amount: Number(transaction.amount)
    }));

    res.json({
      success: true,
      data: {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        accountsCount,
        recentTransactions: formattedRecentTransactions
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
