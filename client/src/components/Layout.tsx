import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut, Home, CreditCard, Tag, TrendingUp, BarChart3, Target, Menu, X, Users } from 'lucide-react'
import { toast } from 'sonner'
import { authService } from '@/services/api'
import BudgetSelector from './BudgetSelector'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const user = authService.getCurrentUser()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = () => {
    toast.success('Logout realizado com sucesso!')
    authService.logout()
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Mobile menu button - hidden on tablets */}
              <button
                onClick={toggleSidebar}
                className="tablet:hidden lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 ml-2 lg:ml-0">Budget App</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <BudgetSelector />
              <span className="text-sm text-gray-700 hidden sm:block">Olá, {user?.name}</span>
              <span className="text-sm text-gray-700 sm:hidden">Olá</span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-md"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative flex-1 min-h-0">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <nav className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-sm transform transition-transform duration-300 ease-in-out flex-shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:block lg:h-full
          tablet:hidden
        `}>
          <div className="p-4 h-full overflow-y-auto flex flex-col">
            {/* Close button for mobile */}
            <div className="flex justify-end lg:hidden mb-4">
              <button
                onClick={closeSidebar}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/accounts"
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/accounts') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Contas</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/categories') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Tag className="w-5 h-5" />
                  <span>Categorias</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/transactions"
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/transactions') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Transações</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/reports"
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/reports') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Relatórios</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/budgets"
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/budgets') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Target className="w-5 h-5" />
                  <span>Orçamentos</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/sharing"
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/sharing') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Compartilhamento</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 tablet:pb-20 lg:pb-6 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>

        {/* Bottom Navigation for Tablets */}
        <nav className="hidden tablet:flex fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
          <div className="flex justify-around items-center w-full max-w-6xl mx-auto">
            <Link
              to="/"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 ${
                isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">Dashboard</span>
            </Link>
            <Link
              to="/accounts"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 ${
                isActive('/accounts') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">Contas</span>
            </Link>
            <Link
              to="/categories"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 ${
                isActive('/categories') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Tag className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">Categorias</span>
            </Link>
            <Link
              to="/transactions"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 ${
                isActive('/transactions') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">Transações</span>
            </Link>
            <Link
              to="/reports"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 ${
                isActive('/reports') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">Relatórios</span>
            </Link>
            <Link
              to="/budgets"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 ${
                isActive('/budgets') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Target className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">Orçamentos</span>
            </Link>
            <Link
              to="/sharing"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 ${
                isActive('/sharing') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">Compartilhar</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
