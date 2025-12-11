-- ============================================
-- COMPREHENSIVE DATABASE SCHEMA INSPECTION
-- ============================================
-- This query returns all tables and their columns
-- Run this in Supabase SQL Editor to get complete schema information

-- Method 1: Get all tables with their columns (Recommended)
SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END AS is_primary_key
FROM 
    information_schema.tables t
INNER JOIN 
    information_schema.columns c ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
LEFT JOIN (
    SELECT 
        ku.table_schema,
        ku.table_name,
        ku.column_name
    FROM 
        information_schema.table_constraints tc
    INNER JOIN 
        information_schema.key_column_usage ku 
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE 
        tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name 
    AND c.column_name = pk.column_name
    AND c.table_schema = pk.table_schema
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name, 
    c.ordinal_position;

-- ============================================
-- ALTERNATIVE QUERY: Simpler format
-- ============================================
-- If the above is too complex, use this simpler query:

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN ('staff', 'member', 'supplier', 'positions')
ORDER BY 
    table_name, 
    ordinal_position;

-- ============================================
-- QUERY 3: Get specific tables' details
-- ============================================
-- This focuses on the tables we care about:

SELECT 
    'STAFF' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'staff'
ORDER BY 
    ordinal_position

UNION ALL

SELECT 
    'MEMBER' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'member'
ORDER BY 
    ordinal_position

UNION ALL

SELECT 
    'SUPPLIER' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'supplier'
ORDER BY 
    ordinal_position

UNION ALL

SELECT 
    'POSITIONS' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'positions'
ORDER BY 
    ordinal_position;

-- ============================================
-- QUERY 4: Check for username-related columns
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND (
        column_name ILIKE '%user%name%' 
        OR column_name ILIKE '%name%'
        OR column_name ILIKE '%username%'
        OR column_name = 'username'
        OR column_name = 'user_name'
        OR column_name = 'name'
    )
ORDER BY 
    table_name, 
    column_name;

-- ============================================
-- QUERY 5: List all tables in public schema
-- ============================================
SELECT 
    table_name
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY 
    table_name;

