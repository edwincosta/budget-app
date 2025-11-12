# Client - Frontend AI Agent Instructions

> **Scope**: React + TypeScript + Vite + Tailwind CSS frontend application

## 📋 Quick Reference

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7.1.9
- **Styling**: Tailwind CSS 3.4.18
- **State Management**: React Context API + React Query
- **Forms**: React Hook Form 7.65.0
- **Charts**: Recharts 3.2.1
- **Icons**: Lucide React

---

## 🏗️ Project Structure

```
client/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component with routing
│   ├── index.css             # Global styles + Tailwind
│   ├── components/           # Reusable components
│   │   ├── Layout.tsx        # Main layout with responsive nav
│   │   ├── BudgetSelector.tsx # Budget switching component
│   │   ├── ShareManager.tsx  # Budget sharing UI
│   │   ├── Loading.tsx       # Loading states
│   │   └── ErrorMessage.tsx  # Error display
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.tsx   # User authentication state
│   │   └── BudgetContext.tsx # Active budget state
│   ├── hooks/                # Custom React hooks
│   │   └── useAuth.ts        # Authentication hook
│   ├── pages/                # Page components (routes)
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Reports.tsx
│   │   └── ...
│   ├── services/             # API communication
│   │   └── api.ts            # Axios instance with interceptors
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # Shared types/interfaces
│   └── utils/                # Utility functions
│       ├── cookies.ts        # Cookie management
│       └── formatters.ts     # Date/currency formatting
├── public/                   # Static assets
├── Dockerfile               # Production Docker image
├── vite.config.ts           # Vite configuration
└── tailwind.config.js       # Tailwind configuration
```

---

## 🎨 Styling Standards

### Tailwind CSS Best Practices

**ALWAYS use Tailwind utility classes. NO inline styles or CSS modules.**

#### Standard Container Pattern

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{/* Content */}</div>
```

#### Responsive Design Utilities

```tsx
// Mobile-first approach
<div className="
  w-full                    // Mobile: full width
  md:w-1/2                 // Tablet: half width
  lg:w-1/3                 // Desktop: third width
">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive flex direction
<div className="flex flex-col md:flex-row gap-4">

// Conditional display
<div className="block md:hidden">Mobile only</div>
<div className="hidden md:block">Desktop only</div>
```

#### Common Patterns

**Cards**:

```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  {/* Card content */}
</div>
```

**Buttons**:

```tsx
// Primary button
<button className="
  w-full sm:w-auto          // Full width on mobile, auto on desktop
  px-4 py-2
  bg-blue-600 hover:bg-blue-700
  text-white
  rounded-md
  transition-colors
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Click Me
</button>

// Secondary button
<button className="
  px-4 py-2
  bg-gray-100 hover:bg-gray-200
  text-gray-700
  rounded-md
  transition-colors
">
  Cancel
</button>
```

**Forms**:

```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Field Name
    </label>
    <input
      type="text"
      className="
        w-full 
        px-3 py-2 
        border border-gray-300 
        rounded-md 
        focus:outline-none focus:ring-2 focus:ring-blue-500
      "
    />
  </div>
