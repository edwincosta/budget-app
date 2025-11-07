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

export type BudgetStatus = 'GOOD' | 'WARNING' | 'EXCEEDED';

export interface BudgetAnalysis {
  id: string;
  category: Category;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: BudgetStatus;
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

export type SharePermission = 'READ' | 'WRITE' | 'OWNER';

export type ShareStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED';

export interface ShareInviteRequest {
  email: string;
  permission: SharePermission;
}

export type ShareAction = 'ACCEPT' | 'REJECT';

export interface ShareResponse {
  action: ShareAction;
}

// Tipos para Sistema de Importação
export interface ImportSession {
  id: string;
  filename: string;
  fileType: ImportFileType;
  status: ImportStatus;
  totalTransactions: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    name: string;
    type: string;
  };
}

export interface TempTransaction {
  id: string;
  sessionId: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId?: string;
  originalData?: any;
  isClassified: boolean;
  isDuplicate: boolean;
  duplicateReason?: string;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    type: string;
    color: string;
  };
}

export interface ImportSessionDetails {
  session: ImportSession;
  transactions: TempTransaction[];
  availableCategories: Category[];
  summary: {
    total: number;
    classified: number;
    duplicates: number;
    pending: number;
  };
}

export interface ParseResult {
  transactions: any[];
  errors: string[];
  totalProcessed: number;
}

export interface UploadResponse {
  sessionId: string;
  totalTransactions: number;
  duplicatesFound: number;
  errors: string[];
}

export interface ClassifyRequest {
  categoryId: string;
}

export interface ConfirmImportRequest {
  importDuplicates?: boolean;
}

export interface ConfirmImportResponse {
  message: string;
  importedCount: number;
  transactionIds: string[];
}

export type ImportStatus =
  | 'PENDING'       // Aguardando classificação
  | 'PROCESSING'    // Sendo processado
  | 'CLASSIFIED'    // Classificado pelo usuário
  | 'COMPLETED'     // Importação finalizada
  | 'ERROR'         // Erro no processamento
  | 'CANCELLED';    // Cancelado pelo usuário

export type ImportFileType = 'CSV' | 'PDF' | 'EXCEL';
