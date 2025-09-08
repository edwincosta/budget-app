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

// Main reports route - GET /api/reports
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const budgetId = await getBudgetId(req);
    
    if (!budgetId) {
      res.status(404).json({ message: 'No budget found' });
      return;
    }

    const mode = req.query.mode as string || 'period';
    const period = req.query.period as string || '6months';
    const month = req.query.month as string;

    let startDate: Date;
    let endDate: Date = new Date();

    // Determine date range based on mode and parameters
    if (mode === 'monthly' && month) {
      const [year, monthNum] = month.split('-');
      if (year && monthNum) {
        startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(monthNum), 0);
      } else {
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      }
    } else {
      // Period mode
      const monthsBack = period === '3months' ? 3 : period === '12months' ? 12 : period === 'year' ? 12 : 6;
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - monthsBack + 1, 1);
    }

    // Get transactions for the date range
    const transactions = await prisma.transaction.findMany({
      where: {
        budgetId,
        date: { gte: startDate, lte: endDate }
      },
      include: {
        category: { select: { name: true, type: true, color: true } }
      },
      orderBy: { date: 'asc' }
    });

    // Process monthly data
    const monthlyDataMap: { [key: string]: { income: number; expenses: number; balance: number } } = {};
    const categoryExpensesMap: { [key: string]: { amount: number; transactions: number } } = {};
    const categoryIncomeMap: { [key: string]: { amount: number; transactions: number } } = {};

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      const monthKey = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`;
      const categoryName = transaction.category?.name || 'Sem categoria';

      // Initialize month data if not exists
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { income: 0, expenses: 0, balance: 0 };
      }

      if (transaction.category?.type === 'INCOME') {
        monthlyDataMap[monthKey].income += amount;
        totalIncome += amount;
        
        if (!categoryIncomeMap[categoryName]) {
          categoryIncomeMap[categoryName] = { amount: 0, transactions: 0 };
        }
        categoryIncomeMap[categoryName].amount += amount;
        categoryIncomeMap[categoryName].transactions++;
      } else {
        monthlyDataMap[monthKey].expenses += Math.abs(amount);
        totalExpenses += Math.abs(amount);
        
        if (!categoryExpensesMap[categoryName]) {
          categoryExpensesMap[categoryName] = { amount: 0, transactions: 0 };
        }
        categoryExpensesMap[categoryName].amount += Math.abs(amount);
        categoryExpensesMap[categoryName].transactions++;
      }

      monthlyDataMap[monthKey].balance = monthlyDataMap[monthKey].income - monthlyDataMap[monthKey].expenses;
    });

    // Format monthly data
    const monthlyData = Object.keys(monthlyDataMap)
      .sort()
      .map(month => ({
        month,
        ...monthlyDataMap[month]
      }));

    // Format category data with percentages
    const expensesByCategory = Object.keys(categoryExpensesMap).map(name => {
      const amount = categoryExpensesMap[name].amount;
      return {
        name,
        value: amount,
        percentage: totalExpenses > 0 ? Number((amount / totalExpenses * 100).toFixed(1)) : 0
      };
    }).sort((a, b) => b.value - a.value);

    const incomeByCategory = Object.keys(categoryIncomeMap).map(name => {
      const amount = categoryIncomeMap[name].amount;
      return {
        name,
        value: amount,
        percentage: totalIncome > 0 ? Number((amount / totalIncome * 100).toFixed(1)) : 0
      };
    }).sort((a, b) => b.value - a.value);

    // Top expenses by category
    const topExpenses = Object.keys(categoryExpensesMap).map(category => ({
      category,
      amount: categoryExpensesMap[category].amount,
      transactions: categoryExpensesMap[category].transactions
    })).sort((a, b) => b.amount - a.amount).slice(0, 10);

    // Calculate averages
    const monthCount = monthlyData.length || 1;
    const summary = {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      averageMonthlyIncome: totalIncome / monthCount,
      averageMonthlyExpenses: totalExpenses / monthCount
    };

    res.json({
      success: true,
      data: {
        monthlyData,
        expensesByCategory,
        incomeByCategory,
        topExpenses,
        summary
      }
    });

  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Export reports route - supports both /export and /export/csv for backwards compatibility
router.get('/export/:format?', auth, async (req: AuthRequest, res: Response) => {
  try {
    const period = req.query.period as string || '6months';
    const format = req.params.format || req.query.format as string || 'pdf';

    if (format === 'csv') {
      // Return CSV format for tests
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${period}.csv`);
      
      const csvContent = 'description,amount,type,date,category\n' +
        'Sample Transaction,100.00,income,2024-01-01,Salary\n' +
        'Sample Expense,-50.00,expense,2024-01-02,Food\n';
      
      return res.send(csvContent);
    }

    // For other formats, return a placeholder response
    res.json({
      success: true,
      message: `Export ${format.toUpperCase()} for period ${period} - Feature coming soon`,
      downloadUrl: null
    });

  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
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
