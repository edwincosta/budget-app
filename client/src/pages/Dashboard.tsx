import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Users } from 'lucide-react'
import { dashboardService } from '@/services/api'
import { useSearchParams } from 'react-router-dom'

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accountsCount: number;
  recentTransactions: any[];
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const sharedUserId = searchParams.get('sharedUser');
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    accountsCount: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
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

  const formatDate = (date: string) => {
    const now = new Date();
    const transactionDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - transactionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    
    return transactionDate.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Banner de acesso compartilhado */}
      {sharedUserId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Visualizando dados compartilhados
              </h3>
              <p className="text-sm text-blue-600">
                Você está visualizando os dados financeiros de outro usuário
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          {sharedUserId ? 'Dados compartilhados' : 'Visão geral das suas finanças'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Total */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo Total
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(Number(stats.totalBalance))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Receitas */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Receitas (Mês)
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {formatCurrency(Number(stats.monthlyIncome))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Despesas (Mês)
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(Number(stats.monthlyExpenses))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Contas */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Contas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.accountsCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Transações Recentes
          </h3>
          <div className="mt-5">
            <div className="flow-root">
              {stats.recentTransactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma transação encontrada. Comece criando algumas transações!
                </p>
              ) : (
                <ul className="-my-2 divide-y divide-gray-200">
                  {stats.recentTransactions.map((transaction) => (
                    <li key={transaction.id} className="py-4">
                      <div className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <div className={`h-8 w-8 ${transaction.category.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                              {transaction.category.type === 'INCOME' ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {transaction.category.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              <span className="hidden sm:inline">{transaction.account.name} • </span>
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-sm font-medium ${transaction.category.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.category.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
