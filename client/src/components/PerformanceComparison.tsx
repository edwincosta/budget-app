import { useState, useEffect } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

interface ComparisonData {
  currentPeriod: {
    income: number;
    expenses: number;
    savings: number;
  };
  previousPeriod: {
    income: number;
    expenses: number;
    savings: number;
  };
  growth: {
    income: number;
    expenses: number;
    savings: number;
  };
}

interface PerformanceComparisonProps {
  selectedPeriod: string;
  budgetId?: string;
}

export default function PerformanceComparison({ selectedPeriod, budgetId }: PerformanceComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparisonData();
  }, [selectedPeriod, budgetId]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      
      // Use the same API service pattern as other components
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      // Build URL with optional budgetId
      const baseUrl = budgetId 
        ? `${API_URL}/api/reports/comparison/${budgetId}` 
        : `${API_URL}/api/reports/comparison`;
      
      // Fetch comparison data from backend
      const response = await fetch(`${baseUrl}?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setComparisonData(result.data || null);
      } else {
        console.error('Failed to fetch comparison data');
        setComparisonData(null);
      }
    } catch (error) {
      console.error('Error loading comparison data:', error);
      setComparisonData(null);
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

  const totalCurrentIncome = comparisonData?.currentPeriod.income || 0;
  const incomeTrend = comparisonData?.growth.income || 0;

  const totalCurrentExpenses = comparisonData?.currentPeriod.expenses || 0;
  const expensesTrend = comparisonData?.growth.expenses || 0;

  const currentBalance = comparisonData?.currentPeriod.savings || 0;
  const balanceTrend = comparisonData?.growth.savings || 0;

  // Format data for the chart
  const chartData = comparisonData ? [
    {
      period: 'Atual',
      income: comparisonData.currentPeriod.income,
      expenses: comparisonData.currentPeriod.expenses,
      balance: comparisonData.currentPeriod.savings
    },
    {
      period: 'Anterior', 
      income: comparisonData.previousPeriod.income,
      expenses: comparisonData.previousPeriod.expenses,
      balance: comparisonData.previousPeriod.savings
    }
  ] : [];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum dado de comparação encontrado
        </h3>
        <p className="text-gray-600 mb-6">
          Adicione algumas transações para gerar relatórios de comparação.
        </p>
        <button
          onClick={() => window.location.href = '/transactions'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Adicionar Transações
        </button>
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
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => `Período: ${label}`}
            />
            <Legend />
            <Bar dataKey="income" fill="#10B981" name="Receitas" />
            <Bar dataKey="expenses" fill="#EF4444" name="Despesas" />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3B82F6" 
              strokeWidth={3}
              name="Saldo"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
