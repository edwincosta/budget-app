import { Router, Request, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

const transactionSchema = Joi.object({
  description: Joi.string().min(1).max(100).required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('INCOME', 'EXPENSE').required(),
  date: Joi.date().required(),
  accountId: Joi.string().required(),
  categoryId: Joi.string().required()
});

// @route   GET /api/transactions
// @desc    Get all transactions for user's default budget
// @access  Private
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user's default budget
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(404).json({ message: 'No default budget found' });
      return;
    }

    const transactions = await prisma.transaction.findMany({
      where: { budgetId: user.defaultBudgetId },
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, type: true, color: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Convert Decimal amounts to numbers
    const formattedTransactions = transactions.map((transaction: any) => ({
      ...transaction,
      amount: Number(transaction.amount)
    }));

    res.json({
      success: true,
      data: formattedTransactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = transactionSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    // Get user's default budget
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(404).json({ message: 'No default budget found' });
      return;
    }

    // Verify account belongs to user's budget
    const account = await prisma.account.findFirst({
      where: { id: value.accountId, budgetId: user.defaultBudgetId }
    });

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    // Verify category belongs to user's budget
    const category = await prisma.category.findFirst({
      where: { id: value.categoryId, budgetId: user.defaultBudgetId }
    });

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...value,
        budgetId: user.defaultBudgetId
      },
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, type: true, color: true } }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount)
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = transactionSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    // Get user's default budget
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(404).json({ message: 'No default budget found' });
      return;
    }

    // Check if transaction exists and belongs to user's budget
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, budgetId: user.defaultBudgetId }
    });

    if (!existingTransaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    // Verify account belongs to user's budget
    const account = await prisma.account.findFirst({
      where: { id: value.accountId, budgetId: user.defaultBudgetId }
    });

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    // Verify category belongs to user's budget
    const category = await prisma.category.findFirst({
      where: { id: value.categoryId, budgetId: user.defaultBudgetId }
    });

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: value,
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, type: true, color: true } }
      }
    });

    res.json({
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount)
      }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user's default budget
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(404).json({ message: 'No default budget found' });
      return;
    }

    // Check if transaction exists and belongs to user's budget
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, budgetId: user.defaultBudgetId }
    });

    if (!existingTransaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    await prisma.transaction.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