</div>
```

**Loading States**:

```tsx
{
  isLoading && (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

---

## 🔧 Component Patterns

### Standard Component Template

```tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBudget } from "../contexts/BudgetContext";
import { api } from "../services/api";
import { Item } from "../types";
import { Loader, AlertCircle } from "lucide-react";

interface ComponentNameProps {
  budgetId?: string;
  className?: string;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  budgetId,
  className = "",
}) => {
  const { activeBudget, isOwner } = useBudget();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const effectiveBudgetId = budgetId || activeBudget?.budgetId;
  const canWrite = isOwner || activeBudget?.permission === "WRITE";

  // Query with proper caching
  const { data, isLoading, error } = useQuery({
    queryKey: ["items", effectiveBudgetId],
    queryFn: async () => {
      const url = effectiveBudgetId
        ? `/api/budgets/${effectiveBudgetId}/items`
        : "/api/items";
      const response = await api.get<Item[]>(url);
      return response.data;
    },
    enabled: !!effectiveBudgetId,
  });

  // Mutation with optimistic updates
  const createMutation = useMutation({
    mutationFn: async (newItem: Partial<Item>) => {
      const url = effectiveBudgetId
        ? `/api/budgets/${effectiveBudgetId}/items`
        : "/api/items";
      const response = await api.post(url, newItem);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", effectiveBudgetId] });
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-800">Error loading items</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Shared budget banner */}
      {activeBudget && !isOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold">
                Viewing: {activeBudget.budget?.name}
              </h3>
              <p className="text-sm text-gray-600">
                By {activeBudget.budget?.owner?.name} •{" "}
                {activeBudget.permission}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Component content */}
      <div className="space-y-6">{/* Content here */}</div>
    </div>
  );
};
```

### Form Component with React Hook Form

```tsx
import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";

// Validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  amount: z.number().positive("Amount must be positive"),
  date: z.date(),
  categoryId: z.string().min(1, "Category is required"),
});

type FormData = z.infer<typeof formSchema>;

interface FormComponentProps {
  onSuccess?: () => void;
  budgetId?: string;
}

export const FormComponent: React.FC<FormComponentProps> = ({
  onSuccess,
  budgetId,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = budgetId ? `/api/budgets/${budgetId}/items` : "/api/items";
      await api.post(url, data);
    },
    onSuccess: () => {
      reset();
      onSuccess?.();
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          {...register("name")}
          type="text"
          className={`
            w-full px-3 py-2 border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.name ? "border-red-500" : "border-gray-300"}
          `}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          {...register("amount", { valueAsNumber: true })}
          type="number"
          step="0.01"
          className={`
            w-full px-3 py-2 border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.amount ? "border-red-500" : "border-gray-300"}
          `}
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || mutation.isPending}
        className="
          w-full sm:w-auto px-4 py-2 
          bg-blue-600 hover:bg-blue-700 
          text-white rounded-md
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>

      {mutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">Error submitting form</p>
        </div>
      )}
    </form>
  );
};
```

---

## 📱 Responsive Patterns

### Table to Cards Transformation

**MANDATORY**: Tables must transform to cards on mobile.

```tsx
export const ResponsiveTable: React.FC = () => {
  const { data } = useQuery(/* ... */);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-blue-600 hover:text-blue-800">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {data?.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <span className="text-green-600 font-semibold">
                {formatCurrency(item.amount)}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              {formatDate(item.date)}
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md">
              Edit
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
```

### Navigation Patterns

**Layout.tsx** implements three navigation modes:

1. **Mobile (< 768px)**: Hamburger menu with drawer
2. **Tablet (768-1024px)**: Bottom navigation bar
3. **Desktop (> 1024px)**: Fixed sidebar

Always use `<Layout>` wrapper for all pages.

---

## 🔐 Authentication & Context

### Using AuthContext

```tsx
import { useAuth } from "../hooks/useAuth";

export const Component: React.FC = () => {
  const { user, token, login, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### Using BudgetContext

```tsx
import { useBudget } from "../contexts/BudgetContext";

export const Component: React.FC = () => {
  const {
    activeBudget, // Current selected budget (own or shared)
    isOwner, // Is user the budget owner?
    selectBudget, // Function to switch budgets
    ownedBudgets, // Budgets owned by user
    sharedBudgets, // Budgets shared with user
  } = useBudget();

  const canWrite = isOwner || activeBudget?.permission === "WRITE";

  return (
    <div>
      {!isOwner && <p>Viewing shared budget: {activeBudget?.budget?.name}</p>}

      {canWrite ? <button>Edit</button> : <p>Read-only access</p>}
    </div>
  );
};
```

---

## 🌐 API Communication

### Using the API Service

**ALWAYS use the configured `api` instance from `services/api.ts`.**

```tsx
import { api } from "../services/api";
import { Transaction } from "../types";

// GET request
const { data } = await api.get<Transaction[]>("/api/transactions");

// POST request
const newTransaction = await api.post<Transaction>("/api/transactions", {
  amount: 100,
  description: "Test",
  categoryId: "cat-123",
});

// PUT request
const updated = await api.put<Transaction>(`/api/transactions/${id}`, {
  amount: 150,
});

// DELETE request
await api.delete(`/api/transactions/${id}`);

// With budgetId parameter
const { data } = await api.get<Transaction[]>(
  `/api/budgets/${budgetId}/transactions`
);
```

The API instance automatically:

- Adds JWT token to requests
- Handles 401 (redirects to login)
- Manages base URL configuration

---

## 📊 Data Fetching with React Query

### Query Patterns

```tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

// Basic query
const { data, isLoading, error } = useQuery({
  queryKey: ["transactions"],
  queryFn: async () => {
    const response = await api.get("/api/transactions");
    return response.data;
  },
});

// Query with parameters
const { data } = useQuery({
  queryKey: ["transactions", budgetId, filters],
  queryFn: async () => {
    const response = await api.get("/api/transactions", {
      params: { budgetId, ...filters },
    });
    return response.data;
  },
  enabled: !!budgetId, // Only run if budgetId exists
});

