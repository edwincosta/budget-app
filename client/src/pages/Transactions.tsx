import { useState, useEffect } from 'react'
import { Plus, ArrowUpRight, ArrowDownLeft, Search, Filter, Pencil, Trash2, Users } from 'lucide-react'
import { transactionService, accountService, categoryService } from '@/services/api'
import { useBudget } from '@/contexts/BudgetContext'

interface Transaction {
  id: string
  amount: number
  description: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  date: string
  category?: {
    id: string
    name: string
    color: string
  }
  account?: {
    id: string
    name: string
  }
}

interface Account {
  id: string
  name: string
  type: string
}

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  color: string
}

const Transactions = () => {
  const { activeBudget, isOwner } = useBudget();
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    categoryId: ''
  })

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      const budgetId = activeBudget?.budget?.id;
      const transactionsData = await transactionService.getTransactions(budgetId)
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAccounts = async () => {
    try {
      const budgetId = activeBudget?.budget?.id;
      const accountsData = await accountService.getAccounts(budgetId)
      setAccounts(accountsData || [])
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const budgetId = activeBudget?.budget?.id;
      const categoriesData = await categoryService.getCategories(budgetId)
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  useEffect(() => {
    loadTransactions()
    loadAccounts()
    loadCategories()
  }, [activeBudget])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      alert('Descrição é obrigatória')
      return
    }

    if (!formData.accountId) {
      alert('Conta é obrigatória')
      return
    }

    if (!formData.categoryId) {
      alert('Categoria é obrigatória')
      return
    }

    try {
      const budgetId = activeBudget?.budget?.id;
      const transactionData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      }

      if (editingTransaction) {
        await transactionService.updateTransaction(editingTransaction.id, transactionData, budgetId)
        console.log('Transação atualizada com sucesso!')
      } else {
        await transactionService.createTransaction(transactionData, budgetId)
        console.log('Transação criada com sucesso!')
      }
      
      setIsModalOpen(false)
      setEditingTransaction(null)
      setFormData({
        description: '',
        amount: 0,
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        accountId: '',
        categoryId: ''
      })
      loadTransactions()
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert(editingTransaction ? 'Erro ao atualizar transação' : 'Erro ao criar transação')
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      date: new Date(transaction.date).toISOString().split('T')[0],
      accountId: transaction.account?.id || '',
      categoryId: transaction.category?.id || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return
    }

    try {
      const budgetId = activeBudget?.budget?.id;
      await transactionService.deleteTransaction(id, budgetId)
      console.log('Transação excluída com sucesso!')
      loadTransactions()
    } catch (error: any) {
      console.error('Error deleting transaction:', error)
      alert(`Erro ao excluir transação: ${error.response?.data?.message || error.message}`)
    }
  }

  const openCreateModal = () => {
    setEditingTransaction(null)
    setFormData({
      description: '',
      amount: 0,
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      accountId: '',
      categoryId: ''
    })
    setIsModalOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.account?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'ALL' || transaction.type === filterType
    
    return matchesSearch && matchesFilter
  })

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = totalIncome - totalExpense

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
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
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transações</h1>
        {(isOwner || activeBudget?.permission === 'WRITE') && (
          <button 
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </button>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpRight className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Receitas
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {formatCurrency(totalIncome)}
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
                <ArrowDownLeft className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Despesas
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(totalExpense)}
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
                <div className="h-6 w-6 bg-blue-600 rounded"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo
                  </dt>
                  <dd className={`text-lg font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')}
              className="px-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              <option value="ALL">Todos</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-lg shadow">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {transactions.length === 0 ? 'Nenhuma transação encontrada' : 'Nenhuma transação corresponde aos filtros'}
            </h3>
            <p className="text-gray-600 mb-4">
              {transactions.length === 0 ? 'Comece criando sua primeira transação.' : 'Tente ajustar os filtros de busca.'}
            </p>
            {transactions.length === 0 && (
              <button 
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Transação
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                {/* Mobile Card Layout */}
                <div className="md:hidden">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        transaction.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'INCOME' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 text-base mb-1">{transaction.description}</h4>
                        <div className={`text-lg font-semibold mb-2 ${
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}
                        </div>
                      </div>
                    </div>
                    
                    {(isOwner || activeBudget?.permission === 'WRITE') && (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Transaction details in cards */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {transaction.category && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-1">Categoria</div>
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: transaction.category.color }}
                          ></div>
                          <span className="text-gray-900 font-medium truncate">{transaction.category.name}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-1">Data</div>
                      <div className="text-gray-900 font-medium">{formatDate(transaction.date)}</div>
                    </div>
                    
                    {transaction.account && (
                      <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                        <div className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-1">Conta</div>
                        <div className="text-gray-900 font-medium truncate">{transaction.account.name}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop Row Layout */}
                <div className="hidden md:flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      transaction.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'INCOME' ? (
                        <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate text-sm md:text-base">{transaction.description}</h4>
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-2 text-sm text-gray-600 mt-1">
                        {transaction.category && (
                          <div className="flex items-center mb-1 md:mb-0">
                            <div
                              className="w-3 h-3 rounded-full mr-1 flex-shrink-0"
                              style={{ backgroundColor: transaction.category.color }}
                            ></div>
                            <span className="truncate">{transaction.category.name}</span>
                          </div>
                        )}
                        {transaction.account && (
                          <>
                            <span className="hidden md:inline">•</span>
                            <span className="truncate">{transaction.account.name}</span>
                          </>
                        )}
                        <span className="hidden md:inline">•</span>
                        <span className="text-xs md:text-sm">{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                    <div className={`text-sm md:text-base lg:text-lg font-semibold text-right ${
                      transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className="whitespace-nowrap">
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}
                      </div>
                    </div>
                    
                    {(isOwner || activeBudget?.permission === 'WRITE') && (
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-1 md:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-1 md:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Compra no supermercado"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                    className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EXPENSE">Despesa</option>
                    <option value="INCOME">Receita</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conta
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories
                      .filter(category => category.type === formData.type)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3 pt-4 md:pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 md:py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 md:order-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors order-1 md:order-2"
                >
                  {editingTransaction ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions
