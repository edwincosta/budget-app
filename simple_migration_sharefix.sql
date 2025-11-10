-- ==========================================
-- MIGRATION: SharePermission Enum Update
-- Versão: 1.2.0
-- Data: 10/11/2025
-- Descrição: Remove OWNER do enum SharePermission
-- ==========================================

-- Verificar se o enum existe e mostrar valores atuais
DO $$
DECLARE
    type_exists boolean := false;
    type_oid oid;
    rec RECORD;
BEGIN
    -- Verificar se o tipo existe (case insensitive)
    SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE LOWER(typname) = 'sharepermission'
    ) INTO type_exists;
    
    IF type_exists THEN
        RAISE NOTICE 'Enum SharePermission encontrado';
        -- Obter o OID do tipo
        SELECT oid FROM pg_type WHERE LOWER(typname) = 'sharepermission' INTO type_oid;
        -- Mostrar valores atuais
        FOR rec IN SELECT enumlabel FROM pg_enum WHERE enumtypid = type_oid ORDER BY enumsortorder LOOP
            RAISE NOTICE 'Valor atual: %', rec.enumlabel;
        END LOOP;
    ELSE
        RAISE NOTICE 'Enum SharePermission não encontrado - criando novo';
        CREATE TYPE SharePermission AS ENUM ('READ', 'WRITE');
    END IF;
END $$;

-- Alterar enum SharePermission removendo OWNER (se existe)
DO $$
DECLARE
    has_owner boolean := false;
    type_oid oid;
    type_name text;
BEGIN
    -- Verificar se o tipo SharePermission existe e obter o nome exato
    SELECT typname FROM pg_type 
    WHERE LOWER(typname) = 'sharepermission' 
    INTO type_name;
    
    IF type_name IS NOT NULL THEN
        SELECT oid FROM pg_type WHERE typname = type_name INTO type_oid;
        
        -- Verificar se tem o valor OWNER
        SELECT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = type_oid AND UPPER(enumlabel) = 'OWNER'
        ) INTO has_owner;
        
        IF has_owner THEN
            RAISE NOTICE 'Removendo OWNER do enum % (nome real: %)...', 'SharePermission', type_name;
            
            -- Usar o nome exato do tipo
            EXECUTE format('ALTER TYPE %I RENAME TO %I', type_name, type_name || '_old');
            EXECUTE format('CREATE TYPE %I AS ENUM (''READ'', ''WRITE'')', type_name);
            
            -- Atualizar tabela budget_shares se existe
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_shares') THEN
                RAISE NOTICE 'Atualizando coluna permission na tabela budget_shares...';
                
                -- Remover DEFAULT temporariamente
                ALTER TABLE budget_shares ALTER COLUMN permission DROP DEFAULT;
                
                -- Atualizar o tipo da coluna
                EXECUTE format('ALTER TABLE budget_shares ALTER COLUMN permission TYPE %I USING CASE WHEN permission::text = ''OWNER'' THEN ''WRITE''::%I ELSE permission::text::%I END', type_name, type_name, type_name);
                
                -- Recriar DEFAULT com valor válido
                EXECUTE format('ALTER TABLE budget_shares ALTER COLUMN permission SET DEFAULT ''READ''::%I', type_name);
            END IF;
            
            -- Remover enum antigo
            EXECUTE format('DROP TYPE %I', type_name || '_old');
            RAISE NOTICE 'Enum % atualizado com sucesso - OWNER removido', type_name;
        ELSE
            RAISE NOTICE 'Enum % já não contém OWNER - nada a fazer', type_name;
        END IF;
    ELSE
        RAISE NOTICE 'Enum SharePermission não existe - nada a fazer';
    END IF;
END $$;

-- Verificar resultado final
DO $$
DECLARE
    type_exists boolean := false;
    type_oid oid;
    rec RECORD;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE LOWER(typname) = 'sharepermission'
    ) INTO type_exists;
    
    IF type_exists THEN
        RAISE NOTICE 'Verificando valores finais do enum SharePermission:';
        SELECT oid FROM pg_type WHERE LOWER(typname) = 'sharepermission' INTO type_oid;
        FOR rec IN SELECT enumlabel FROM pg_enum WHERE enumtypid = type_oid ORDER BY enumsortorder LOOP
            RAISE NOTICE 'Valor: %', rec.enumlabel;
        END LOOP;
    ELSE
        RAISE NOTICE 'Enum SharePermission não encontrado no resultado final';
    END IF;
END $$;

-- Verificar dados na tabela (se existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_shares') THEN
        PERFORM 1; -- Placeholder para verificação
        RAISE NOTICE 'Tabela budget_shares encontrada';
    ELSE
        RAISE NOTICE 'Tabela budget_shares não encontrada';
    END IF;
END $$;