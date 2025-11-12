# Server - Backend AI Agent Instructions

> **Scope**: Node.js + Express + TypeScript + Prisma ORM backend API

## 📋 Quick Reference

- **Runtime**: Node.js 18+
- **Framework**: Express 4.x
- **Language**: TypeScript 5.9.3
- **ORM**: Prisma 6.17.1
- **Database**: PostgreSQL 15
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi 18.0.1
- **Security**: Helmet 8.1.0, express-rate-limit 8.1.0

---

## 🏗️ Project Structure

```
server/
├── src/
│   ├── index.ts              # Server entry point
│   ├── controllers/          # Route handlers (business logic)
│   │   ├── AuthController.ts
│   │   ├── BudgetController.ts
│   │   ├── TransactionController.ts
│   │   ├── AccountController.ts
│   │   └── ...
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── budgetAuth.ts    # Budget access validation
│   │   ├── requireWritePermission.ts
│   │   └── errorHandler.ts
│   ├── routes/               # Route definitions
│   │   ├── auth.ts
│   │   ├── budgets.ts
│   │   ├── transactions.ts
│   │   ├── accounts.ts
│   │   ├── sharing.ts
│   │   ├── imports.ts
│   │   └── reports.ts
│   ├── utils/                # Utility functions
│   │   ├── parsers/         # Bank statement parsers
│   │   │   ├── nubank.ts
│   │   │   ├── bradesco.ts
│   │   │   ├── btg.ts
│   │   │   └── ...
│   │   ├── duplicateDetector.ts
│   │   └── validators.ts
│   └── tests/                # Test files
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── Dockerfile               # Production Docker image
├── package.json
└── tsconfig.json
```

---

## 🗄️ Prisma ORM Patterns

### Schema Best Practices

**Always maintain referential integrity and proper indexes.**

```prisma
model Transaction {
  id          String   @id @default(cuid())
  date        DateTime
  description String
  amount      Decimal  @db.Decimal(12, 2)
  type        TransactionType

  // Foreign keys with relations
  budgetId    String
  budget      Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)

  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])

  accountId   String
  account     Account  @relation(fields: [accountId], references: [id])

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Indexes for performance
  @@index([budgetId, date])
  @@index([categoryId])
  @@index([accountId])
}

enum TransactionType {
  INCOME
  EXPENSE
}
```

### Query Patterns

**ALWAYS filter by budgetId to maintain data isolation.**

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ❌ WRONG - No budget filter
const transactions = await prisma.transaction.findMany();

// ✅ CORRECT - Always filter by budget
const transactions = await prisma.transaction.findMany({
  where: { budgetId: user.defaultBudgetId },
});

// Include relations
const transactionsWithDetails = await prisma.transaction.findMany({
  where: { budgetId },
  include: {
    category: {
      select: { id: true, name: true, type: true },
    },
    account: {
      select: { id: true, name: true, type: true },
    },
  },
  orderBy: { date: "desc" },
});

// Aggregations
const summary = await prisma.transaction.groupBy({
  by: ["type", "categoryId"],
  where: {
    budgetId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  },
  _sum: {
    amount: true,
  },
});

