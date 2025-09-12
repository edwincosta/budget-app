import axios, { AxiosResponse } from 'axios';
import { AuthResponse, User, Budget, BudgetAnalysis, Category, Account, Transaction, UserShare, ShareInviteRequest, ShareResponse } from '@/types';
import { setCookie, getCookie, deleteCookie } from '@/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers
  });

  const token = getCookie('auth_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.log('🚨 API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    });

    if (error.response?.status === 401) {
      // Check if user has valid authentication token
      const hasToken = getCookie('auth_token') || localStorage.getItem('token');

      if (!hasToken) {
        console.log('🔄 No auth token found - redirecting to login');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // If user has token, check if this is an authentication vs permission error
      const errorMessage = error.response?.data?.message || '';

      // Enhanced permission error detection
      const isPermissionError =
        errorMessage.includes('permission') ||
        errorMessage.includes('Permission required') ||
        errorMessage.includes('Write permission required') ||
        errorMessage.includes('Budget ownership required') ||
        errorMessage.includes('Access denied') ||
        errorMessage.includes('access denied') ||
        errorMessage.includes('Forbidden') ||
        errorMessage.includes('forbidden') ||
        error.response?.status === 403 || // 403 is typically permission error
        // Check URL patterns that might indicate permission issues
        (error.config?.url?.includes('/budgets/') && (
          errorMessage.includes('budget') ||
          errorMessage.includes('READ') ||
          errorMessage.includes('WRITE')
        ));

      console.log('🔍 401 Error Analysis:', {
        errorMessage,
        isPermissionError,
        hasToken,
        willRedirect: !isPermissionError
      });

      if (isPermissionError) {
        console.log('�️ Permission error detected - not redirecting to login');
        // This is a permission error, not an authentication error
        // Let the component handle the error display
        return Promise.reject(error);
      } else {
        console.log('🔄 Authentication error detected - redirecting to login');
        // This is an authentication error - clear tokens and redirect
        deleteCookie('auth_token');
        deleteCookie('user_data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      // 403 errors should never redirect to login - they are permission errors
      console.log('🛡️ 403 Permission error - not redirecting to login');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export const authService = {
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', data);

    if (response.data.token) {
      // Save to cookies with 30 days expiration for persistent login
      setCookie('auth_token', response.data.token, 30);
      setCookie('user_data', JSON.stringify(response.data.user), 30);

      // Keep localStorage for backwards compatibility
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', data);

    if (response.data.token) {
      // Save to cookies with 30 days expiration for persistent login
      setCookie('auth_token', response.data.token, 30);
      setCookie('user_data', JSON.stringify(response.data.user), 30);

      // Keep localStorage for backwards compatibility
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  async getProfile(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await api.get('/users/profile');
    return response.data;
  },

  logout() {
    // Clear both cookies and localStorage to ensure complete logout
    deleteCookie('auth_token');
    deleteCookie('user_data');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser(): User | null {
    // Try to get from cookies first, then localStorage for backwards compatibility
    const userStr = getCookie('user_data') || localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken(): string | null {
    // Try to get from cookies first, then localStorage for backwards compatibility
    return getCookie('auth_token') || localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Initialize auth state from cookies if available
  initializeAuth(): void {
    const cookieToken = getCookie('auth_token');
    const cookieUser = getCookie('user_data');

    if (cookieToken && cookieUser) {
      // Sync to localStorage for backwards compatibility
      localStorage.setItem('token', cookieToken);
      localStorage.setItem('user', cookieUser);
    } else if (!cookieToken && !cookieUser) {
      // If no cookies, clear localStorage as well
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};

export const dashboardService = {
  async getStats(budgetId?: string): Promise<{
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    accountsCount: number;
    recentTransactions: any[];
  }> {
    const url = budgetId ? `/budgets/${budgetId}/dashboard/stats` : '/dashboard/stats';
    const response = await api.get(url);
    return response.data.data;
  },
};

export const reportsService = {
  async getReports(params: string | { mode: string; period?: string; month?: string }, budgetId?: string): Promise<{
    monthlyData: Array<{
      month: string;
      income: number;
      expenses: number;
      balance: number;
    }>;
    expensesByCategory: Array<{
      name: string;
      value: number;
      percentage: number;
    }>;
    incomeByCategory: Array<{
      name: string;
      value: number;
      percentage: number;
    }>;
    topExpenses: Array<{
      category: string;
      amount: number;
      transactions: number;
    }>;
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netBalance: number;
      averageMonthlyIncome: number;
      averageMonthlyExpenses: number;
    };
  }> {
    let baseUrl = budgetId ? `/budgets/${budgetId}/reports` : '/reports';
    let url = baseUrl;

    if (typeof params === 'string') {
      // Legacy support for period-only requests
      url += `?period=${params}`;
    } else {
      // New parameter format
      if (params.mode === 'monthly' && params.month) {
        url += `?mode=monthly&month=${params.month}`;
      } else if (params.mode === 'period' && params.period) {
        url += `?mode=period&period=${params.period}`;
      }
    }

    const response = await api.get(url);
    return response.data.data;
  },

  async exportReport(period: string, format: 'pdf' | 'excel', budgetId?: string): Promise<void> {
    const baseUrl = budgetId ? `/budgets/${budgetId}/reports` : '/reports';
    const response = await api.get(`${baseUrl}/export?period=${period}&format=${format}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-${period}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const budgetService = {
  async getBudgets(budgetId?: string): Promise<Budget[]> {
    const url = budgetId ? `/budgets/${budgetId}/items` : '/budgets/items';
    const response: AxiosResponse<Budget[]> = await api.get(url);
    return response.data;
  },

  async createBudget(budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>, budgetId?: string): Promise<Budget> {
    const url = budgetId ? `/budgets/${budgetId}/items` : '/budgets/items';
    const response: AxiosResponse<Budget> = await api.post(url, budget);
    return response.data;
  },

  async updateBudget(id: string, budget: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>>, budgetId?: string): Promise<Budget> {
    const url = budgetId ? `/budgets/${budgetId}/items/${id}` : `/budgets/items/${id}`;
    const response: AxiosResponse<Budget> = await api.put(url, budget);
    return response.data;
  },

  async deleteBudget(id: string, budgetId?: string): Promise<void> {
    const url = budgetId ? `/budgets/${budgetId}/items/${id}` : `/budgets/items/${id}`;
    await api.delete(url);
  },

  async getBudgetAnalysis(budgetId?: string): Promise<BudgetAnalysis[]> {
    const url = budgetId ? `/budgets/${budgetId}/analysis` : '/budgets/analysis';
    const response: AxiosResponse<BudgetAnalysis[]> = await api.get(url);
    return response.data;
  },
};

export const categoryService = {
  async getCategories(budgetId?: string): Promise<Category[]> {
    const url = budgetId ? `/budgets/${budgetId}/categories` : '/categories';
    const response: AxiosResponse<{ data: Category[] }> = await api.get(url);
    return response.data.data || [];
  },
};

export const accountService = {
  async getAccounts(budgetId?: string): Promise<Account[]> {
    const url = budgetId ? `/budgets/${budgetId}/accounts` : '/accounts';
    const response: AxiosResponse<{ data: Account[] }> = await api.get(url);
    return response.data.data || [];
  },

  async createAccount(account: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, budgetId?: string): Promise<Account> {
    const url = budgetId ? `/budgets/${budgetId}/accounts` : '/accounts';
    const response: AxiosResponse<{ data: Account }> = await api.post(url, account);
    return response.data.data;
  },

  async updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>, budgetId?: string): Promise<Account> {
    const url = budgetId ? `/budgets/${budgetId}/accounts/${id}` : `/accounts/${id}`;
    const response: AxiosResponse<{ data: Account }> = await api.put(url, account);
    return response.data.data;
  },

  async deleteAccount(id: string, budgetId?: string): Promise<void> {
    const url = budgetId ? `/budgets/${budgetId}/accounts/${id}` : `/accounts/${id}`;
    await api.delete(url);
  },
};

export const transactionService = {
  async getTransactions(budgetId?: string): Promise<Transaction[]> {
    const url = budgetId ? `/budgets/${budgetId}/transactions` : '/transactions';
    const response: AxiosResponse<{ data: Transaction[] }> = await api.get(url);
    return response.data.data || [];
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'account' | 'category'>, budgetId?: string): Promise<Transaction> {
    const url = budgetId ? `/budgets/${budgetId}/transactions` : '/transactions';
    const response: AxiosResponse<{ data: Transaction }> = await api.post(url, transaction);
    return response.data.data;
  },

  async updateTransaction(id: string, transaction: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'account' | 'category'>>, budgetId?: string): Promise<Transaction> {
    const url = budgetId ? `/budgets/${budgetId}/transactions/${id}` : `/transactions/${id}`;
    const response: AxiosResponse<{ data: Transaction }> = await api.put(url, transaction);
    return response.data.data;
  },

  async deleteTransaction(id: string, budgetId?: string): Promise<void> {
    const url = budgetId ? `/budgets/${budgetId}/transactions/${id}` : `/transactions/${id}`;
    await api.delete(url);
  },
};

export const sharingService = {
  async sendInvite(data: ShareInviteRequest): Promise<UserShare> {
    const response: AxiosResponse<{ data: UserShare }> = await api.post('/sharing/invite', data);
    return response.data.data;
  },

  async getInvitations(): Promise<UserShare[]> {
    const response: AxiosResponse<{ data: UserShare[] }> = await api.get('/sharing/invitations');
    return response.data.data;
  },

  async getSentInvitations(): Promise<UserShare[]> {
    const response: AxiosResponse<{ data: UserShare[] }> = await api.get('/sharing/sent');
    return response.data.data;
  },

  async respondToInvite(shareId: string, action: ShareResponse): Promise<UserShare> {
    const response: AxiosResponse<{ data: UserShare }> = await api.put(`/sharing/respond/${shareId}`, action);
    return response.data.data;
  },

  async getActiveShares(): Promise<{ sharedByMe: UserShare[]; sharedWithMe: UserShare[] }> {
    const response: AxiosResponse<{ data: { sharedByMe: UserShare[]; sharedWithMe: UserShare[] } }> = await api.get('/sharing/active');
    return response.data.data;
  },

  async revokeShare(shareId: string): Promise<void> {
    await api.delete(`/sharing/${shareId}`);
  },
};

// Import Service - Sistema de Importação de Extratos
export const importService = {
  /**
   * Faz upload de arquivo para importação
   */
  async uploadFile(
    file: File,
    accountId: string,
    budgetId?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<import('@/types').UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', accountId);

    if (dateRange) {
      formData.append('startDate', dateRange.startDate);
      formData.append('endDate', dateRange.endDate);
    }

    const url = budgetId ? `/budgets/${budgetId}/import/upload` : '/import/upload';

    const response: AxiosResponse<import('@/types').UploadResponse> = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },

  /**
   * Lista sessões de importação
   */
  async getSessions(budgetId?: string): Promise<import('@/types').ImportSession[]> {
    const url = budgetId ? `/budgets/${budgetId}/import/sessions` : '/import/sessions';
    const response: AxiosResponse<import('@/types').ImportSession[]> = await api.get(url);
    return response.data;
  },

  /**
   * Obtém detalhes de uma sessão de importação
   */
  async getSessionDetails(sessionId: string, budgetId?: string): Promise<import('@/types').ImportSessionDetails> {
    const url = budgetId ? `/budgets/${budgetId}/import/sessions/${sessionId}` : `/import/sessions/${sessionId}`;
    const response: AxiosResponse<import('@/types').ImportSessionDetails> = await api.get(url);
    return response.data;
  },

  /**
   * Classifica uma transação individual
   */
  async classifyTransaction(transactionId: string, categoryId: string, budgetId?: string): Promise<import('@/types').TempTransaction> {
    const url = budgetId
      ? `/budgets/${budgetId}/import/transactions/${transactionId}/classify`
      : `/import/transactions/${transactionId}/classify`;

    const response: AxiosResponse<import('@/types').TempTransaction> = await api.put(url, { categoryId });
    return response.data;
  },

  /**
   * Confirma importação das transações classificadas
   */
  async confirmImport(sessionId: string, importDuplicates = false, budgetId?: string): Promise<import('@/types').ConfirmImportResponse> {
    const url = budgetId
      ? `/budgets/${budgetId}/import/sessions/${sessionId}/confirm`
      : `/import/sessions/${sessionId}/confirm`;

    const response: AxiosResponse<import('@/types').ConfirmImportResponse> = await api.post(url, { importDuplicates });
    return response.data;
  },

  /**
   * Cancela uma sessão de importação
   */
  async cancelSession(sessionId: string, budgetId?: string): Promise<void> {
    const url = budgetId
      ? `/budgets/${budgetId}/import/sessions/${sessionId}`
      : `/import/sessions/${sessionId}`;

    await api.delete(url);
  },
};

export default api;
