import axios, { AxiosResponse } from 'axios';
import { AuthResponse, User, Budget, BudgetAnalysis, Category, UserShare, ShareInviteRequest, ShareResponse } from '@/types';
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
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.log('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Clear both cookies and localStorage for backwards compatibility
      deleteCookie('auth_token');
      deleteCookie('user_data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
  async getStats(): Promise<{
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    accountsCount: number;
    recentTransactions: any[];
  }> {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  },
};

export const reportsService = {
  async getReports(params: string | { mode: string; period?: string; month?: string }): Promise<{
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
    let url = '/reports';
    
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

  async exportReport(period: string, format: 'pdf' | 'excel'): Promise<void> {
    const response = await api.get(`/reports/export?period=${period}&format=${format}`, {
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
  async getBudgets(): Promise<Budget[]> {
    const response: AxiosResponse<Budget[]> = await api.get('/budgets/items');
    return response.data;
  },

  async createBudget(budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>): Promise<Budget> {
    const response: AxiosResponse<Budget> = await api.post('/budgets/items', budget);
    return response.data;
  },

  async updateBudget(id: string, budget: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>>): Promise<Budget> {
    const response: AxiosResponse<Budget> = await api.put(`/budgets/items/${id}`, budget);
    return response.data;
  },

  async deleteBudget(id: string): Promise<void> {
    await api.delete(`/budgets/items/${id}`);
  },

  async getBudgetAnalysis(): Promise<BudgetAnalysis[]> {
    const response: AxiosResponse<BudgetAnalysis[]> = await api.get('/budgets/analysis');
    return response.data;
  },
};

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<{ data: Category[] }> = await api.get('/categories');
    return response.data.data || [];
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

export default api;