// Transactions for complex operations
await prisma.$transaction(async (tx) => {
  // Create transaction
  const transaction = await tx.transaction.create({
    data: {
      /* ... */
    },
  });

  // Update account balance
  await tx.account.update({
    where: { id: accountId },
    data: {
      balance: {
        increment:
          transaction.type === "INCOME"
            ? transaction.amount
            : -transaction.amount,
      },
    },
  });
});
```

### Migration Commands

```bash
# Create migration
npx prisma migrate dev --name description_of_change

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Reset database (dev only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

---

## 🛣️ API Route Patterns

### Standard Route Template

**ALWAYS implement dual routes for personal and shared budgets.**

```typescript
import { Router, Response } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import { budgetAuth, BudgetAuthRequest } from "../middleware/budgetAuth";
import { requireWritePermission } from "../middleware/requireWritePermission";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const router = Router();
const prisma = new PrismaClient();

// ===== VALIDATION SCHEMAS =====
const createSchema = Joi.object({
  name: Joi.string().required().max(100),
  description: Joi.string().optional().allow("").max(500),
  amount: Joi.number().positive().required(),
});

const updateSchema = Joi.object({
  name: Joi.string().optional().max(100),
  description: Joi.string().optional().allow("").max(500),
  amount: Joi.number().positive().optional(),
});

// ===== PERSONAL BUDGET ROUTES (uses defaultBudgetId) =====

// @route   GET /api/items
// @desc    Get all items from user's default budget
// @access  Private
router.get(
  "/",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { defaultBudgetId: true },
      });

      if (!user?.defaultBudgetId) {
        res.status(404).json({ message: "No default budget found" });
        return;
      }

      const items = await prisma.item.findMany({
        where: { budgetId: user.defaultBudgetId },
        orderBy: { createdAt: "desc" },
      });

      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// @route   POST /api/items
// @desc    Create item in user's default budget
// @access  Private (WRITE permission required)
router.post(
  "/",
  auth,
  requireWritePermission,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Validate input
      const { error, value } = createSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
      }

      // Get user's default budget
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { defaultBudgetId: true },
      });

      if (!user?.defaultBudgetId) {
        res.status(404).json({ message: "No default budget found" });
        return;
      }

      // Create item
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

// ===== SHARED BUDGET ROUTES (uses :budgetId param) =====

// @route   GET /api/budgets/:budgetId/items
// @desc    Get all items from specific budget
// @access  Private (budget access required)
router.get(
  "/:budgetId",
  auth,
  budgetAuth,
  async (req: BudgetAuthRequest, res: Response): Promise<void> => {
    try {
      const items = await prisma.item.findMany({
        where: { budgetId: req.budget!.id },
        orderBy: { createdAt: "desc" },
      });

      res.json(items);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// @route   POST /api/budgets/:budgetId/items
// @desc    Create item in specific budget
// @access  Private (WRITE permission required)
router.post(
  "/:budgetId",
  auth,
  budgetAuth,
  requireWritePermission,
  async (req: BudgetAuthRequest, res: Response): Promise<void> => {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
      }

      const item = await prisma.item.create({
        data: {
          ...value,
          budgetId: req.budget!.id,
        },
      });

      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating budget item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// @route   PUT /api/items/:id or /api/budgets/:budgetId/items/:id
// @desc    Update item
// @access  Private (WRITE permission required)
router.put(
  "/:id",
  auth,
  requireWritePermission,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error, value } = updateSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
      }

      // Verify item belongs to user's budget
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { defaultBudgetId: true },
      });

      if (!user?.defaultBudgetId) {
        res.status(404).json({ message: "No default budget found" });
        return;
      }

      const item = await prisma.item.findFirst({
        where: {
          id: req.params.id,
          budgetId: user.defaultBudgetId,
        },
      });

      if (!item) {
        res.status(404).json({ message: "Item not found" });
        return;
      }

      const updated = await prisma.item.update({
        where: { id: req.params.id },
        data: value,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (WRITE permission required)
router.delete(
  "/:id",
  auth,
  requireWritePermission,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { defaultBudgetId: true },
      });

      if (!user?.defaultBudgetId) {
        res.status(404).json({ message: "No default budget found" });
        return;
      }

      const item = await prisma.item.findFirst({
        where: {
          id: req.params.id,
          budgetId: user.defaultBudgetId,
        },
      });

      if (!item) {
        res.status(404).json({ message: "Item not found" });
        return;
      }

      await prisma.item.delete({
        where: { id: req.params.id },
      });

      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
```

---

## 🔒 Middleware Patterns

### Authentication Middleware

**File**: `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const auth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "No authentication token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid authentication token" });
  }
};
```

### Budget Authorization Middleware

**File**: `src/middleware/budgetAuth.ts`

```typescript
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface BudgetAuthRequest extends AuthRequest {
  budget?: {
    id: string;
    ownerId: string;
    permission: "READ" | "WRITE" | "OWNER";
  };
}

export const budgetAuth = async (
  req: BudgetAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const budgetId = req.params.budgetId;
    const userId = req.user!.id;

    if (!budgetId) {
      res.status(400).json({ message: "Budget ID is required" });
      return;
    }

    // Check if user owns the budget
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      res.status(404).json({ message: "Budget not found" });
      return;
    }

    if (budget.ownerId === userId) {
      req.budget = {
        id: budget.id,
        ownerId: budget.ownerId,
        permission: "OWNER",
      };
      next();
      return;
    }

    // Check if budget is shared with user
    const share = await prisma.budgetShare.findFirst({
      where: {
        budgetId,
        userId,
      },
    });

    if (!share) {
      res.status(403).json({ message: "Access denied to this budget" });
      return;
    }

    req.budget = {
      id: budget.id,
      ownerId: budget.ownerId,
      permission: share.permission,
    };

    next();
  } catch (error) {
    console.error("Budget authorization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
```

### Write Permission Middleware

**File**: `src/middleware/requireWritePermission.ts`

```typescript
import { Response, NextFunction } from "express";
import { BudgetAuthRequest } from "./budgetAuth";
import { AuthRequest } from "./auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const requireWritePermission = async (
  req: BudgetAuthRequest | AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // If budget is already loaded (from budgetAuth middleware)
    if ("budget" in req && req.budget) {
      if (req.budget.permission === "READ") {
        res.status(403).json({ message: "Write permission required" });
        return;
      }
      next();
      return;
    }

    // Otherwise, check user's default budget
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        defaultBudgetId: true,
      },
    });

    if (!user?.defaultBudgetId) {
      res.status(404).json({ message: "No default budget found" });
      return;
    }

    const budget = await prisma.budget.findUnique({
      where: { id: user.defaultBudgetId },
    });

    if (budget?.ownerId === user.id) {
      // User owns the budget - has full access
      next();
      return;
    }

    // Check if shared with write permission
    const share = await prisma.budgetShare.findFirst({
      where: {
        budgetId: user.defaultBudgetId,
        userId: user.id,
      },
    });

    if (!share || share.permission === "READ") {
      res.status(403).json({ message: "Write permission required" });
      return;
    }

    next();
  } catch (error) {
    console.error("Write permission check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
```

---

## 🔐 Security Best Practices

### Input Validation with Joi

```typescript
import Joi from "joi";

// Strict validation schemas
const transactionSchema = Joi.object({
  date: Joi.date().required().max("now"),
  description: Joi.string().required().min(1).max(200),
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid("INCOME", "EXPENSE").required(),
  categoryId: Joi.string().uuid().required(),
  accountId: Joi.string().uuid().required(),
});

// Validate before processing
const { error, value } = transactionSchema.validate(req.body, {
  abortEarly: false, // Return all errors
  stripUnknown: true, // Remove unknown fields
});

if (error) {
  const errors = error.details.map((d) => d.message);
  res.status(400).json({ message: "Validation error", errors });
  return;
}
```

### Password Hashing

```typescript
import bcrypt from "bcrypt";

// Hash password on registration
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password on login
const isValidPassword = await bcrypt.compare(password, user.password);
if (!isValidPassword) {
  res.status(401).json({ message: "Invalid credentials" });
  return;
}
```

### JWT Token Generation

```typescript
import jwt from "jsonwebtoken";

// Generate token
const token = jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: "7d" }
);

// Return to client
res.json({
  token,
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
  },
});
```

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

// Auth routes rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts, please try again later",
});

