import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { budgetAuth, BudgetAuthRequest } from '../middleware/budgetAuth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Simple test route
router.get('/test', auth, async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Reports API working' });
});

// @route   GET /api/reports/comparison
// @desc    Get comparison data for user's default budget
// @access  Private
router.get('/comparison', auth, async (req: AuthRequest, res: Response) => {
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

    // Mock data for now
    res.json({
      success: true,
      data: {
        currentPeriod: { income: 5000, expenses: 3000, savings: 2000 },
        previousPeriod: { income: 4500, expenses: 2800, savings: 1700 },
        growth: { income: 11.1, expenses: 7.1, savings: 17.6 }
      }
    });

  } catch (error) {
    console.error('Error getting comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/reports/comparison/:budgetId
// @desc    Get comparison data for specific budget
// @access  Private (with budget permissions)
router.get('/comparison/:budgetId', auth, budgetAuth, async (req: BudgetAuthRequest, res: Response) => {
  try {
    // Mock data for now
    res.json({
      success: true,
      data: {
        currentPeriod: { income: 5000, expenses: 3000, savings: 2000 },
        previousPeriod: { income: 4500, expenses: 2800, savings: 1700 },
        growth: { income: 11.1, expenses: 7.1, savings: 17.6 }
      }
    });

  } catch (error) {
    console.error('Error getting comparison for budget:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
