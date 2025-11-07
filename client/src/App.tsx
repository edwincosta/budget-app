import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { authService } from "@/services/api";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Categories from "@/pages/Categories";
import Accounts from "@/pages/Accounts";
import Transactions from "@/pages/Transactions";
import Reports from "@/pages/Reports";
import Budgets from "@/pages/Budgets";
import Sharing from "@/pages/Sharing";
import ImportPage from "@/pages/ImportPage";
import TestPage from "@/pages/TestPage";
import Layout from "@/components/Layout";
import ServerHealthGuard from "@/components/ServerHealthGuard";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { UIProvider } from "@/contexts/UIContext";

function App() {
  useEffect(() => {
    // Initialize authentication state from cookies
    authService.initializeAuth();
  }, []);

  const isAuthenticated = authService.isAuthenticated();

  return (
    <ServerHealthGuard>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <UIProvider>
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
                      <Route path="/import" element={<ImportPage />} />
                      <Route path="/test" element={<TestPage />} />
                    </Routes>
                  </Layout>
                </BudgetProvider>
              </UIProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </ServerHealthGuard>
  );
}

export default App;