router.post("/login", authLimiter, AuthController.login);

// API routes rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Too many requests, please slow down",
});

app.use("/api/", apiLimiter);
```

---

## 📤 File Upload & Processing

### Multer Configuration

```typescript
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "text/csv",
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only CSV, PDF, and Excel files allowed."));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});
```

### Bank Statement Parser Pattern

```typescript
// utils/parsers/bankParser.ts

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  rawData?: any;
}

export interface BankParser {
  detect(content: string, filename: string): boolean;
  parse(content: string, filename: string): Promise<ParsedTransaction[]>;
}

// Example: Nubank parser
export class NubankParser implements BankParser {
  detect(content: string, filename: string): boolean {
    return (
      filename.toLowerCase().includes("nubank") ||
      content.includes("Nu Pagamentos")
    );
  }

  async parse(content: string, filename: string): Promise<ParsedTransaction[]> {
    const transactions: ParsedTransaction[] = [];
    const lines = content.split("\n");

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [dateStr, description, amountStr] = line.split(",");

      const date = this.parseDate(dateStr);
      const amount = this.parseAmount(amountStr);
      const type = amount >= 0 ? "INCOME" : "EXPENSE";

      transactions.push({
        date,
        description: description.trim(),
        amount: Math.abs(amount),
        type,
      });
    }

