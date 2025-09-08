import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

export interface BudgetAuthRequest extends AuthRequest {
  budget?: {
    id: string;
    name: string;
    ownerId: string;
    permission: 'OWNER' | 'READ' | 'WRITE';
  };
}

// Middleware para verificar acesso ao orçamento
export const budgetAuth = async (req: BudgetAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Pegar o budgetId dos parâmetros da URL ou do body
    const budgetId = req.params.budgetId || req.body.budgetId;

    if (!budgetId) {
      res.status(400).json({ message: 'Budget ID is required' });
      return;
    }

    // Verificar se o orçamento existe e se o usuário é proprietário
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        ownerId: req.user.id
      }
    });

    if (budget) {
      // Usuário é proprietário
      req.budget = {
        id: budget.id,
        name: budget.name,
        ownerId: budget.ownerId,
        permission: 'OWNER'
      };
      next();
      return;
    }

    // Verificar se o usuário tem acesso compartilhado
    const sharedBudget = await prisma.budgetShare.findFirst({
      where: {
        budgetId: budgetId,
        sharedWithId: req.user.id,
        status: 'ACCEPTED'
      },
      include: {
        budget: true
      }
    });

    if (sharedBudget) {
      req.budget = {
        id: sharedBudget.budget.id,
        name: sharedBudget.budget.name,
        ownerId: sharedBudget.budget.ownerId,
        permission: sharedBudget.permission
      };
      next();
      return;
    }

    res.status(403).json({ message: 'Access denied to this budget' });
  } catch (error) {
    console.error('Budget auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware para verificar permissão de escrita
export const requireWritePermission = (req: BudgetAuthRequest, res: Response, next: NextFunction): void => {
  if (!req.budget) {
    res.status(401).json({ message: 'Budget authentication required' });
    return;
  }

  if (req.budget.permission !== 'OWNER' && req.budget.permission !== 'WRITE') {
    res.status(403).json({ message: 'Write permission required' });
    return;
  }

  next();
};

// Middleware para verificar se é proprietário
export const requireOwnership = (req: BudgetAuthRequest, res: Response, next: NextFunction): void => {
  if (!req.budget) {
    res.status(401).json({ message: 'Budget authentication required' });
    return;
  }

  if (req.budget.permission !== 'OWNER') {
    res.status(403).json({ message: 'Budget ownership required' });
    return;
  }

  next();
};
