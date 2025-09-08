export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH';
  balance: number;
  description?: string;
  userId: string;
  inactive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon?: string;
  userId: string;
  inactive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  date: string;
  accountId: string;
  categoryId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  account: {
    name: string;
    type: string;
  };
  category: {
    name: string;
    type: string;
    color: string;
  };
}

export interface Budget {
  id: string;
  amount: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  isActive: boolean;
  categoryId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface BudgetAnalysis {
  id: string;
  category: Category;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: 'good' | 'warning' | 'exceeded';
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface BudgetShare {
  id: string;
  budgetId: string;
  sharedWithId: string;
  permission: SharePermission;
  status: ShareStatus;
  createdAt: string;
  updatedAt: string;
  budget?: {
    id: string;
    name: string;
    description?: string;
    owner?: {
      id: string;
      name: string;
      email: string;
    };
  };
  sharedWith?: {
    id: string;
    name: string;
    email: string;
  };
}

// Manter UserShare como alias para compatibilidade temporária
export type UserShare = BudgetShare;

export type SharePermission = 'READ' | 'WRITE';

export type ShareStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED';

export interface ShareInviteRequest {
  email: string;
  permission: SharePermission;
}

export interface ShareResponse {
  action: 'accept' | 'reject';
}
