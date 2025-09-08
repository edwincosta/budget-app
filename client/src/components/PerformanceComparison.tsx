import { useState, useEffect } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

interface ComparisonData {
  period: string;
  current: {
    income: number;
    expenses: number;
    balance: number;
  };
  previous: {
    income: number;
    expenses: number;
    balance: number;
  };
}

interface PerformanceComparisonProps {
  selectedPeriod: string;
  budgetId?: string;
}

export default function PerformanceComparison({ selectedPeriod, budgetId }: PerformanceComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparisonData();
  }, [selectedPeriod, budgetId]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      
      // Build URL with optional budgetId
      const baseUrl = budgetId 
        ? `/api/reports/comparison/${budgetId}` 
        : '/api/reports/comparison';
      
      // Fetch comparison data from backend
      const response = await fetch(`${baseUrl}?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setComparisonData(result.data || []);
      } else {
        console.error('Failed to fetch comparison data');
        setComparisonData([]);
      }
    } catch (error) {
      console.error('Error loading comparison data:', error);
      setComparisonData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const totalCurrentIncome = comparisonData.reduce((sum, item) => sum + item.current.income, 0);
  const totalPreviousIncome = comparisonData.reduce((sum, item) => sum + item.previous.income, 0);
  const incomeTrend = calculateTrend(totalCurrentIncome, totalPreviousIncome);

  const totalCurrentExpenses = comparisonData.reduce((sum, item) => sum + item.current.expenses, 0);
  const totalPreviousExpenses = comparisonData.reduce((sum, item) => sum + item.previous.expenses, 0);
  const expensesTrend = calculateTrend(totalCurrentExpenses, totalPreviousExpenses);

  const currentBalance = totalCurrentIncome - totalCurrentExpenses;
  const previousBalance = totalPreviousIncome - totalPreviousExpenses;
  const balanceTrend = calculateTrend(currentBalance, previousBalance);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receitas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCurrentIncome)}
              </p>
              <div className="flex items-center mt-2">
                {incomeTrend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${incomeTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(incomeTrend).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
              </div>
            </div>
            <Calendar className="w-8 h-8 text-green-100" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalCurrentExpenses)}
              </p>
              <div className="flex items-center mt-2">
                {expensesTrend <= 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${expensesTrend <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(expensesTrend).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
              </div>
            </div>
            <Calendar className="w-8 h-8 text-red-100" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Líquido</p>
              <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(currentBalance)}
              </p>
              <div className="flex items-center mt-2">
                {balanceTrend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${balanceTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(balanceTrend).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
              </div>
            </div>
            <Calendar className="w-8 h-8 text-blue-100" />
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Comparação com Período Anterior</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Legend />
            <Bar dataKey="current.income" fill="#10B981" name="Receitas (Atual)" />
            <Bar dataKey="previous.income" fill="#6EE7B7" name="Receitas (Anterior)" />
            <Bar dataKey="current.expenses" fill="#EF4444" name="Despesas (Atual)" />
            <Bar dataKey="previous.expenses" fill="#FCA5A5" name="Despesas (Anterior)" />
            <Line 
              type="monotone" 
              dataKey="current.balance" 
              stroke="#3B82F6" 
              strokeWidth={3}
              name="Saldo (Atual)"
            />
            <Line 
              type="monotone" 
              dataKey="previous.balance" 
              stroke="#93C5FD" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Saldo (Anterior)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
