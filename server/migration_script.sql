-- Script de migração para nova estrutura de orçamentos
-- Este script irá:
-- 1. Criar um Budget padrão para cada usuário existente
-- 2. Migrar todas as contas, categorias, transações e itens de orçamento para o Budget do usuário
-- 3. Converter UserShares em BudgetShares

BEGIN;

-- 1. Adicionar colunas temporárias se necessário
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_budget_id TEXT;

-- 2. Criar tabela budgets
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar Budget padrão para cada usuário existente
INSERT INTO budgets (id, name, description, owner_id, created_at, updated_at)
SELECT 
    gen_random_uuid()::text as id,
    users.name || ' - Orçamento Principal' as name,
    'Orçamento principal criado automaticamente na migração' as description,
    users.id as owner_id,
    users.created_at,
    users.updated_at
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM budgets WHERE budgets.owner_id = users.id
);

-- 4. Atualizar default_budget_id dos usuários
UPDATE users 
SET default_budget_id = (
    SELECT budgets.id 
    FROM budgets 
    WHERE budgets.owner_id = users.id 
    LIMIT 1
)
WHERE default_budget_id IS NULL;

-- 5. Adicionar budget_id às tabelas existentes
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS budget_id TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS budget_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS budget_id TEXT;

-- 6. Migrar dados para Budget do proprietário
UPDATE accounts 
SET budget_id = (
    SELECT budgets.id 
    FROM budgets 
    WHERE budgets.owner_id = accounts.user_id 
    LIMIT 1
)
WHERE budget_id IS NULL;

UPDATE categories 
SET budget_id = (
    SELECT budgets.id 
    FROM budgets 
    WHERE budgets.owner_id = categories.user_id 
    LIMIT 1
)
WHERE budget_id IS NULL;

UPDATE transactions 
SET budget_id = (
    SELECT budgets.id 
    FROM budgets 
    WHERE budgets.owner_id = transactions.user_id 
    LIMIT 1
)
WHERE budget_id IS NULL;

-- 7. Criar nova tabela budget_items baseada na tabela budgets antiga
CREATE TABLE IF NOT EXISTS budget_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    amount DECIMAL(12,2) NOT NULL,
    period TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    category_id TEXT NOT NULL,
    budget_id TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Migrar dados da tabela budgets antiga para budget_items
INSERT INTO budget_items (id, amount, period, is_active, category_id, budget_id, created_at, updated_at)
SELECT 
    old_budgets.id,
    old_budgets.amount,
    old_budgets.period,
    old_budgets.is_active,
    old_budgets.category_id,
    (SELECT budgets.id FROM budgets WHERE budgets.owner_id = old_budgets.user_id LIMIT 1) as budget_id,
    old_budgets.created_at,
    old_budgets.updated_at
FROM budgets AS old_budgets
WHERE EXISTS (SELECT 1 FROM budgets WHERE budgets.owner_id = old_budgets.user_id);

-- 9. Criar nova tabela budget_shares
CREATE TABLE IF NOT EXISTS budget_shares (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    budget_id TEXT NOT NULL,
    shared_with_id TEXT NOT NULL,
    permission TEXT NOT NULL DEFAULT 'READ',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Migrar UserShares para BudgetShares (se existir a tabela user_shares)
INSERT INTO budget_shares (id, budget_id, shared_with_id, permission, status, created_at, updated_at)
SELECT 
    gen_random_uuid()::text as id,
    (SELECT budgets.id FROM budgets WHERE budgets.owner_id = user_shares.owner_id LIMIT 1) as budget_id,
    user_shares.shared_with_id,
    CASE 
        WHEN 'WRITE_ACCOUNTS' = ANY(user_shares.permissions) OR 
             'WRITE_TRANSACTIONS' = ANY(user_shares.permissions) OR 
             'WRITE_BUDGETS' = ANY(user_shares.permissions) OR 
             'WRITE_CATEGORIES' = ANY(user_shares.permissions) 
        THEN 'WRITE'
        ELSE 'READ'
    END as permission,
    LOWER(user_shares.status) as status,
    user_shares.created_at,
    user_shares.updated_at
FROM user_shares
WHERE EXISTS (SELECT 1 FROM budgets WHERE budgets.owner_id = user_shares.owner_id)
ON CONFLICT DO NOTHING;

COMMIT;
