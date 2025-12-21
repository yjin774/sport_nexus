-- ============================================
-- DELETE INACTIVE PRODUCTS AND THEIR VARIANTS
-- This script removes all products with status = 'inactive'
-- and all their associated product variants
-- ============================================

-- Step 1: Show what will be deleted (for verification)
-- Uncomment the following queries to preview what will be deleted:

-- Preview inactive products
SELECT 
    id,
    product_code,
    product_name,
    status,
    created_at
FROM products
WHERE status = 'inactive'
ORDER BY product_code;

-- Preview variants that will be deleted
SELECT 
    pv.id as variant_id,
    pv.sku,
    pv.variant_name,
    p.product_code,
    p.product_name,
    p.status as product_status
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.status = 'inactive'
ORDER BY p.product_code, pv.sku;

-- Preview stock_count_items that will be deleted
SELECT 
    sci.id as stock_count_item_id,
    sci.product_variant_id,
    pv.sku,
    p.product_code,
    p.product_name,
    p.status as product_status
FROM stock_count_items sci
JOIN product_variants pv ON sci.product_variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE p.status = 'inactive'
ORDER BY p.product_code, pv.sku;

-- Count summary
SELECT 
    COUNT(DISTINCT p.id) as inactive_products_count,
    COUNT(DISTINCT pv.id) as variants_to_delete_count,
    COUNT(DISTINCT sci.id) as stock_count_items_to_delete_count
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
LEFT JOIN stock_count_items sci ON sci.product_variant_id = pv.id
WHERE p.status = 'inactive';

-- ============================================
-- Step 2: DELETE OPERATIONS
-- ============================================
-- WARNING: This will permanently delete data!
-- Make sure you have a backup before running this.
-- ============================================
-- 
-- Deletion order (to handle foreign key constraints):
-- 1. stock_count_items (references product_variants)
-- 2. product_variants (references products)
-- 3. products
-- ============================================

BEGIN;

-- Step 1: Delete stock_count_items that reference variants of inactive products
-- This must be done FIRST due to foreign key constraint
DELETE FROM stock_count_items
WHERE product_variant_id IN (
    SELECT pv.id 
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE p.status = 'inactive'
);

-- Step 2: Delete all variants associated with inactive products
-- This must be done before deleting products due to foreign key constraints
DELETE FROM product_variants
WHERE product_id IN (
    SELECT id FROM products WHERE status = 'inactive'
);

-- Step 3: Delete all inactive products
DELETE FROM products
WHERE status = 'inactive';

-- Show deletion summary
DO $$
DECLARE
    deleted_products_count INTEGER;
    deleted_variants_count INTEGER;
    deleted_stock_items_count INTEGER;
BEGIN
    -- Get counts (these will be 0 after deletion, but we can show what was deleted)
    SELECT COUNT(*) INTO deleted_products_count
    FROM products
    WHERE status = 'inactive';
    
    SELECT COUNT(*) INTO deleted_variants_count
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE p.status = 'inactive';
    
    SELECT COUNT(*) INTO deleted_stock_items_count
    FROM stock_count_items sci
    JOIN product_variants pv ON sci.product_variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE p.status = 'inactive';
    
    RAISE NOTICE 'Deletion completed.';
    RAISE NOTICE 'Remaining inactive products: %', deleted_products_count;
    RAISE NOTICE 'Remaining variants for inactive products: %', deleted_variants_count;
    RAISE NOTICE 'Remaining stock_count_items for inactive products: %', deleted_stock_items_count;
END $$;

-- Commit the transaction
COMMIT;

-- ============================================
-- Step 3: Verification (run after deletion)
-- ============================================

-- Verify no inactive products remain
SELECT 
    COUNT(*) as remaining_inactive_products
FROM products
WHERE status = 'inactive';

-- Verify no variants for inactive products remain
SELECT 
    COUNT(*) as remaining_variants_for_inactive_products
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.status = 'inactive';

-- Verify no stock_count_items for inactive products remain
SELECT 
    COUNT(*) as remaining_stock_count_items_for_inactive_products
FROM stock_count_items sci
JOIN product_variants pv ON sci.product_variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE p.status = 'inactive';

-- Show remaining active products count
SELECT 
    COUNT(*) as active_products_count
FROM products
WHERE status = 'active';

