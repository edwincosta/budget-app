import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { budgetAuth, BudgetAuthRequest } from '../middleware/budgetAuth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper function to get budget ID
async function getBudgetId(req: AuthRequest): Promise<string | null> {
  const paramBudgetId = req.params.budgetId;
  
  if (paramBudgetId) {
    return paramBudgetId;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { defaultBudgetId: true }
  });
  
  return user?.defaultBudgetId || null;
}

// Test route
router.get('/test', auth, async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Reports API working with full auth support' });
});

// Comparison route with optional budgetId
router.get('/comparison/:budgetId?', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.budgetId) {
      // Validate budget permissions for shared budget
      return budgetAuth(req as BudgetAuthRequest, res, async () => {
        const budgetId = await getBudgetId(req as BudgetAuthRequest);
        res.json({
          success: true,
          budgetId,
          type: 'shared',
          message: 'Comparison data for shared budget'
        });
      });
    }
    
    // Use default budget
    const budgetId = await getBudgetId(req);
    res.json({
      success: true,
      budgetId,
      type: 'default',
      message: 'Comparison data for default budget'
    });

  } catch (error) {
    console.error('Error in comparison route:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
