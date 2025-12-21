-- ============================================
-- REMOVE DUPLICATE PRODUCTS FROM DATABASE
-- ============================================
-- This script identifies and removes duplicate products based on product_name and brand
-- It keeps the product with the earliest created_at timestamp (or lowest ID if timestamps are equal)
-- and updates any related records (product_variants, transaction_items) to reference the kept product
-- ============================================

-- STEP 1: Identify duplicates (for review)
-- This query shows all duplicate products grouped by product_name and brand
SELECT 
    product_name,
    brand,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ' ORDER BY created_at, id) as product_ids,
    STRING_AGG(product_code, ', ' ORDER BY created_at, id) as product_codes
FROM products
GROUP BY product_name, brand
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, product_name;

-- STEP 2: Create a temporary table to store which products to keep
-- This keeps the product with the earliest created_at (or lowest ID if timestamps are equal)
CREATE TEMP TABLE products_to_keep AS
SELECT DISTINCT ON (product_name, brand)
    id as keep_id,
    product_name,
    brand
FROM products
ORDER BY product_name, brand, created_at ASC, id ASC;

-- STEP 3: Create a mapping table of duplicate products to their "keep" product
CREATE TEMP TABLE product_id_mapping AS
SELECT 
    p.id as duplicate_id,
    pk.keep_id as keep_id
FROM products p
INNER JOIN products_to_keep pk 
    ON p.product_name = pk.product_name 
    AND p.brand = pk.brand
WHERE p.id != pk.keep_id;

-- STEP 4: Update product_variants to reference the kept product
-- This moves all variants from duplicate products to the kept product
UPDATE product_variants pv
SET product_id = pm.keep_id,
    updated_at = NOW()
FROM product_id_mapping pm
WHERE pv.product_id = pm.duplicate_id;

-- STEP 5: Update transaction_items to reference the kept product
-- Note: transaction_items might reference product_variant_id, not product_id directly
-- If transaction_items has product_id, update it. Otherwise, this step can be skipped.
-- Uncomment the following if transaction_items has a product_id column:
-- UPDATE transaction_items ti
-- SET product_id = pm.keep_id,
--     updated_at = NOW()
-- FROM product_id_mapping pm
-- WHERE ti.product_id = pm.duplicate_id;

-- STEP 6: Delete duplicate products
-- This removes all duplicate products (variants have already been moved to kept products)
DELETE FROM products
WHERE id IN (SELECT duplicate_id FROM product_id_mapping);

-- STEP 7: Verify deletion (check remaining products)
SELECT 
    product_name,
    brand,
    COUNT(*) as count
FROM products
GROUP BY product_name, brand
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ============================================
-- ALTERNATIVE APPROACH: Manual deletion by specific IDs
-- ============================================
-- If you prefer to manually specify which duplicates to remove,
-- use the queries below. Replace the IDs with the actual duplicate IDs you want to remove.

-- Example: Remove specific duplicate products
-- First, update variants to point to the kept product
-- UPDATE product_variants 
-- SET product_id = '18d32117-4507-4a82-80d1-cdab3eb60a5d'  -- Keep this one
-- WHERE product_id IN (
--     '4f5d45ce-899f-4e25-8e15-547f1f609665',  -- RACKETS2279002
--     '73719f07-cc6d-441a-949e-ba84de22c5dd',  -- RACKETS2279001
--     '796baf00-8226-4bc4-b6c0-a38818d6f6b7',  -- RACKETS2279004
--     '8574d43d-e50c-48c4-b4c9-49606ea2f87f',  -- RACKETS2279005
--     'cec27841-94bf-47e9-8127-44df97424df9'   -- RACKETS2279003
-- );

-- Then delete the duplicate products
-- DELETE FROM products 
-- WHERE id IN (
--     '4f5d45ce-899f-4e25-8e15-547f1f609665',  -- RACKETS2279002
--     '73719f07-cc6d-441a-949e-ba84de22c5dd',  -- RACKETS2279001
--     '796baf00-8226-4bc4-b6c0-a38818d6f6b7',  -- RACKETS2279004
--     '8574d43d-e50c-48c4-b4c9-49606ea2f87f',  -- RACKETS2279005
--     'cec27841-94bf-47e9-8127-44df97424df9'   -- RACKETS2279003
-- );

