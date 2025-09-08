import { Router, Request, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { budgetAuth, BudgetAuthRequest, requireWritePermission } from '../middleware/budgetAuth';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

console.log('Accounts routes loaded - GET, POST, PUT, DELETE endpoints registered');

const accountSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  type: Joi.string().valid('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT').required(),
  balance: Joi.number().default(0),
  description: Joi.string().max(200).optional(),
  inactive: Joi.boolean().default(false)
});

// @route   GET /api/accounts
// @desc    Get all accounts for user's default budget
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

    const accounts = await prisma.account.findMany({
      where: { budgetId: user.defaultBudgetId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: accounts.map((account: any) => ({
        ...account,
        balance: Number(account.balance)
      }))
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/accounts
// @desc    Create new account in user's default budget
// @access  Private
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = accountSchema.validate(req.body);
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

    const account = await prisma.account.create({
      data: {
        ...value,
        budgetId: user.defaultBudgetId
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...account,
        balance: Number(account.balance)
      }
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/accounts/:id
// @desc    Update account
// @access  Private
router.put('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = accountSchema.validate(req.body);
    
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

    // Check if account exists and belongs to user's budget
    const existingAccount = await prisma.account.findFirst({
      where: { id, budgetId: user.defaultBudgetId }
    });

    if (!existingAccount) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    const account = await prisma.account.update({
      where: { id },
      data: value
    });

    res.json({
      success: true,
      data: {
        ...account,
        balance: Number(account.balance)
      }
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/accounts/:id
// @desc    Delete account
// @access  Private
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete account with ID: ${id} for user: ${req.user!.id}`);

    // Get user's default budget
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      res.status(404).json({ message: 'No default budget found' });
      return;
    }

    // Check if account exists and belongs to user's budget
    const existingAccount = await prisma.account.findFirst({
      where: { id, budgetId: user.defaultBudgetId }
    });

    if (!existingAccount) {
      console.log(`Account not found or doesn't belong to user: ${id}`);
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    console.log(`Account found: ${existingAccount.name}`);

    // Check if account has transactions
    const transactionCount = await prisma.transaction.count({
      where: { accountId: id }
    });

    console.log(`Transaction count for account ${id}: ${transactionCount}`);

    if (transactionCount > 0) {
      console.log(`Cannot delete account ${id} - has ${transactionCount} transactions`);
      res.status(400).json({ 
        message: 'Cannot delete account with existing transactions' 
      });
      return;
    }

    await prisma.account.delete({
      where: { id }
    });

    console.log(`Account ${id} deleted successfully`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