    return transactions;
  }

  private parseDate(dateStr: string): Date {
    // Implement date parsing logic
    return new Date(dateStr);
  }

  private parseAmount(amountStr: string): number {
    // Implement amount parsing logic
    return parseFloat(amountStr.replace(/[^\d.-]/g, ""));
  }
}
```

---

## 🧪 Testing Patterns

### Controller Testing

```typescript
import request from "supertest";
import app from "../src/index";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Transaction API", () => {
  let authToken: string;
  let budgetId: string;

  beforeAll(async () => {
    // Login to get token
    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    authToken = response.body.token;
    budgetId = response.body.user.defaultBudgetId;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/transactions", () => {
    it("should create a new transaction", async () => {
      const response = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: new Date().toISOString(),
          description: "Test transaction",
          amount: 100.5,
          type: "EXPENSE",
          categoryId: "category-id",
          accountId: "account-id",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.amount).toBe(100.5);
    });

    it("should reject invalid data", async () => {
      const response = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "Test",
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });

    it("should require authentication", async () => {
      const response = await request(app).post("/api/transactions").send({
        date: new Date().toISOString(),
        description: "Test",
        amount: 100,
      });

      expect(response.status).toBe(401);
    });
  });
});
```

---

## 🚫 Common Mistakes

### ❌ DON'T

```typescript
// Don't forget budget isolation
await prisma.transaction.findMany(); // Missing budgetId filter

// Don't use any types
const data: any = req.body;

// Don't skip input validation
await prisma.transaction.create({ data: req.body });

// Don't expose sensitive data
res.json(user); // Includes password hash!

// Don't forget error handling
const item = await prisma.item.findUnique({ where: { id } });
return res.json(item.name); // Could crash if item is null

// Don't hardcode secrets
const token = jwt.sign(payload, "my-secret-key");
```

### ✅ DO

```typescript
// Always filter by budget
await prisma.transaction.findMany({
  where: { budgetId: user.defaultBudgetId },
});

// Use proper types
interface CreateTransactionDto {
  date: Date;
  description: string;
  amount: number;
}
const data: CreateTransactionDto = req.body;

// Validate all inputs
const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ message: error.message });
}

// Select only safe fields
res.json({
  id: user.id,
  email: user.email,
  name: user.name,
});

// Handle null/undefined cases
const item = await prisma.item.findUnique({ where: { id } });
if (!item) {
  return res.status(404).json({ message: "Not found" });
}
return res.json(item);

// Use environment variables
const token = jwt.sign(payload, process.env.JWT_SECRET!);
```

---

## 🧪 Testing

### Test Documentation

Comprehensive testing guide available at **`TESTS_DOCUMENTATION.md`**:

- Working test files and their status
- How to run tests (`npm test`)
- APIs tested and validated
- Test data and users
- Coverage and quality metrics

### Quick Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- working-apis.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Users

Use these standard test users (created by seed):

- joao@example.com / 123456 (família profile)
- maria@example.com / 123456 (freelancer profile)
- pedro@example.com / 123456 (startup profile)

---

## 📚 Key Files to Reference

- **Main Entry**: `src/index.ts` - Server configuration
- **Auth Middleware**: `src/middleware/auth.ts` - JWT authentication
- **Budget Middleware**: `src/middleware/budgetAuth.ts` - Budget access control
- **Prisma Schema**: `prisma/schema.prisma` - Database schema
- **Example Routes**: `src/routes/transactions.ts` - Route implementation patterns
- **Tests Documentation**: `TESTS_DOCUMENTATION.md` - Complete testing guide
- **Main Context**: `../.github/copilot/copilot-context.md` - Full system documentation

---

**Last Updated**: November 12, 2025
**Version**: 2.0.0
