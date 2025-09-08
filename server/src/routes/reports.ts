import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { budgetAuth, BudgetAuthRequest } from '../middleware/budgetAuth';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();
const prisma = new PrismaClient();

// Helper functions for precise Decimal operations
function toDecimal(value: any): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

function isPositive(amount: Decimal): boolean {
  return amount.greaterThan(0);
}

function isNegative(amount: Decimal): boolean {
  return amount.lessThan(0);
}

function addDecimals(a: Decimal, b: Decimal): Decimal {
  return a.plus(b);
}

function subtractDecimals(a: Decimal, b: Decimal): Decimal {
  return a.minus(b);
}

function multiplyDecimals(a: Decimal, b: Decimal): Decimal {
  return a.times(b);
}

function divideDecimals(a: Decimal, b: Decimal): Decimal {
  return b.equals(0) ? new Decimal(0) : a.dividedBy(b);
}

function absoluteDecimal(value: Decimal): Decimal {
  return value.absoluteValue();
}

// Convert Decimal to number only for final JSON response
function toNumberForJson(value: Decimal, decimals: number = 2): number {
  return Number(value.toFixed(decimals));
}

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
        await handleComparison(req as BudgetAuthRequest, res);
      });
    }
    
    // Use default budget
    await handleComparison(req, res);

  } catch (error) {
    console.error('Error in comparison route:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Handler function for comparison logic
async function handleComparison(req: AuthRequest, res: Response) {
  try {
    const budgetId = await getBudgetId(req);
    
    if (!budgetId) {
      res.status(404).json({ message: 'No budget found' });
      return;
    }

    const period = req.query.period as string || '6months';
    const endDate = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    // Calculate date ranges based on period
    switch (period) {
      case '1month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        previousEndDate = new Date(startDate.getTime() - 1);
        previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1);
        previousEndDate = new Date(startDate.getTime() - 1);
        previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth() - 2, 1);
        break;
      case '6months':
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);
        previousEndDate = new Date(startDate.getTime() - 1);
        previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth() - 5, 1);
        break;
    }

    // Get current period transactions
    const currentTransactions = await prisma.transaction.findMany({
      where: {
        budgetId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get previous period transactions
    const previousTransactions = await prisma.transaction.findMany({
      where: {
        budgetId,
        date: {
          gte: previousStartDate,
          lte: previousEndDate
        }
      }
    });

    // Calculate totals with Decimal precision
    const currentIncome = currentTransactions
      .filter(t => isPositive(toDecimal(t.amount)))
      .reduce((sum, t) => addDecimals(sum, toDecimal(t.amount)), new Decimal(0));
    
    const currentExpenses = currentTransactions
      .filter(t => isNegative(toDecimal(t.amount)))
      .reduce((sum, t) => addDecimals(sum, absoluteDecimal(toDecimal(t.amount))), new Decimal(0));

    const previousIncome = previousTransactions
      .filter(t => isPositive(toDecimal(t.amount)))
      .reduce((sum, t) => addDecimals(sum, toDecimal(t.amount)), new Decimal(0));
    
    const previousExpenses = previousTransactions
      .filter(t => isNegative(toDecimal(t.amount)))
      .reduce((sum, t) => addDecimals(sum, absoluteDecimal(toDecimal(t.amount))), new Decimal(0));

    // Calculate growth percentages with Decimal precision
    const incomeGrowth = previousIncome.greaterThan(0) 
      ? multiplyDecimals(
          divideDecimals(
            subtractDecimals(currentIncome, previousIncome), 
            previousIncome
          ), 
          new Decimal(100)
        )
      : new Decimal(0);
    
    const expensesGrowth = previousExpenses.greaterThan(0) 
      ? multiplyDecimals(
          divideDecimals(
            subtractDecimals(currentExpenses, previousExpenses), 
            previousExpenses
          ), 
          new Decimal(100)
        )
      : new Decimal(0);

    const currentSavings = subtractDecimals(currentIncome, currentExpenses);
    const previousSavings = subtractDecimals(previousIncome, previousExpenses);
    const savingsGrowth = previousSavings.greaterThan(0) 
      ? multiplyDecimals(
          divideDecimals(
            subtractDecimals(currentSavings, previousSavings), 
            previousSavings
          ), 
          new Decimal(100)
        )
      : new Decimal(0);

    res.json({
      success: true,
      data: {
        currentPeriod: {
          income: toNumberForJson(currentIncome),
          expenses: toNumberForJson(currentExpenses),
          savings: toNumberForJson(currentSavings)
        },
        previousPeriod: {
          income: toNumberForJson(previousIncome),
          expenses: toNumberForJson(previousExpenses),
          savings: toNumberForJson(previousSavings)
        },
        growth: {
          income: toNumberForJson(incomeGrowth, 1),
          expenses: toNumberForJson(expensesGrowth, 1),
          savings: toNumberForJson(savingsGrowth, 1)
        }
      }
    });

  } catch (error) {
    console.error('Error getting comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Forecast route with optional budgetId
router.get('/forecast/:budgetId?', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.budgetId) {
      return budgetAuth(req as BudgetAuthRequest, res, async () => {
        await handleForecast(req as BudgetAuthRequest, res);
      });
    }
    
    await handleForecast(req, res);

  } catch (error) {
    console.error('Error in forecast route:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Handler function for forecast logic
async function handleForecast(req: AuthRequest, res: Response) {
  try {
    const budgetId = await getBudgetId(req);
    
    if (!budgetId) {
      res.status(404).json({ message: 'No budget found' });
      return;
    }

    // Get last 6 months of data for trend analysis
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        budgetId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    // Group by month with Decimal precision
    const monthlyData: { [key: string]: { income: Decimal; expenses: Decimal } } = {};
    
    transactions.forEach(transaction => {
      const monthKey = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: new Decimal(0), expenses: new Decimal(0) };
      }
      
      const amount = toDecimal(transaction.amount);
      if (isPositive(amount)) {
        monthlyData[monthKey].income = addDecimals(monthlyData[monthKey].income, amount);
      } else {
        monthlyData[monthKey].expenses = addDecimals(monthlyData[monthKey].expenses, absoluteDecimal(amount));
      }
    });

    // Calculate trends and generate forecast with Decimal precision
    const months = Object.keys(monthlyData).sort();
    const incomeValues = months.map(month => monthlyData[month].income);
    const expenseValues = months.map(month => monthlyData[month].expenses);

    // Calculate averages with Decimal precision
    const totalIncome = incomeValues.reduce((sum, val) => addDecimals(sum, val), new Decimal(0));
    const totalExpenses = expenseValues.reduce((sum, val) => addDecimals(sum, val), new Decimal(0));
    
    const avgIncome = incomeValues.length > 0 
      ? divideDecimals(totalIncome, new Decimal(incomeValues.length))
      : new Decimal(0);
    const avgExpenses = expenseValues.length > 0 
      ? divideDecimals(totalExpenses, new Decimal(expenseValues.length))
      : new Decimal(0);

    // Generate next 3 months forecast with Decimal precision
    const forecast = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= 3; i++) {
      const forecastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = forecastDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Add slight variation for realistic forecast using Decimal
      const variationFactor = new Decimal(0.95 + (Math.random() * 0.1)); // 95% to 105%
      
      const forecastIncome = multiplyDecimals(avgIncome, variationFactor);
      const forecastExpenses = multiplyDecimals(avgExpenses, variationFactor);
      const forecastSavings = subtractDecimals(forecastIncome, forecastExpenses);
      
      forecast.push({
        month: monthName,
        income: toNumberForJson(forecastIncome),
        expenses: toNumberForJson(forecastExpenses),
        savings: toNumberForJson(forecastSavings),
        confidence: Math.max(60, 95 - (i * 10)) // Decreasing confidence over time
      });
    }

    res.json({
      success: true,
      data: {
        trends: {
          avgMonthlyIncome: toNumberForJson(avgIncome),
          avgMonthlyExpenses: toNumberForJson(avgExpenses),
          avgMonthlySavings: toNumberForJson(subtractDecimals(avgIncome, avgExpenses))
        },
        forecast
      }
    });

  } catch (error) {
    console.error('Error getting forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

// Monthly detail route with optional budgetId
router.get('/monthly-detail/:budgetId?', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.budgetId) {
      return budgetAuth(req as BudgetAuthRequest, res, async () => {
        await handleMonthlyDetail(req as BudgetAuthRequest, res);
      });
    }
    
    await handleMonthlyDetail(req, res);

  } catch (error) {
    console.error('Error in monthly-detail route:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Handler function for monthly detail logic
async function handleMonthlyDetail(req: AuthRequest, res: Response) {
  try {
    const budgetId = await getBudgetId(req);
    
    if (!budgetId) {
      res.status(404).json({ message: 'No budget found' });
      return;
    }

    const month = req.query.month as string;
    let startDate: Date;
    let endDate: Date;
    
    if (month) {
      // Parse month format YYYY-MM
      const [year, monthNum] = month.split('-');
      if (year && monthNum) {
        startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(monthNum), 0); // Last day of month
      } else {
        // Fallback to current month if invalid format
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        budgetId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    // Create daily data structure with Decimal precision
    const daysInMonth = endDate.getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      income: new Decimal(0),
      expenses: new Decimal(0),
      balance: new Decimal(0),
      transactionCount: 0
    }));

    // Populate daily data with Decimal operations
    transactions.forEach(transaction => {
      const dayIndex = transaction.date.getDate() - 1;
      const amount = toDecimal(transaction.amount);
      
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        dailyData[dayIndex].transactionCount++;
        
        if (isPositive(amount)) {
          dailyData[dayIndex].income = addDecimals(dailyData[dayIndex].income, amount);
        } else {
          dailyData[dayIndex].expenses = addDecimals(dailyData[dayIndex].expenses, absoluteDecimal(amount));
        }
        
        dailyData[dayIndex].balance = subtractDecimals(dailyData[dayIndex].income, dailyData[dayIndex].expenses);
      }
    });

    // Calculate insights with Decimal precision
    const daysWithTransactions = dailyData.filter(d => d.transactionCount > 0);
    const totalTransactions = transactions.length;
    const totalIncome = dailyData.reduce((sum, d) => addDecimals(sum, d.income), new Decimal(0));
    const totalExpenses = dailyData.reduce((sum, d) => addDecimals(sum, d.expenses), new Decimal(0));
    
    const bestDay = dailyData.reduce((best, current) => 
      current.balance.greaterThan(best.balance) ? current : best
    );
    
    const worstDay = dailyData.reduce((worst, current) => 
      current.balance.lessThan(worst.balance) ? current : worst
    );

    const avgDailyIncome = divideDecimals(totalIncome, new Decimal(daysInMonth));
    const avgDailyExpenses = divideDecimals(totalExpenses, new Decimal(daysInMonth));

    const insights = {
      bestDay: { day: bestDay.day, balance: toNumberForJson(bestDay.balance) },
      worstDay: { day: worstDay.day, balance: toNumberForJson(worstDay.balance) },
      avgDailyIncome: toNumberForJson(avgDailyIncome),
      avgDailyExpenses: toNumberForJson(avgDailyExpenses),
      totalTransactions,
      daysWithTransactions: daysWithTransactions.length
    };

    res.json({
      success: true,
      data: {
        dailyData: dailyData.map(d => ({
          day: d.day,
          income: toNumberForJson(d.income),
          expenses: toNumberForJson(d.expenses),
          balance: toNumberForJson(d.balance),
          transactionCount: d.transactionCount
        })),
        insights
      }
    });

  } catch (error) {
    console.error('Error getting monthly detail:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

export default router;
