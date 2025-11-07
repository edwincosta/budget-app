-- SQL para corrigir todos os enums no Supabase
-- Execute no SQL Editor do Supabase:

-- 1. Corrigir ImportStatus (todos em lowercase)
ALTER TYPE "ImportStatus" RENAME VALUE 'pending' TO 'PENDING';
ALTER TYPE "ImportStatus" RENAME VALUE 'processing' TO 'PROCESSING';  
ALTER TYPE "ImportStatus" RENAME VALUE 'classified' TO 'CLASSIFIED';
ALTER TYPE "ImportStatus" RENAME VALUE 'completed' TO 'COMPLETED';
ALTER TYPE "ImportStatus" RENAME VALUE 'error' TO 'ERROR';
ALTER TYPE "ImportStatus" RENAME VALUE 'cancelled' TO 'CANCELLED';

-- 2. Corrigir SharePermission ('write' em lowercase)
ALTER TYPE "SharePermission" RENAME VALUE 'write' TO 'WRITE';

-- 3. Verificar resultado final
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('ImportFileType', 'ShareStatus', 'SharePermission', 'ImportStatus', 'AccountType', 'CategoryType', 'TransactionType', 'BudgetPeriod')
GROUP BY t.typname
ORDER BY t.typname;