-- ============================================
-- SPECIFIC DUPLICATE REMOVAL QUERIES
-- Based on the CSV data analysis
-- ============================================

-- Group 1: "Head Radical 160" by Head (6 duplicates)
-- First, find which product to keep (the one that exists and has the earliest created_at)

DO $$
DECLARE
    keep_product_id UUID;
BEGIN
    -- Find the product to keep (earliest created_at)
    SELECT id INTO keep_product_id
    FROM products
    WHERE product_name = 'Head Radical 160'
      AND brand = 'Head'
    ORDER BY created_at ASC, id ASC
    LIMIT 1;
    
    -- Update variants to point to the kept product
    IF keep_product_id IS NOT NULL THEN
        UPDATE product_variants 
        SET product_id = keep_product_id,
            updated_at = NOW()
        WHERE product_id IN (
            '18d32117-4507-4a82-80d1-cdab3eb60a5d',  -- OUTDOOR0D0B002
            '4f5d45ce-899f-4e25-8e15-547f1f609665',  -- RACKETS2279002
            '73719f07-cc6d-441a-949e-ba84de22c5dd',  -- RACKETS2279001
            '796baf00-8226-4bc4-b6c0-a38818d6f6b7',  -- RACKETS2279004
            '8574d43d-e50c-48c4-b4c9-49606ea2f87f',  -- RACKETS2279005
            'cec27841-94bf-47e9-8127-44df97424df9'   -- RACKETS2279003
        )
        AND product_id != keep_product_id;
        
        -- Delete duplicate products (excluding the one we're keeping)
        DELETE FROM products 
        WHERE product_name = 'Head Radical 160'
          AND brand = 'Head'
          AND id != keep_product_id;
    END IF;
END $$;

-- Group 2: "Elite Training Basketball" by Tarmak (11 duplicates)
-- First, find which product to keep (the one that exists and has the earliest created_at)
-- Keep the first existing product from the list, or use BALLS3F50002 as fallback

-- Step 2a: Find which product ID actually exists to keep
DO $$
DECLARE
    keep_product_id UUID;
BEGIN
    -- Try to find an existing product to keep, prioritizing by created_at
    SELECT id INTO keep_product_id
    FROM products
    WHERE product_name = 'Elite Training Basketball'
      AND brand = 'Tarmak'
      AND id IN (
        'f0f060e6-a345-48e4-b23b-fcebc72dead3',  -- BALLS3F50001
        '50c29127-540d-4eaf-91fd-e925d9e4bc35',  -- BALLS3F50002
        '4fc4b212-0721-498b-ba8a-666a1e409b64',  -- BALLS3F50003
        '7393c036-2c5a-4ba8-b919-31ec555736ad',  -- BALLS3F50005
        '439a7212-bea3-4f3e-b522-9ccea9691a97',  -- ACCESSORIESACCB001
        '501a727c-2615-40d9-89fd-9032daca9b3a',  -- ACCESSORIESACCB002
        '7e93eb46-b1a7-464b-927a-0d578e0a9ec0',  -- SHIRTB08E001
        '7052edd2-53e8-46b6-b318-d0c99796eb6c',  -- ACCESSORIESACCB005
        '765254dc-0d22-42fe-920d-f764b89dd565',  -- ACCESSORIESACCB004
        'a1861f2c-c750-49bb-9597-9a2ab05f6968',  -- SHIRTB08E004
        'd17d2099-aecc-4e63-9026-06d55b7c8e46'   -- SHIRTB08E002
      )
    ORDER BY created_at ASC, id ASC
    LIMIT 1;
    
    -- If none found, get any existing product with this name and brand
    IF keep_product_id IS NULL THEN
        SELECT id INTO keep_product_id
        FROM products
        WHERE product_name = 'Elite Training Basketball'
          AND brand = 'Tarmak'
        ORDER BY created_at ASC, id ASC
        LIMIT 1;
    END IF;
    
    -- Update variants to point to the kept product
    IF keep_product_id IS NOT NULL THEN
        UPDATE product_variants 
        SET product_id = keep_product_id,
            updated_at = NOW()
        WHERE product_id IN (
            'f0f060e6-a345-48e4-b23b-fcebc72dead3',  -- BALLS3F50001
            '50c29127-540d-4eaf-91fd-e925d9e4bc35',  -- BALLS3F50002
            '4fc4b212-0721-498b-ba8a-666a1e409b64',  -- BALLS3F50003
            '7393c036-2c5a-4ba8-b919-31ec555736ad',  -- BALLS3F50005
            '439a7212-bea3-4f3e-b522-9ccea9691a97',  -- ACCESSORIESACCB001
            '501a727c-2615-40d9-89fd-9032daca9b3a',  -- ACCESSORIESACCB002
            '7e93eb46-b1a7-464b-927a-0d578e0a9ec0',  -- SHIRTB08E001
            '7052edd2-53e8-46b6-b318-d0c99796eb6c',  -- ACCESSORIESACCB005
            '765254dc-0d22-42fe-920d-f764b89dd565',  -- ACCESSORIESACCB004
            'a1861f2c-c750-49bb-9597-9a2ab05f6968',  -- SHIRTB08E004
            'd17d2099-aecc-4e63-9026-06d55b7c8e46'   -- SHIRTB08E002
        )
        AND product_id != keep_product_id;
        
        -- Delete duplicate products (excluding the one we're keeping)
        DELETE FROM products 
        WHERE product_name = 'Elite Training Basketball'
          AND brand = 'Tarmak'
          AND id != keep_product_id;
    END IF;
END $$;

-- Group 3: "Adidas Thermal Pro Winter Gear" by Adidas (13 duplicates)
-- First, find which product to keep (the one that exists and has the earliest created_at)

DO $$
DECLARE
    keep_product_id UUID;
BEGIN
    -- Find the product to keep (earliest created_at)
    SELECT id INTO keep_product_id
    FROM products
    WHERE product_name = 'Adidas Thermal Pro Winter Gear'
      AND brand = 'Adidas'
    ORDER BY created_at ASC, id ASC
    LIMIT 1;
    
    -- Update variants to point to the kept product
    IF keep_product_id IS NOT NULL THEN
        UPDATE product_variants 
        SET product_id = keep_product_id,
            updated_at = NOW()
        WHERE product_id IN (
            '34ba3d01-83d7-4b6d-b698-6a50b2c9b8df',  -- WATER9D3D003
            '358d146e-f82c-49d7-90d1-68c28acda6a4',  -- SHOE1E0F003
            '43959fd4-4b20-4653-9b58-160f4c921689',  -- SHOE1E0F001
            '67eb03eb-fd2f-4c3c-a1b5-6b8797dd0034',  -- WATER9D3D001
            '6f074760-1363-4d1e-a1ff-61dac13666e8',  -- WATER9D3D004
            '88666854-5da4-462a-bc5c-9f72b7a2d136',  -- WINTERB2FB004
            '9087556d-59b4-49cb-993c-87339c7a4605',  -- SHOE1E0F005
            '8ed384cd-9b36-4473-9c58-08b84987f1e7',  -- WINTERB2FB002
            'aad27ca3-a0e0-45c0-bd9c-0148985d3b56',  -- WATER9D3D002
            'ab59840a-4294-44ce-a806-c9d47f23b9e1',  -- SHOE1E0F002
            'c14afc7b-3f31-43f7-8640-413417705a04',  -- WATER9D3D005
            'eb60b2e2-4e29-4648-b6d9-6dc2714d38f4'   -- SHOE1E0F004
        )
        AND product_id != keep_product_id;
        
        -- Delete duplicate products (excluding the one we're keeping)
        DELETE FROM products 
        WHERE product_name = 'Adidas Thermal Pro Winter Gear'
          AND brand = 'Adidas'
          AND id != keep_product_id;
    END IF;
END $$;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
-- Run this query after executing the deletions to verify no duplicates remain
SELECT 
    product_name,
    brand,
    COUNT(*) as count,
    STRING_AGG(product_code, ', ' ORDER BY created_at) as product_codes
FROM products
GROUP BY product_name, brand
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- If the above query returns no rows, all duplicates have been successfully removed!
