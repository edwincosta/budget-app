# Budget App - AI Agent Instructions

> **Purpose**: This file provides AI agents (GitHub Copilot, Claude, etc.) with comprehensive context about the Budget App project, its architecture, development standards, and workflows.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Development Environment](#development-environment)
- [Core Principles](#core-principles)
- [Common Tasks](#common-tasks)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)

---

## 🎯 Project Overview

**Budget App** is a full-stack personal finance management system with multi-budget support, budget sharing capabilities, and bank statement import functionality.

### Key Features

- Multi-user authentication with JWT
- Multiple budgets per user with sharing (READ/WRITE permissions)
- Bank accounts, categories, transactions management
- Budget planning vs actual tracking
- Bank statement import (CSV, PDF, Excel) from Brazilian banks
- Financial reports and analytics
- Health check system for Render free tier optimization

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL 15
- **Deployment**: Render (Docker) + Supabase (PostgreSQL)
- **Dev Environment**: Docker Compose

---

## 🏗️ Architecture

### Budget-Centric Design

**CRITICAL PRINCIPLE**: Everything belongs to a budget. There are no orphan entities.

```
User
  ├── Budget (owned)
  │   ├── Accounts
  │   ├── Categories
  │   ├── Transactions
  │   └── BudgetItems
  └── BudgetShare (shared with user)
      └── Budget (read-only or read-write access)
```

### Data Isolation Rules

1. **Always filter by budget**: Every query must include `budgetId` in WHERE clause
2. **Validate ownership**: Use middleware to verify user has access to budget
3. **Respect permissions**: Check READ vs WRITE before allowing modifications
4. **No cross-budget leaks**: Data from different budgets must never mix

### Dual API Pattern

Support both personal and shared budgets:

```typescript
// Personal budget (uses defaultBudgetId)
GET /api/accounts
POST /api/transactions

// Specific budget (for shared budgets)
GET /api/budgets/:budgetId/accounts
POST /api/budgets/:budgetId/transactions
```

---

## 🐳 Development Environment

### Docker-First Development

**MANDATORY**: All development and testing must use Docker containers.

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Rebuild after changes
docker-compose up -d --build

# Access database
docker-compose exec db psql -U postgres budget
```

### Complete Setup Guide

For detailed setup instructions (development and production), see **`SETUP.md`**:

- Database setup (Supabase)
- Backend deploy (Render Docker)
- Frontend deploy (Render Static Site)
- Environment variables configuration
- Production URLs and monitoring

### Services

- **Client**: http://localhost:5173 (React + Vite)
- **Server**: http://localhost:3001 (Express API)
- **Database**: localhost:5432 (PostgreSQL)

### Test Users

Always use these standard test users:

- joao@example.com / 123456
- maria@example.com / 123456
- pedro@example.com / 123456

---

## 🚨 Core Principles

### 1. Mobile-First Responsive Design

**ALWAYS implement responsive layouts using mobile-first approach.**

```typescript
// Standard container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Responsive flex
<div className="flex flex-col md:flex-row gap-4">

// Table → Cards transformation
<div className="hidden md:block">
  <Table />
</div>
<div className="md:hidden space-y-4">
  {items.map(item => <MobileCard key={item.id} {...item} />)}
</div>
```

**Breakpoints**:

- Mobile: < 768px (sm:)
- Tablet: 768px - 1024px (md:)
- Desktop: > 1024px (lg:, xl:)

### 2. Budget Sharing Support

**ALL features must support shared budgets with proper permission checks.**

```typescript
// Component pattern
interface Props {
  budgetId?: string; // Optional - uses default if not provided
}

// Permission check
const { activeBudget, isOwner } = useBudget();
const canWrite = isOwner || activeBudget?.permission === "WRITE";

// Shared budget banner
{
  activeBudget && !isOwner && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center">
        <Users className="h-5 w-5 text-blue-600 mr-3" />
        <div>
          <h3>Viewing: {activeBudget.budget?.name}</h3>
          <p>
            By {activeBudget.budget?.owner?.name} • {activeBudget.permission}
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 3. Security & Validation

**Apply validation at ALL layers: Frontend → Middleware → Controller → Database**

```typescript
// Frontend validation (React Hook Form)
const schema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive()
});

// Backend middleware
router.use(auth); // Authentication
router.use('/:budgetId/*', budgetAuth); // Budget access validation
router.post('/*', requireWritePermission); // Write operations

// Controller validation (Joi)
const schema = Joi.object({
  name: Joi.string().required().max(100),
  amount: Joi.number().positive().required()
});

// Database constraint (Prisma)
model Transaction {
  amount Decimal @db.Decimal(12, 2)
  budgetId String
  budget Budget @relation(fields: [budgetId], references: [id])
}
```

### 4. TypeScript Strict Mode

**NO `any` types. Always use proper typing.**

```typescript
// ❌ NEVER
const data: any = await fetch();

// ✅ ALWAYS
interface TransactionResponse {
  id: string;
  amount: number;
  date: Date;
  category: {
    id: string;
    name: string;
  };
}
const data: TransactionResponse = await fetch();
```

---

## 🔧 Common Tasks

### Adding a New Feature

1. **Check existing patterns** in similar features
2. **Update Prisma schema** if database changes needed
3. **Create/update API routes** with dual pattern (personal + shared)
4. **Implement frontend components** with responsive design
5. **Add permission checks** for shared budget support
6. **Update types** in both client and server
7. **Test with Docker** environment
8. **Update documentation** (see Documentation Update section)

### Creating a New API Route

```typescript
import { Router, Response } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import { budgetAuth, BudgetAuthRequest } from "../middleware/budgetAuth";
import { requireWritePermission } from "../middleware/requireWritePermission";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const router = Router();
const prisma = new PrismaClient();

// Validation schema
const createSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
});

// Personal budget route
router.post(
  "/",
  auth,
  requireWritePermission,
  async (req: AuthRequest, res: Response) => {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { defaultBudgetId: true },
      });

      if (!user?.defaultBudgetId) {
        return res.status(404).json({ message: "No default budget found" });
      }

      const item = await prisma.item.create({
        data: {
          ...value,
          budgetId: user.defaultBudgetId,
        },
      });

      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Shared budget route
router.post(
  "/:budgetId",
  auth,
  budgetAuth,
  requireWritePermission,
  async (req: BudgetAuthRequest, res: Response) => {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const item = await prisma.item.create({
        data: {
          ...value,
          budgetId: req.budget!.id,
        },
      });

      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
```

### Creating a New React Component

```typescript
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBudget } from "../contexts/BudgetContext";
import { api } from "../services/api";
import { Item } from "../types";

interface ItemListProps {
  budgetId?: string; // Optional - uses default if not provided
}

export const ItemList: React.FC<ItemListProps> = ({ budgetId }) => {
  const { activeBudget, isOwner } = useBudget();
  const queryClient = useQueryClient();
  const canWrite = isOwner || activeBudget?.permission === "WRITE";

  // Use budgetId if provided, otherwise activeBudget
  const effectiveBudgetId = budgetId || activeBudget?.budgetId;

  const {
    data: items,
    isLoading,
    error,
  } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const url = effectiveBudgetId
        ? `/api/budgets/${effectiveBudgetId}/items/${id}`
        : `/api/items/${id}`;
      await api.delete(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", effectiveBudgetId] });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">Error loading items</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Responsive layout */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Items</h2>
          {canWrite && (
            <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md">
              Add Item
            </button>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table content */}
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {items?.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-gray-600">{item.description}</p>
              {canWrite && (
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="mt-2 text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 🧪 Testing Guidelines

### Bank Statement Import Testing

**MANDATORY**: Use the existing automated test script.

```bash
# Run from project root
./test-import-extratos.sh
```

**DO NOT** create new test scripts. The existing script:

- Tests 19 files from 8 different Brazilian banks
- Uses zero external dependencies
- Auto-configures development data
- Provides detailed statistics

### Manual API Testing

Use test users and Docker environment:

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"123456"}'

# Use returned token
curl http://localhost:3001/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Testing

Test responsive design at all breakpoints:

1. Mobile (< 768px) - Chrome DevTools mobile view
2. Tablet (768-1024px) - iPad view
3. Desktop (> 1024px) - Full screen

---

## 📝 Documentation Update Protocol

**MANDATORY after ANY change:**

### 1. Update Relevant AGENTS.md

- Root `AGENTS.md` - Architecture or cross-cutting changes
- `client/AGENTS.md` - Frontend changes
- `server/AGENTS.md` - Backend changes

### 2. Update .github/copilot/copilot-context.md

- Add new features to appropriate sections
- Update examples if new patterns introduced
- Document breaking changes
- Add timestamp to changelog

### 3. Update Package Versions (if applicable)

Client and server versions MUST match:

```bash
# Check current versions
grep '"version"' client/package.json server/package.json

# Update both to same version
# Use semantic versioning: MAJOR.MINOR.PATCH
```

### 4. Commit Message Format

```
type(scope): Brief description

- Detailed change 1
- Detailed change 2

Updated: AGENTS.md, copilot-context.md
```

Types: feat, fix, docs, style, refactor, test, chore

---

## 🚫 Common Mistakes to Avoid

### ❌ NEVER DO

1. **Bypass budget isolation**

   ```typescript
   // ❌ BAD - No budget filter
   await prisma.transaction.findMany();

   // ✅ GOOD - Always filter by budget
   await prisma.transaction.findMany({
     where: { budgetId: user.defaultBudgetId },
   });
   ```

2. **Ignore permissions**

   ```typescript
   // ❌ BAD - No permission check
   await api.delete(`/api/items/${id}`);

   // ✅ GOOD - Check write permission
   if (canWrite) {
     await api.delete(`/api/items/${id}`);
   }
   ```

3. **Use fixed widths**

   ```typescript
   // ❌ BAD - Causes horizontal scroll on mobile
   <div className="w-[1200px]">

   // ✅ GOOD - Responsive width
   <div className="w-full max-w-7xl mx-auto">
   ```

4. **Skip TypeScript types**

   ```typescript
   // ❌ BAD
   const data: any = await fetch();

   // ✅ GOOD
   const data: Transaction[] = await fetch();
   ```

5. **Forget to update documentation**

   - Always update AGENTS.md and copilot-context.md after changes

6. **Create summary or explanation files**
   - ❌ DON'T create files like `CHANGES.md`, `IMPLEMENTATION_SUMMARY.md`, `FEATURE_DOCUMENTATION.md`
   - ✅ DO update the existing documentation where the feature is defined
   - ✅ DO add inline code comments for complex logic
   - ✅ DO update AGENTS.md, copilot-context.md, and relevant sections

---

## 📝 Documentation Guidelines

### CRITICAL: No Summary Files

**NEVER create separate documentation files to explain changes or implementations.**

❌ **DON'T CREATE**:

- `IMPLEMENTATION_SUMMARY.md`
- `CHANGES.md`
- `FEATURE_XYZ_DOCUMENTATION.md`
- `STATUS_*.md`
- `HOW_TO_*.md` (unless explicitly requested)

✅ **DO UPDATE**:

- Relevant `AGENTS.md` file (root, client, or server)
- `.github/copilot/copilot-context.md` (source of truth)
- Code comments for complex logic
- Existing README.md sections if applicable

### Documentation Update Protocol

**MANDATORY after ANY change:**

1. **Update Relevant AGENTS.md**

   - Root `AGENTS.md` - Architecture or cross-cutting changes
   - `client/AGENTS.md` - Frontend changes
   - `server/AGENTS.md` - Backend changes

2. **Update .github/copilot/copilot-context.md**

   - Add new features to appropriate sections
   - Update examples if new patterns introduced
   - Document breaking changes
   - Add timestamp to changelog

3. **Update Package Versions (if applicable)**

   - Client and server versions MUST match
   - Use semantic versioning: MAJOR.MINOR.PATCH

4. **Commit Message Format**

   ```
   type(scope): Brief description

   - Detailed change 1
   - Detailed change 2

   Updated: AGENTS.md, copilot-context.md
   ```

   Types: feat, fix, docs, style, refactor, test, chore

### When to Create New Files

**ONLY create new files when:**

- Adding a new feature/component that needs its own module
- Creating test files for new functionality
- Adding migration files for database changes
- Implementing a new utility/service class

**NEVER create files just to:**

- Explain what you did
- Summarize changes
- Document implementation details (use inline comments instead)
- Describe how something works (update existing docs instead)

---

## 📚 Additional Resources

- **Detailed Context**: `.github/copilot/copilot-context.md` (2900+ lines)
- **Development Rules**: `.github/copilot/instructions/development-rules.md`
- **Development Checklist**: `.github/copilot/instructions/development-checklist.md`
- **Code Examples**: `.github/copilot/copilot-examples.md`
- **Client Instructions**: `client/AGENTS.md` (frontend-specific)
- **Server Instructions**: `server/AGENTS.md` (backend-specific)

---

**Last Updated**: November 12, 2025
**Version**: 2.0.0
