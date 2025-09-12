-- CreateEnum
CREATE TYPE "ImportFileType" AS ENUM ('CSV', 'PDF');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'CLASSIFIED', 'COMPLETED', 'ERROR', 'CANCELLED');

-- CreateTable
CREATE TABLE "import_sessions" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" "ImportFileType" NOT NULL,
    "accountId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temp_transactions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,
    "originalData" JSONB,
    "isClassified" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temp_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temp_transactions" ADD CONSTRAINT "temp_transactions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "import_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temp_transactions" ADD CONSTRAINT "temp_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
