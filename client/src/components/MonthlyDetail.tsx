import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calendar, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react'

interface MonthlyDetailProps {
  selectedMonth: string;
  budgetId?: string;
}

interface DailyTransaction {
  day: number;
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
}

interface MonthlyInsights {
  bestDay: { day: number; balance: number };
  worstDay: { day: number; balance: number };
  avgDailyIncome: number;
  avgDailyExpenses: number;
  totalTransactions: number;
  daysWithTransactions: number;
}

export default function MonthlyDetail({ selectedMonth, budgetId }: MonthlyDetailProps) {
  const [dailyData, setDailyData] = useState<DailyTransaction[]>([]);
  const [insights, setInsights] = useState<MonthlyInsights>({
    bestDay: { day: 1, balance: 0 },
    worstDay: { day: 1, balance: 0 },
    avgDailyIncome: 0,
    avgDailyExpenses: 0,
    totalTransactions: 0,
    daysWithTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthlyDetail();
  }, [selectedMonth, budgetId]);

  const loadMonthlyDetail = async () => {
    try {
      setLoading(true);
      
      // Build URL with optional budgetId
      const baseUrl = budgetId 
        ? `/api/reports/monthly-detail/${budgetId}` 
        : '/api/reports/monthly-detail';
      
      // Fetch monthly detail data from backend
      const response = await fetch(`${baseUrl}?month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setDailyData(result.data?.dailyData || []);
        setInsights(result.data?.insights || {
          bestDay: { day: 1, balance: 0 },
          worstDay: { day: 1, balance: 0 },
          avgDailyIncome: 0,
          avgDailyExpenses: 0,
          totalTransactions: 0,
          daysWithTransactions: 0
        });
      } else {
        console.error('Failed to fetch monthly detail data');
        setDailyData([]);
        setInsights({
          bestDay: { day: 1, balance: 0 },
          worstDay: { day: 1, balance: 0 },
          avgDailyIncome: 0,
          avgDailyExpenses: 0,
          totalTransactions: 0,
          daysWithTransactions: 0
        });
      }
    } catch (error) {
      console.error('Error loading monthly detail:', error);
      setDailyData([]);
      setInsights({
        bestDay: { day: 1, balance: 0 },
        worstDay: { day: 1, balance: 0 },
        avgDailyIncome: 0,
        avgDailyExpenses: 0,
        totalTransactions: 0,
        daysWithTransactions: 0
      });
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

  const getBarColor = (balance: number) => {
    return balance >= 0 ? '#10B981' : '#EF4444';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const monthName = new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Show empty state when no data
  if (dailyData.length === 0 && insights.totalTransactions === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma transação encontrada para {monthName}
        </h3>
        <p className="text-gray-600 mb-6">
          Adicione algumas transações para ver o detalhamento diário.
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
      {/* Monthly Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Melhor Dia</p>
              <p className="text-lg font-bold text-green-600">
                Dia {insights.bestDay.day}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(insights.bestDay.balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pior Dia</p>
              <p className="text-lg font-bold text-red-600">
                Dia {insights.worstDay.day}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(insights.worstDay.balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transações</p>
              <p className="text-lg font-bold text-blue-600">
                {insights.totalTransactions}
              </p>
              <p className="text-sm text-gray-500">
                {insights.daysWithTransactions} dias ativos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Média Diária</p>
              <p className="text-lg font-bold text-yellow-600">
                {formatCurrency(insights.avgDailyIncome - insights.avgDailyExpenses)}
              </p>
              <p className="text-sm text-gray-500">
                Saldo médio/dia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Balance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Saldo Diário - {monthName}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              interval={Math.ceil(dailyData.length / 10)} // Show every nth tick to avoid crowding
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'balance') return [formatCurrency(Number(value)), 'Saldo'];
                return [formatCurrency(Number(value)), name === 'income' ? 'Receita' : 'Despesa'];
              }}
              labelFormatter={(day) => `Dia ${day}`}
            />
            <Bar dataKey="balance" name="Saldo">
              {dailyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.balance)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Detalhamento Diário</h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receitas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Despesas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyData.map((day) => (
                  <tr key={day.day} className={day.transactionCount === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {day.day}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {day.income > 0 ? formatCurrency(day.income) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      {day.expenses > 0 ? formatCurrency(day.expenses) : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                      day.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {day.transactionCount > 0 ? formatCurrency(day.balance) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.transactionCount > 0 ? (
                        <span className="inline-flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {day.transactionCount}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
