import { useState, useEffect } from 'react'
import { Target, AlertTriangle, CheckCircle, TrendingUp, DollarSign } from 'lucide-react'
import { budgetService } from '@/services/api'
import { BudgetStatus } from '../types'

interface Budget {
  id: string;
  category: {
    id: string;
    name: string;
    type: string;
    color: string;
  };
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: BudgetStatus;
  period: string;
}

interface BudgetAnalysisProps {
  period: string;
  budgetId?: string;
}

export default function BudgetAnalysis({ period, budgetId }: BudgetAnalysisProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    loadBudgetData();
  }, [period, budgetId]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const analysisData = await budgetService.getBudgetAnalysis(budgetId);
      setBudgets(analysisData);
      
      const totalBudgetAmount = analysisData.reduce((sum, budget) => sum + budget.budgetAmount, 0);
      const totalSpentAmount = analysisData.reduce((sum, budget) => sum + budget.spentAmount, 0);
      
      setTotalBudget(totalBudgetAmount);
      setTotalSpent(totalSpentAmount);
    } catch (error) {
      console.error('Error loading budget data:', error);
      setBudgets([]);
      setTotalBudget(0);
      setTotalSpent(0);
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

  const getStatusColor = (status: BudgetStatus) => {
    switch (status) {
      case 'GOOD':
        return 'text-green-600';
      case 'WARNING':
        return 'text-yellow-600';
      case 'EXCEEDED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'near':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'over':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 70) return 'bg-green-500';
    if (percentage <= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const remainingBudget = totalBudget - totalSpent;
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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
      {/* Budget Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden shadow rounded-lg bg-white p-5">
          <dl>
            <div className="flex items-center">
              <dt className="text-sm font-medium text-gray-500 truncate">Orçamento Total</dt>
            </div>
            <dd className="mt-1 flex items-baseline justify-between">
              <div className="flex items-baseline text-2xl font-semibold text-blue-600">
                {formatCurrency(totalBudget)}
              </div>
              <div className="inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 md:mt-2 lg:mt-0">
                <Target className="w-5 h-5 mr-1" />
              </div>
            </dd>
          </dl>
        </div>

        <div className="overflow-hidden shadow rounded-lg bg-white p-5">
          <dl>
            <div className="flex items-center">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Gasto</dt>
            </div>
            <dd className="mt-1 flex items-baseline justify-between">
              <div className="flex items-baseline text-2xl font-semibold text-red-600">
                {formatCurrency(totalSpent)}
              </div>
              <div className="inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800 md:mt-2 lg:mt-0">
                <DollarSign className="w-5 h-5 mr-1" />
              </div>
            </dd>
          </dl>
        </div>

        <div className="overflow-hidden shadow rounded-lg bg-white p-5">
          <dl>
            <div className="flex items-center">
              <dt className="text-sm font-medium text-gray-500 truncate">Restante</dt>
            </div>
            <dd className="mt-1 flex items-baseline justify-between">
              <div className={`flex items-baseline text-2xl font-semibold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(remainingBudget)}
              </div>
              <div className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium md:mt-2 lg:mt-0 ${
                remainingBudget >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <TrendingUp className="w-5 h-5 mr-1" />
              </div>
            </dd>
          </dl>
        </div>

        <div className="overflow-hidden shadow rounded-lg bg-white p-5">
          <dl>
            <div className="flex items-center">
              <dt className="text-sm font-medium text-gray-500 truncate">% Utilizado</dt>
            </div>
            <dd className="mt-1 flex items-baseline justify-between">
              <div className={`flex items-baseline text-2xl font-semibold ${getStatusColor(totalPercentage > 100 ? 'EXCEEDED' : totalPercentage > 90 ? 'WARNING' : 'GOOD')}`}>
                {totalBudget > 0 ? totalPercentage.toFixed(1) : '0.0'}%
              </div>
              <div className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium md:mt-2 lg:mt-0 ${
                totalPercentage > 100 ? 'bg-red-100 text-red-800' : 
                totalPercentage > 90 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
              }`}>
                <Target className="w-5 h-5 mr-1" />
              </div>
            </dd>
          </dl>
        </div>
      </div>

      {/* Budget Progress by Category */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-6">Progresso do Orçamento por Categoria</h3>
        <div className="space-y-6">
          {budgets.map((budget) => (
            <div key={budget.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(budget.status)}
                  <h4 className="font-medium text-gray-900">{budget.category.name}</h4>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {formatCurrency(budget.spentAmount)} de {formatCurrency(budget.budgetAmount)}
                  </p>
                  <p className={`text-sm font-medium ${getStatusColor(budget.status)}`}>
                    {budget.percentage}%
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(budget.percentage)}`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                ></div>
              </div>
              
              {budget.percentage > 100 && (
                <p className="text-sm text-red-600 mt-1">
                  Excedeu em {formatCurrency(budget.spentAmount - budget.budgetAmount)}
                </p>
              )}
              
              {budget.percentage > 90 && budget.percentage <= 100 && (
                <p className="text-sm text-yellow-600 mt-1">
                  Restam apenas {formatCurrency(budget.budgetAmount - budget.spentAmount)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recomendações</h3>
        <div className="space-y-3">
          {budgets
            .filter(budget => budget.status === 'EXCEEDED')
            .map(budget => (
              <div key={budget.id} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Categoria "{budget.category.name}" excedeu o orçamento
                  </p>
                  <p className="text-sm text-red-600">
                    Considere revisar os gastos desta categoria para o próximo período.
                  </p>
                </div>
              </div>
            ))}
          
          {budgets
            .filter(budget => budget.status === 'WARNING')
            .map(budget => (
              <div key={budget.id} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Categoria "{budget.category.name}" está próxima do limite
                  </p>
                  <p className="text-sm text-yellow-600">
                    Monitore os gastos desta categoria para não exceder o orçamento.
                  </p>
                </div>
              </div>
            ))}

          {budgets.filter(budget => budget.status === 'EXCEEDED' || budget.status === 'WARNING').length === 0 && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Parabéns! Todos os orçamentos estão sob controle
                </p>
                <p className="text-sm text-green-600">
                  Continue assim para manter suas finanças organizadas.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