// Query with dependent queries
const { data: budgets } = useQuery({
  queryKey: ["budgets"],
  queryFn: () => api.get("/api/budgets").then((r) => r.data),
});

const { data: transactions } = useQuery({
  queryKey: ["transactions", budgets?.[0]?.id],
  queryFn: () =>
    api.get(`/api/budgets/${budgets[0].id}/transactions`).then((r) => r.data),
  enabled: !!budgets?.[0]?.id,
});
```

### Mutation Patterns

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Basic mutation
const mutation = useMutation({
  mutationFn: async (newData: TransactionInput) => {
    const response = await api.post("/api/transactions", newData);
    return response.data;
  },
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  },
  onError: (error) => {
    console.error("Error creating transaction:", error);
  },
});

// Optimistic updates
const updateMutation = useMutation({
  mutationFn: async (updated: Transaction) => {
    const response = await api.put(`/api/transactions/${updated.id}`, updated);
    return response.data;
  },
  onMutate: async (newTransaction) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["transactions"] });

    // Snapshot previous value
    const previousTransactions = queryClient.getQueryData(["transactions"]);

    // Optimistically update
    queryClient.setQueryData(["transactions"], (old: Transaction[]) =>
      old.map((t) => (t.id === newTransaction.id ? newTransaction : t))
    );

    return { previousTransactions };
  },
  onError: (err, newTransaction, context) => {
    // Rollback on error
    queryClient.setQueryData(["transactions"], context?.previousTransactions);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  },
});

// Usage
mutation.mutate({ amount: 100, description: "Test" });
```

---

## 🎯 Type Safety

### Type Definitions

**ALWAYS define proper types in `types/index.ts`**:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  defaultBudgetId: string | null;
}

export interface Budget {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetShare {
  id: string;
  budgetId: string;
  userId: string;
  permission: "READ" | "WRITE";
  budget?: Budget;
  user?: User;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  accountId: string;
  budgetId: string;
  category?: Category;
  account?: Account;
}

// Props interfaces
export interface TransactionFormProps {
  budgetId?: string;
  onSuccess?: () => void;
  initialData?: Partial<Transaction>;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Type Guards

```typescript
export const isTransaction = (obj: any): obj is Transaction => {
  return (
    typeof obj === "object" && "id" in obj && "amount" in obj && "type" in obj
  );
};

export const hasWritePermission = (budget: BudgetShare | null): boolean => {
  return budget?.permission === "WRITE";
};
```

---

## 🛠️ Utilities

### Formatting Functions

```typescript
// utils/formatters.ts

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateFormat("pt-BR").format(new Date(date));
};

export const formatDateTime = (date: Date | string): string => {
  return new Intl.DateFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
};

export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};
```

### Cookie Management

```typescript
// utils/cookies.ts

export const setCookie = (
  name: string,
  value: string,
  days: number = 7
): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

export const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

export const deleteCookie = (name: string): void => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
};
```

---

## ⚠️ Common Mistakes

### ❌ DON'T

```tsx
// Don't use inline styles
<div style={{ width: '100px' }}>

// Don't use any types
const data: any = await fetchData();

// Don't forget budgetId support
const Component = () => {
  const { data } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.get('/api/items')
  });
};

// Don't use fixed widths
<div className="w-[1200px]">

// Don't skip permission checks
<button onClick={deleteItem}>Delete</button>

// Don't forget error handling
const { data } = useQuery(/* ... */);
return <div>{data.map(/* ... */)}</div>;
```

### ✅ DO

```tsx
// Use Tailwind classes
<div className="w-24">

// Use proper types
const data: Transaction[] = await fetchData();

// Support budgetId
interface ComponentProps {
  budgetId?: string;
}

// Use responsive widths
<div className="w-full max-w-7xl mx-auto">

// Check permissions
{canWrite && <button onClick={deleteItem}>Delete</button>}

// Handle loading and errors
if (isLoading) return <Loading />;
if (error) return <Error />;
return <div>{data?.map(/* ... */)}</div>;
```

---

## 📚 Key Files to Reference

- **Layout Component**: `src/components/Layout.tsx` - Responsive navigation
- **Budget Context**: `src/contexts/BudgetContext.tsx` - Budget state management
- **API Service**: `src/services/api.ts` - HTTP client configuration
- **Type Definitions**: `src/types/index.ts` - TypeScript interfaces
- **Main Context**: `../.github/copilot/copilot-context.md` - Full system documentation

---

**Last Updated**: November 12, 2025
**Version**: 2.0.0
