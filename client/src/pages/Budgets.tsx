import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, Target, DollarSign, Calendar } from 'lucide-react'
import { budgetService, categoryService } from '@/services/api'
import { Budget, Category } from '@/types'

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newBudget, setNewBudget] = useState({
    categoryId: '',
    amount: '',
    period: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  })

  // Carregar orçamentos e categorias
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [budgetsData, categoriesData] = await Promise.all([
        budgetService.getBudgets(),
        categoryService.getCategories()
      ])
      
      setBudgets(budgetsData)
      setCategories(categoriesData.filter((cat: Category) => cat.type === 'EXPENSE'))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBudget = async () => {
    if (!newBudget.categoryId || !newBudget.amount) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      await budgetService.createBudget({
        categoryId: newBudget.categoryId,
        amount: parseFloat(newBudget.amount),
        period: newBudget.period,
        isActive: true
      })
      
      setNewBudget({ categoryId: '', amount: '', period: 'MONTHLY' })
      setIsCreating(false)
      loadData()
    } catch (error) {
      console.error('Erro ao criar orçamento:', error)
      alert('Erro ao criar orçamento')
    }
  }

  const handleEditBudget = async (budgetId: string, updates: Partial<Budget>) => {
    try {
      await budgetService.updateBudget(budgetId, updates)
      setEditingBudget(null)
      loadData()
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error)
      alert('Erro ao atualizar orçamento')
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) {
      return
    }

    try {
      await budgetService.deleteBudget(budgetId)
      loadData()
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error)
      alert('Erro ao excluir orçamento')
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatPeriod = (period: string) => {
    const periods = {
      MONTHLY: 'Mensal',
      QUARTERLY: 'Trimestral',
      YEARLY: 'Anual'
    }
    return periods[period as keyof typeof periods] || period
  }

  const availableCategories = categories.filter(cat => 
    !budgets.some(budget => budget.categoryId === cat.id && budget.isActive)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-600">Defina e gerencie seus orçamentos por categoria</p>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          disabled={availableCategories.length === 0}
          className="bg-blue-600 text-white px-4 py-2 md:py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Orçamentos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {budgets.length}
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
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Orçamento Total Mensal
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatAmount(budgets.filter(b => b.period === 'MONTHLY' && b.isActive).reduce((sum, b) => sum + b.amount, 0))}
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
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Orçamentos Ativos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {budgets.filter(b => b.isActive).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Budget Form */}
      {isCreating && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Novo Orçamento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={newBudget.categoryId}
                onChange={(e) => setNewBudget({ ...newBudget, categoryId: e.target.value })}
                className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma categoria</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newBudget.amount}
                onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                placeholder="0,00"
                className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={newBudget.period}
                onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value as any })}
                className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MONTHLY">Mensal</option>
                <option value="QUARTERLY">Trimestral</option>
                <option value="YEARLY">Anual</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-4 mt-6">
            <button
              onClick={() => {
                setIsCreating(false)
                setNewBudget({ categoryId: '', amount: '', period: 'MONTHLY' })
              }}
              className="px-4 py-2 md:py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 order-2 md:order-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateBudget}
              className="px-4 py-2 md:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 order-1 md:order-2"
            >
              Criar Orçamento
            </button>
          </div>
        </div>
      )}

      {/* Budgets Table/Cards */}
      <div className="bg-white shadow-sm rounded-lg border">
        {budgets.length === 0 ? (
          <div className="p-6 md:p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento encontrado</h3>
            <p className="text-gray-600 mb-6">Comece criando seu primeiro orçamento por categoria.</p>
            <button
              onClick={() => setIsCreating(true)}
              disabled={availableCategories.length === 0}
              className="bg-blue-600 text-white px-4 py-2 md:py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Primeiro Orçamento
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgets.map((budget) => (
                    <BudgetRow
                      key={budget.id}
                      budget={budget}
                      isEditing={editingBudget === budget.id}
                      onEdit={() => setEditingBudget(budget.id)}
                      onCancel={() => setEditingBudget(null)}
                      onSave={(updates) => handleEditBudget(budget.id, updates)}
                      onDelete={() => handleDeleteBudget(budget.id)}
                      formatAmount={formatAmount}
                      formatPeriod={formatPeriod}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  isEditing={editingBudget === budget.id}
                  onEdit={() => setEditingBudget(budget.id)}
                  onCancel={() => setEditingBudget(null)}
                  onSave={(updates) => handleEditBudget(budget.id, updates)}
                  onDelete={() => handleDeleteBudget(budget.id)}
                  formatAmount={formatAmount}
                  formatPeriod={formatPeriod}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface BudgetRowProps {
  budget: Budget
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (updates: Partial<Budget>) => void
  onDelete: () => void
  formatAmount: (amount: number) => string
  formatPeriod: (period: string) => string
}

function BudgetRow({ 
  budget, 
  isEditing, 
  onEdit, 
  onCancel, 
  onSave, 
  onDelete, 
  formatAmount, 
  formatPeriod 
}: BudgetRowProps) {
  const [editData, setEditData] = useState({
    amount: budget.amount.toString(),
    period: budget.period,
    isActive: budget.isActive
  })

  const handleSave = () => {
    if (!editData.amount) {
      alert('Valor é obrigatório')
      return
    }

    onSave({
      amount: parseFloat(editData.amount),
      period: editData.period,
      isActive: editData.isActive
    })
  }

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: budget.category.color }}
            />
            <span className="text-sm font-medium text-gray-900 truncate">
              {budget.category.name}
            </span>
          </div>
        </td>
        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
          <input
            type="number"
            step="0.01"
            min="0"
            value={editData.amount}
            onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
            className="w-full px-2 py-1 md:py-2 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
          <select
            value={editData.period}
            onChange={(e) => setEditData({ ...editData, period: e.target.value as any })}
            className="w-full px-2 py-1 md:py-2 border border-gray-300 rounded text-sm"
          >
            <option value="MONTHLY">Mensal</option>
            <option value="QUARTERLY">Trimestral</option>
            <option value="YEARLY">Anual</option>
          </select>
        </td>
        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editData.isActive}
              onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-900">Ativo</span>
          </label>
        </td>
        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
          <button
            onClick={handleSave}
            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
            title="Salvar"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
            style={{ backgroundColor: budget.category.color }}
          />
          <span className="text-sm font-medium text-gray-900 truncate">
            {budget.category.name}
          </span>
        </div>
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span className="font-medium">{formatAmount(budget.amount)}</span>
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatPeriod(budget.period)}
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          budget.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {budget.isActive ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
}

interface BudgetCardProps {
  budget: Budget
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (updates: Partial<Budget>) => void
  onDelete: () => void
  formatAmount: (amount: number) => string
  formatPeriod: (period: string) => string
}

function BudgetCard({ 
  budget, 
  isEditing, 
  onEdit, 
  onCancel, 
  onSave, 
  onDelete, 
  formatAmount, 
  formatPeriod 
}: BudgetCardProps) {
  const [editData, setEditData] = useState({
    amount: budget.amount.toString(),
    period: budget.period,
    isActive: budget.isActive
  })

  const handleSave = () => {
    if (!editData.amount) {
      alert('Valor é obrigatório')
      return
    }

    onSave({
      amount: parseFloat(editData.amount),
      period: editData.period,
      isActive: editData.isActive
    })
  }

  if (isEditing) {
    return (
      <div className="p-4 bg-blue-50 space-y-4">
        {/* Category */}
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
            style={{ backgroundColor: budget.category.color }}
          />
          <span className="text-base font-medium text-gray-900">
            {budget.category.name}
          </span>
        </div>

        {/* Edit Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={editData.period}
              onChange={(e) => setEditData({ ...editData, period: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MONTHLY">Mensal</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="YEARLY">Anual</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editData.isActive}
                onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Orçamento ativo</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="space-y-3">
        {/* Header: Category and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div
              className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
              style={{ backgroundColor: budget.category.color }}
            />
            <span className="text-base font-medium text-gray-900 truncate">
              {budget.category.name}
            </span>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wider font-medium">Valor</div>
            <div className="text-gray-900 font-semibold mt-1">{formatAmount(budget.amount)}</div>
          </div>
          
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wider font-medium">Período</div>
            <div className="text-gray-900 font-medium mt-1">{formatPeriod(budget.period)}</div>
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-start">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            budget.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {budget.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>
    </div>
  )
}
