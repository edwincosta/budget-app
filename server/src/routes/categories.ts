import { Router } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

const categorySchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  type: Joi.string().valid('INCOME', 'EXPENSE').required(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#6366f1'),
  icon: Joi.string().max(50).optional(),
  inactive: Joi.boolean().default(false)
});

// @route   GET /api/categories
// @desc    Get all categories for user's default budget
// @access  Private
router.get('/', auth, async (req: AuthRequest, res): Promise<void> => {
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

    const categories = await prisma.category.findMany({
      where: { budgetId: user.defaultBudgetId },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/categories
// @desc    Create a new category in user's default budget
// @access  Private
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0]?.message });
    }

    // Get user's default budget
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      return res.status(404).json({ message: 'No default budget found' });
    }

    const category = await prisma.category.create({
      data: {
        ...value,
        budgetId: user.defaultBudgetId
      }
    });

    return res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private
router.put('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = categorySchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ message: error.details[0]?.message });
    }

    // Get user's default budget
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      return res.status(404).json({ message: 'No default budget found' });
    }

    // Check if category exists and belongs to user's budget
    const existingCategory = await prisma.category.findFirst({
      where: { id, budgetId: user.defaultBudgetId }
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: value
    });

    return res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private
router.delete('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get user's default budget
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { defaultBudgetId: true }
    });

    if (!user?.defaultBudgetId) {
      return res.status(404).json({ message: 'No default budget found' });
    }

    // Check if category exists and belongs to user's budget
    const existingCategory = await prisma.category.findFirst({
      where: { id, budgetId: user.defaultBudgetId }
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category is being used in transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id }
    });

    if (transactionCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category that is being used in transactions' 
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
