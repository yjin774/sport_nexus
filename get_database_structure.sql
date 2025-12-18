-- ============================================
-- Supabase Database Structure Queries
-- ============================================
-- Run these queries in your Supabase SQL Editor to get complete database structure
-- ============================================

-- 1. Get all tables in the public schema
SELECT 
    table_schema,
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY 
    table_name;

-- 2. Get all columns with detailed information for each table
SELECT 
    t.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable,
    c.column_default,
    c.udt_name
FROM 
    information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.table_schema = 'public'
ORDER BY 
    t.table_name,
    c.ordinal_position;

-- 3. Get primary keys for all tables
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_schema = 'public'
    AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY 
    tc.table_name,
    kcu.ordinal_position;

-- 4. Get foreign keys (relationships)
SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name AS foreign_key_name
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE 
    tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY 
    tc.table_name,
    kcu.column_name;

-- 5. Get unique constraints
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_schema = 'public'
    AND tc.constraint_type = 'UNIQUE'
ORDER BY 
    tc.table_name,
    kcu.column_name;

-- 6. Get check constraints
SELECT
    tc.table_name,
    cc.check_clause,
    tc.constraint_name
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
        AND tc.table_schema = cc.constraint_schema
WHERE 
    tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK'
ORDER BY 
    tc.table_name;

-- 7. Get indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename,
    indexname;

-- 8. Get table row counts (approximate)
SELECT 
    schemaname,
    relname AS tablename,
    n_live_tup AS row_count
FROM 
    pg_stat_user_tables
WHERE 
    schemaname = 'public'
ORDER BY 
    relname;

-- ============================================
-- FORMATTED OUTPUT FOR MARKDOWN DOCUMENTATION
-- ============================================
-- This query formats the output for easy copy-paste into markdown
SELECT 
    t.table_name AS "Table",
    c.column_name AS "Column",
    CASE 
        WHEN c.character_maximum_length IS NOT NULL 
        THEN c.data_type || '(' || c.character_maximum_length || ')'
        WHEN c.numeric_precision IS NOT NULL AND c.numeric_scale IS NOT NULL
        THEN c.data_type || '(' || c.numeric_precision || ',' || c.numeric_scale || ')'
        WHEN c.numeric_precision IS NOT NULL
        THEN c.data_type || '(' || c.numeric_precision || ')'
        ELSE c.data_type
    END AS "Data Type",
    CASE WHEN c.is_nullable = 'YES' THEN 'YES' ELSE 'NO' END AS "Nullable",
    COALESCE(c.column_default, '') AS "Default",
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY → ' || fk.target_table || '.' || fk.target_column
        WHEN uq.column_name IS NOT NULL THEN 'UNIQUE'
        ELSE ''
    END AS "Constraints"
FROM 
    information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    LEFT JOIN (
        SELECT kcu.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
    LEFT JOIN (
        SELECT 
            kcu.table_name, 
            kcu.column_name,
            ccu.table_name AS target_table,
            ccu.column_name AS target_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
    LEFT JOIN (
        SELECT kcu.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ) uq ON c.table_name = uq.table_name AND c.column_name = uq.column_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.table_schema = 'public'
ORDER BY 
    t.table_name,
    c.ordinal_position;

-- ============================================
-- COMPREHENSIVE QUERY: All tables with columns in one result
-- ============================================
SELECT 
    t.table_name,
    c.column_name,
    c.ordinal_position AS position,
    c.data_type,
    CASE 
        WHEN c.character_maximum_length IS NOT NULL 
        THEN c.data_type || '(' || c.character_maximum_length || ')'
        WHEN c.numeric_precision IS NOT NULL AND c.numeric_scale IS NOT NULL
        THEN c.data_type || '(' || c.numeric_precision || ',' || c.numeric_scale || ')'
        WHEN c.numeric_precision IS NOT NULL
        THEN c.data_type || '(' || c.numeric_precision || ')'
        ELSE c.data_type
    END AS full_data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
        WHEN uq.column_name IS NOT NULL THEN 'UNIQUE'
        ELSE ''
    END AS constraints
FROM 
    information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    LEFT JOIN (
        SELECT kcu.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
    LEFT JOIN (
        SELECT kcu.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
    LEFT JOIN (
        SELECT kcu.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ) uq ON c.table_name = uq.table_name AND c.column_name = uq.column_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.table_schema = 'public'
ORDER BY 
    t.table_name,
    c.ordinal_position;

