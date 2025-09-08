import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { Calendar, DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3, FileText, Download, GitCompare, Target, Activity, Users } from 'lucide-react'
import { reportsService } from '@/services/api'
import PerformanceComparison from '@/components/PerformanceComparison'
import BudgetAnalysis from '@/components/BudgetAnalysis'
import FinancialForecast from '@/components/FinancialForecast'
import MonthlyDetail from '@/components/MonthlyDetail'
import { useBudget } from '@/contexts/BudgetContext'

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface ExpensesByCategory {
  category: string;
  amount: number;
  transactions: number;
}

interface ReportsData {
  monthlyData: MonthlyData[];
  expensesByCategory: CategoryData[];
  incomeByCategory: CategoryData[];
  topExpenses: ExpensesByCategory[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
  };
}

export default function Reports() {
  const { activeBudget } = useBudget();
  const [data, setData] = useState<ReportsData>({
    monthlyData: [],
    expensesByCategory: [],
    incomeByCategory: [],
    topExpenses: [],
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      averageMonthlyIncome: 0,
      averageMonthlyExpenses: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [activeReport, setActiveReport] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [viewMode, setViewMode] = useState<'period' | 'monthly'>('period');

  useEffect(() => {
    loadReports();
  }, [selectedPeriod, selectedMonth, viewMode, activeBudget]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = viewMode === 'monthly' 
        ? { mode: 'monthly', month: selectedMonth }
        : { mode: 'period', period: selectedPeriod };
      
      const budgetId = activeBudget?.budget?.id;
      const reportsData = await reportsService.getReports(params, budgetId);
      setData(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
      console.error('Error details:', (error as any)?.response?.data || (error as Error)?.message);
      // Reset to empty data when there's an error
      setData({
        monthlyData: [],
        expensesByCategory: [],
        incomeByCategory: [],
        topExpenses: [],
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          netBalance: 0,
          averageMonthlyIncome: 0,
          averageMonthlyExpenses: 0,
        }
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

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const budgetId = activeBudget?.budget?.id;
      await reportsService.exportReport(selectedPeriod, format, budgetId);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Banner de acesso compartilhado */}
      {activeBudget && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Visualizando: {activeBudget.budget?.name}
              </h3>
              <p className="text-sm text-blue-600">
                Orçamento compartilhado por {activeBudget.budget?.owner?.name} • Permissão: {activeBudget.permission === 'READ' ? 'Visualização' : 'Edição'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise detalhada das suas finanças</p>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('period')}
              className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'period'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Por Período
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Por Mês
            </button>
          </div>

          {/* Period/Month Selector */}
          {viewMode === 'period' ? (
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
            >
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="12months">Últimos 12 meses</option>
              <option value="year">Este ano</option>
            </select>
          ) : (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              max={new Date().toISOString().slice(0, 7)}
            />
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">PDF</span>
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex flex-wrap tablet:flex-nowrap lg:justify-between tablet:justify-between justify-center overflow-x-auto border-b p-2 scrollbar-hide gap-2">
          <button
            onClick={() => setActiveReport('overview')}
            className={`flex flex-col items-center justify-center px-3 py-3 font-medium rounded-lg transition-colors flex-shrink-0 min-w-[70px] tablet:flex-1 lg:flex-1 tablet:min-w-0 lg:min-w-0 ${
              activeReport === 'overview'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5 tablet:w-6 tablet:h-6 mb-1" />
            <span className="text-xs text-center leading-tight">Visão<br />Geral</span>
          </button>
          <button
            onClick={() => setActiveReport('trends')}
            className={`flex flex-col items-center justify-center px-3 py-3 font-medium rounded-lg transition-colors flex-shrink-0 min-w-[70px] tablet:flex-1 lg:flex-1 tablet:min-w-0 lg:min-w-0 ${
              activeReport === 'trends'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-5 h-5 tablet:w-6 tablet:h-6 mb-1" />
            <span className="text-xs text-center leading-tight">Tendências</span>
          </button>
          <button
            onClick={() => setActiveReport('categories')}
            className={`flex flex-col items-center justify-center px-3 py-3 font-medium rounded-lg transition-colors flex-shrink-0 min-w-[70px] tablet:flex-1 lg:flex-1 tablet:min-w-0 lg:min-w-0 ${
              activeReport === 'categories'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <PieChartIcon className="w-5 h-5 tablet:w-6 tablet:h-6 mb-1" />
            <span className="text-xs text-center leading-tight">Categorias</span>
          </button>
          {viewMode === 'monthly' && (
            <button
              onClick={() => setActiveReport('daily')}
              className={`flex flex-col items-center justify-center px-3 py-3 font-medium rounded-lg transition-colors flex-shrink-0 min-w-[70px] tablet:flex-1 lg:flex-1 tablet:min-w-0 lg:min-w-0 ${
                activeReport === 'daily'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-5 h-5 tablet:w-6 tablet:h-6 mb-1" />
              <span className="text-xs text-center leading-tight">Detalhes<br />Diários</span>
            </button>
          )}
          <button
            onClick={() => setActiveReport('budget')}
            className={`flex flex-col items-center justify-center px-3 py-3 font-medium rounded-lg transition-colors flex-shrink-0 min-w-[70px] tablet:flex-1 lg:flex-1 tablet:min-w-0 lg:min-w-0 ${
              activeReport === 'budget'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Target className="w-5 h-5 tablet:w-6 tablet:h-6 mb-1" />
            <span className="text-xs text-center leading-tight">Orçamento</span>
          </button>
          <button
            onClick={() => setActiveReport('comparison')}
            className={`flex flex-col items-center justify-center px-3 py-3 font-medium rounded-lg transition-colors flex-shrink-0 min-w-[70px] tablet:flex-1 lg:flex-1 tablet:min-w-0 lg:min-w-0 ${
              activeReport === 'comparison'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <GitCompare className="w-5 h-5 tablet:w-6 tablet:h-6 mb-1" />
            <span className="text-xs text-center leading-tight">Comparação</span>
          </button>
          <button
            onClick={() => setActiveReport('forecast')}
            className={`flex flex-col items-center justify-center px-3 py-3 font-medium rounded-lg transition-colors flex-shrink-0 min-w-[70px] tablet:flex-1 lg:flex-1 tablet:min-w-0 lg:min-w-0 ${
              activeReport === 'forecast'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Activity className="w-5 h-5 tablet:w-6 tablet:h-6 mb-1" />
            <span className="text-xs text-center leading-tight">Previsões</span>
          </button>
          <button
            onClick={() => setActiveReport('detailed')}
            className={`flex flex-col items-center justify-center px-3 py-3 font-medium rounded-lg transition-colors flex-shrink-0 min-w-[70px] tablet:flex-1 lg:flex-1 tablet:min-w-0 lg:min-w-0 ${
              activeReport === 'detailed'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5 tablet:w-6 tablet:h-6 mb-1" />
            <span className="text-xs text-center leading-tight">Detalhado</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Receitas
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {formatCurrency(data.summary.totalIncome)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Despesas
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(data.summary.totalExpenses)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo Líquido
                  </dt>
                  <dd className={`text-lg font-medium ${data.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.summary.netBalance)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Receita Média/Mês
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {formatCurrency(data.summary.averageMonthlyIncome)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Despesa Média/Mês
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(data.summary.averageMonthlyExpenses)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No Data Message */}
      {data.monthlyData.length === 0 && data.expensesByCategory.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
          <p className="text-gray-600 mb-6">
            Não há transações para o período selecionado. Adicione algumas transações para ver os relatórios.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = '/transactions'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Adicionar Transações
            </button>
            <button
              onClick={() => setSelectedPeriod('last6months')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Ver Últimos 6 Meses
            </button>
          </div>
        </div>
      )}

      {/* Report Content */}
      {data.monthlyData.length > 0 && activeReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {viewMode === 'monthly' ? (
            // Monthly view - different layout
            <>
              {/* Monthly Summary Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">
                  Resumo de {data.monthlyData[0]?.month || 'Mês Selecionado'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="p-4 bg-green-100 rounded-lg inline-block">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 mt-2">Receitas</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(data.monthlyData[0]?.income || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="p-4 bg-red-100 rounded-lg inline-block">
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 mt-2">Despesas</p>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(data.monthlyData[0]?.expenses || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="p-4 bg-blue-100 rounded-lg inline-block">
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 mt-2">Saldo</p>
                    <p className={`text-3xl font-bold ${(data.monthlyData[0]?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.monthlyData[0]?.balance || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Expenses by Category for Monthly */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
                <div className="w-full max-w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={280} maxHeight={350}>
                    <PieChart>
                      <Pie
                        data={data.expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.expensesByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Income by Category for Monthly */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Receitas por Categoria</h3>
                <div className="w-full max-w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={280} maxHeight={350}>
                    <PieChart>
                      <Pie
                        data={data.incomeByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.incomeByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            // Period view - original layout
            <>
              {/* Monthly Income vs Expenses */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Receitas vs Despesas por Mês</h3>
                <div className="w-full max-w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={280} maxHeight={350}>
                    <BarChart data={data.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="income" fill="#10B981" name="Receitas" />
                      <Bar dataKey="expenses" fill="#EF4444" name="Despesas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Balance Trend */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Evolução do Saldo</h3>
                <div className="w-full max-w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={280} maxHeight={350}>
                    <LineChart data={data.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        name="Saldo"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeReport === 'trends' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Tendência Mensal Completa</h3>
            <div className="w-full max-w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={280} maxHeight={400}>
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Receitas" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Despesas" />
                  <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={3} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses by Category */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
            <div className="w-full max-w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={280} maxHeight={350}>
                <PieChart>
                  <Pie
                    data={data.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.expensesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income by Category */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Receitas por Categoria</h3>
            <div className="w-full max-w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={280} maxHeight={350}>
                <PieChart>
                  <Pie
                    data={data.incomeByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.incomeByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'budget' && (
        <BudgetAnalysis 
          period={viewMode === 'monthly' ? selectedMonth : selectedPeriod} 
          budgetId={activeBudget?.budget?.id}
        />
      )}

      {activeReport === 'comparison' && (
        <PerformanceComparison 
          selectedPeriod={viewMode === 'monthly' ? selectedMonth : selectedPeriod} 
          budgetId={activeBudget?.budget?.id}
        />
      )}

      {activeReport === 'forecast' && (
        <FinancialForecast 
          period={viewMode === 'monthly' ? selectedMonth : selectedPeriod} 
          budgetId={activeBudget?.budget?.id}
        />
      )}

      {activeReport === 'daily' && viewMode === 'monthly' && (
        <MonthlyDetail 
          selectedMonth={selectedMonth} 
          budgetId={activeBudget?.budget?.id}
        />
      )}

      {activeReport === 'detailed' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Maiores Despesas por Categoria</h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Total
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Nº Transações
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Valor Médio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.topExpenses.map((expense, index) => (
                      <tr key={index}>
                        <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="truncate max-w-[120px] sm:max-w-none">
                            {expense.category}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-red-600 font-semibold">
                          <div className="whitespace-nowrap">
                            {formatCurrency(expense.amount)}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {expense.transactions} transações
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {expense.transactions}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {formatCurrency(expense.amount / expense.transactions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
