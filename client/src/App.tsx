import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { authService } from '@/services/api'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Categories from '@/pages/Categories'
import Accounts from '@/pages/Accounts'
import Transactions from '@/pages/Transactions'
import Reports from '@/pages/Reports'
import Budgets from '@/pages/Budgets'
import Sharing from '@/pages/Sharing'
import Layout from '@/components/Layout'
import { BudgetProvider } from '@/contexts/BudgetContext'

function App() {
  useEffect(() => {
    // Initialize authentication state from cookies
    authService.initializeAuth()
  }, [])

  const isAuthenticated = authService.isAuthenticated()

  return (
    <>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <BudgetProvider>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/sharing" element={<Sharing />} />
                  </Routes>
                </Layout>
              </BudgetProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </>
  )
}

export default App
