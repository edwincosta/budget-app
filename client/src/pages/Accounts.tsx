import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import api from '@/services/api'

interface Account {
  id: string
  name: string
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT'
  balance: number
  inactive: boolean
  createdAt: string
}

const ACCOUNT_TYPES = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Poupança',
  CREDIT_CARD: 'Cartão de Crédito',
  INVESTMENT: 'Investimento'
}

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING' as keyof typeof ACCOUNT_TYPES,
    balance: 0,
    inactive: false
  })

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/accounts')
      setAccounts(response.data.data || [])
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Nome da conta é obrigatório')
      return
    }

    try {
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, formData)
        console.log('Conta atualizada com sucesso!')
      } else {
        await api.post('/accounts', formData)
        console.log('Conta criada com sucesso!')
      }
      
      setIsModalOpen(false)
      setEditingAccount(null)
      setFormData({ name: '', type: 'CHECKING', balance: 0, inactive: false })
      loadAccounts()
    } catch (error) {
      console.error('Error saving account:', error)
      alert(editingAccount ? 'Erro ao atualizar conta' : 'Erro ao criar conta')
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      inactive: account.inactive || false
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    console.log(`Attempting to delete account with ID: ${id}`);
    
    if (!confirm('Tem certeza que deseja excluir esta conta?')) {
      console.log('Delete cancelled by user');
      return
    }

    try {
      console.log(`Making DELETE request to /accounts/${id}`);
      console.log('Current token:', localStorage.getItem('token') ? 'Token exists' : 'No token found');
      console.log('API base URL configured');
      
      const response = await api.delete(`/accounts/${id}`)
      console.log('Delete response:', response.data);
      alert('Conta excluída com sucesso!')
      await loadAccounts()
    } catch (error: any) {
      console.error('Error deleting account:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error response:', error.response?.data);
      console.error('Full error object:', error);
      
      let errorMessage = 'Erro desconhecido ao excluir conta';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Erro ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Erro de conexão: Não foi possível conectar ao servidor';
      } else {
        // Something else happened
        errorMessage = error.message || 'Erro ao processar a requisição';
      }
      
      alert(`Erro ao excluir conta: ${errorMessage}`)
    }
  }

  const openCreateModal = () => {
    setEditingAccount(null)
    setFormData({ name: '', type: 'CHECKING', balance: 0, inactive: false })
    setIsModalOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return <CreditCard className="w-5 h-5 text-purple-600" />
      case 'SAVINGS':
        return <div className="w-5 h-5 bg-green-600 rounded-full" />
      case 'INVESTMENT':
        return <div className="w-5 h-5 bg-blue-600 rounded-full" />
      default:
        return <div className="w-5 h-5 bg-gray-600 rounded-full" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contas</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center min-w-0 flex-1">
                {getAccountTypeIcon(account.type)}
                <h3 className="ml-3 text-lg font-semibold text-gray-900 truncate">
                  {account.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(account)}
                  className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Tipo: {ACCOUNT_TYPES[account.type]}
                </p>
                {account.inactive && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inativa
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(account.balance)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta encontrada</h3>
          <p className="text-gray-600 mb-4">Comece criando sua primeira conta.</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Conta
          </button>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Conta
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Conta Corrente Banco do Brasil"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo da Conta
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as keyof typeof ACCOUNT_TYPES })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(ACCOUNT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.inactive}
                    onChange={(e) => setFormData({ ...formData, inactive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Conta inativa</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Contas inativas não aparecerão como opções para novas transações
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors order-1 sm:order-2"
                >
                  {editingAccount ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts
