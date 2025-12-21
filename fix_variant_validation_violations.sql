-- ============================================
-- FIX VARIANT VALIDATION VIOLATIONS
-- ============================================
-- This script identifies and fixes variants that violate the validation rules:
-- 1. SKU must be unique globally
-- 2. Barcode must be unique globally (if provided)
-- 3. Variant Name must be unique per product
-- 4. Size + Color + Weight + Grip + Material combination must be unique per product
-- ============================================

-- ============================================
-- STEP 1: IDENTIFY DUPLICATE SKUs
-- ============================================
-- Find all duplicate SKUs (case-insensitive)
SELECT 
    UPPER(sku) as sku_upper,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ' ORDER BY created_at) as variant_ids,
    STRING_AGG(product_id::text, ', ') as product_ids
FROM product_variants
WHERE sku IS NOT NULL AND sku != ''
GROUP BY UPPER(sku)
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================
-- STEP 2: IDENTIFY DUPLICATE BARCODES
-- ============================================
-- Find all duplicate barcodes (if provided)
SELECT 
    barcode,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ' ORDER BY created_at) as variant_ids,
    STRING_AGG(product_id::text, ', ') as product_ids
FROM product_variants
WHERE barcode IS NOT NULL AND barcode != ''
GROUP BY barcode
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================
-- STEP 3: IDENTIFY DUPLICATE VARIANT NAMES PER PRODUCT
-- ============================================
-- Find duplicate variant names within the same product (case-insensitive, excluding 'N/A')
SELECT 
    product_id,
    LOWER(TRIM(variant_name)) as variant_name_lower,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ' ORDER BY created_at) as variant_ids
FROM product_variants
WHERE variant_name IS NOT NULL 
  AND variant_name != '' 
  AND LOWER(TRIM(variant_name)) != 'n/a'
GROUP BY product_id, LOWER(TRIM(variant_name))
HAVING COUNT(*) > 1
ORDER BY product_id, duplicate_count DESC;

-- ============================================
-- STEP 4: IDENTIFY DUPLICATE ATTRIBUTE COMBINATIONS PER PRODUCT
-- ============================================
-- Find duplicate Size + Color + Weight + Grip + Material combinations within the same product
SELECT 
    product_id,
    COALESCE(LOWER(TRIM(size)), 'n/a') as size_normalized,
    COALESCE(LOWER(TRIM(color)), 'n/a') as color_normalized,
    COALESCE(LOWER(TRIM(weight)), 'n/a') as weight_normalized,
    COALESCE(LOWER(TRIM(grip)), 'n/a') as grip_normalized,
    COALESCE(LOWER(TRIM(material)), 'n/a') as material_normalized,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ' ORDER BY created_at) as variant_ids
FROM product_variants
GROUP BY 
    product_id,
    COALESCE(LOWER(TRIM(size)), 'n/a'),
    COALESCE(LOWER(TRIM(color)), 'n/a'),
    COALESCE(LOWER(TRIM(weight)), 'n/a'),
    COALESCE(LOWER(TRIM(grip)), 'n/a'),
    COALESCE(LOWER(TRIM(material)), 'n/a')
HAVING COUNT(*) > 1
ORDER BY product_id, duplicate_count DESC;

-- ============================================
-- STEP 5: FIX DUPLICATE SKUs
-- ============================================
-- For duplicate SKUs, keep the oldest variant and update others with unique SKUs
DO $$
DECLARE
    dup_record RECORD;
    variant_record RECORD;
    new_sku TEXT;
    base_sku TEXT;
    counter INTEGER;
BEGIN
    -- Loop through each duplicate SKU group
    FOR dup_record IN 
        SELECT UPPER(sku) as sku_upper, COUNT(*) as dup_count
        FROM product_variants
        WHERE sku IS NOT NULL AND sku != ''
        GROUP BY UPPER(sku)
        HAVING COUNT(*) > 1
    LOOP
        counter := 0;
        base_sku := (SELECT sku FROM product_variants WHERE UPPER(sku) = dup_record.sku_upper ORDER BY created_at ASC LIMIT 1);
        
        -- Update all but the first variant (oldest by created_at) with new unique SKUs
        FOR variant_record IN 
            SELECT id, sku
            FROM product_variants
            WHERE UPPER(sku) = dup_record.sku_upper
            ORDER BY created_at ASC
        LOOP
            IF counter = 0 THEN
                -- Keep the first one (oldest)
                counter := counter + 1;
            ELSE
                -- Generate new unique SKU for duplicates
                new_sku := base_sku || '-DUP-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || LPAD(counter::TEXT, 3, '0');
                
                UPDATE product_variants
                SET 
                    sku = new_sku,
                    updated_at = NOW()
                WHERE id = variant_record.id;
                
                counter := counter + 1;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- STEP 6: FIX DUPLICATE BARCODES
-- ============================================
-- For duplicate barcodes, set duplicates to NULL (keep the oldest variant's barcode)
DO $$
DECLARE
    dup_record RECORD;
BEGIN
    -- Loop through each duplicate barcode group
    FOR dup_record IN 
        SELECT barcode, COUNT(*) as dup_count
        FROM product_variants
        WHERE barcode IS NOT NULL AND barcode != ''
        GROUP BY barcode
        HAVING COUNT(*) > 1
    LOOP
        -- Set barcode to NULL for all but the first variant (oldest by created_at)
        UPDATE product_variants
        SET 
            barcode = NULL,
            updated_at = NOW()
        WHERE barcode = dup_record.barcode
          AND id NOT IN (
              SELECT id 
              FROM product_variants 
              WHERE barcode = dup_record.barcode 
              ORDER BY created_at ASC 
              LIMIT 1
          );
    END LOOP;
END $$;

-- ============================================
-- STEP 7: FIX DUPLICATE VARIANT NAMES PER PRODUCT
-- ============================================
-- For duplicate variant names within the same product, append suffix to duplicates
DO $$
DECLARE
    dup_record RECORD;
    variant_record RECORD;
    new_variant_name TEXT;
    base_variant_name TEXT;
    counter INTEGER;
BEGIN
    -- Loop through each duplicate variant name group per product
    FOR dup_record IN 
        SELECT 
            product_id,
            LOWER(TRIM(variant_name)) as variant_name_lower,
            COUNT(*) as dup_count
        FROM product_variants
        WHERE variant_name IS NOT NULL 
          AND variant_name != '' 
          AND LOWER(TRIM(variant_name)) != 'n/a'
        GROUP BY product_id, LOWER(TRIM(variant_name))
        HAVING COUNT(*) > 1
    LOOP
        counter := 0;
        base_variant_name := (
            SELECT variant_name 
            FROM product_variants 
            WHERE product_id = dup_record.product_id
              AND LOWER(TRIM(variant_name)) = dup_record.variant_name_lower
            ORDER BY created_at ASC 
            LIMIT 1
        );
        
        -- Update all but the first variant (oldest by created_at) with suffix
        FOR variant_record IN 
            SELECT id, variant_name
            FROM product_variants
            WHERE product_id = dup_record.product_id
              AND LOWER(TRIM(variant_name)) = dup_record.variant_name_lower
            ORDER BY created_at ASC
        LOOP
            IF counter = 0 THEN
                -- Keep the first one (oldest)
                counter := counter + 1;
            ELSE
                -- Append suffix to make it unique
                new_variant_name := base_variant_name || ' (Duplicate ' || counter || ')';
                
                UPDATE product_variants
                SET 
                    variant_name = new_variant_name,
                    updated_at = NOW()
                WHERE id = variant_record.id;
                
                counter := counter + 1;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- STEP 8: FIX DUPLICATE ATTRIBUTE COMBINATIONS PER PRODUCT
-- ============================================
-- For duplicate attribute combinations, modify one attribute (preferably size or color) to make them unique
DO $$
DECLARE
    dup_record RECORD;
    variant_record RECORD;
    current_size TEXT;
    current_color TEXT;
    new_size TEXT;
    new_color TEXT;
    counter INTEGER;
BEGIN
    -- Loop through each duplicate attribute combination group per product
    FOR dup_record IN 
        SELECT 
            product_id,
            COALESCE(LOWER(TRIM(size)), 'n/a') as size_normalized,
            COALESCE(LOWER(TRIM(color)), 'n/a') as color_normalized,
            COALESCE(LOWER(TRIM(weight)), 'n/a') as weight_normalized,
            COALESCE(LOWER(TRIM(grip)), 'n/a') as grip_normalized,
            COALESCE(LOWER(TRIM(material)), 'n/a') as material_normalized,
            COUNT(*) as dup_count
        FROM product_variants
        GROUP BY 
            product_id,
            COALESCE(LOWER(TRIM(size)), 'n/a'),
            COALESCE(LOWER(TRIM(color)), 'n/a'),
            COALESCE(LOWER(TRIM(weight)), 'n/a'),
            COALESCE(LOWER(TRIM(grip)), 'n/a'),
            COALESCE(LOWER(TRIM(material)), 'n/a')
        HAVING COUNT(*) > 1
    LOOP
        counter := 0;
        
        -- Update all but the first variant (oldest by created_at)
        FOR variant_record IN 
            SELECT id, size, color
            FROM product_variants
            WHERE product_id = dup_record.product_id
              AND COALESCE(LOWER(TRIM(size)), 'n/a') = dup_record.size_normalized
              AND COALESCE(LOWER(TRIM(color)), 'n/a') = dup_record.color_normalized
              AND COALESCE(LOWER(TRIM(weight)), 'n/a') = dup_record.weight_normalized
              AND COALESCE(LOWER(TRIM(grip)), 'n/a') = dup_record.grip_normalized
              AND COALESCE(LOWER(TRIM(material)), 'n/a') = dup_record.material_normalized
            ORDER BY created_at ASC
        LOOP
            IF counter = 0 THEN
                -- Keep the first one (oldest)
                counter := counter + 1;
            ELSE
                -- Get current values
                current_size := variant_record.size;
                current_color := variant_record.color;
                
                -- Modify size or color to make combination unique
                -- Prefer modifying size if it's 'N/A', otherwise modify color
                IF COALESCE(current_size, 'N/A') = 'N/A' OR LOWER(TRIM(COALESCE(current_size, ''))) = 'n/a' THEN
                    new_size := 'N/A-DUP-' || counter;
                    UPDATE product_variants
                    SET 
                        size = new_size,
                        updated_at = NOW()
                    WHERE id = variant_record.id;
                ELSIF COALESCE(current_color, 'N/A') = 'N/A' OR LOWER(TRIM(COALESCE(current_color, ''))) = 'n/a' THEN
                    new_color := 'N/A-DUP-' || counter;
                    UPDATE product_variants
                    SET 
                        color = new_color,
                        updated_at = NOW()
                    WHERE id = variant_record.id;
                ELSE
                    -- Modify size by appending suffix
                    new_size := COALESCE(current_size, 'N/A') || '-DUP-' || counter;
                    UPDATE product_variants
                    SET 
                        size = new_size,
                        updated_at = NOW()
                    WHERE id = variant_record.id;
                END IF;
                
                counter := counter + 1;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- STEP 9: VERIFICATION QUERIES
-- ============================================
-- Run these queries after fixes to verify no duplicates remain

-- Check for remaining duplicate SKUs
SELECT 
    'Remaining duplicate SKUs:' as check_type,
    COUNT(*) as violation_count
FROM (
    SELECT UPPER(sku) as sku_upper
    FROM product_variants
    WHERE sku IS NOT NULL AND sku != ''
    GROUP BY UPPER(sku)
    HAVING COUNT(*) > 1
) duplicates;

-- Check for remaining duplicate barcodes
SELECT 
    'Remaining duplicate barcodes:' as check_type,
    COUNT(*) as violation_count
FROM (
    SELECT barcode
    FROM product_variants
    WHERE barcode IS NOT NULL AND barcode != ''
    GROUP BY barcode
    HAVING COUNT(*) > 1
) duplicates;

-- Check for remaining duplicate variant names per product
SELECT 
    'Remaining duplicate variant names per product:' as check_type,
    COUNT(*) as violation_count
FROM (
    SELECT product_id, LOWER(TRIM(variant_name)) as variant_name_lower
    FROM product_variants
    WHERE variant_name IS NOT NULL 
      AND variant_name != '' 
      AND LOWER(TRIM(variant_name)) != 'n/a'
    GROUP BY product_id, LOWER(TRIM(variant_name))
    HAVING COUNT(*) > 1
) duplicates;

-- Check for remaining duplicate attribute combinations per product
SELECT 
    'Remaining duplicate attribute combinations per product:' as check_type,
    COUNT(*) as violation_count
FROM (
    SELECT 
        product_id,
        COALESCE(LOWER(TRIM(size)), 'n/a') as size_normalized,
        COALESCE(LOWER(TRIM(color)), 'n/a') as color_normalized,
        COALESCE(LOWER(TRIM(weight)), 'n/a') as weight_normalized,
        COALESCE(LOWER(TRIM(grip)), 'n/a') as grip_normalized,
        COALESCE(LOWER(TRIM(material)), 'n/a') as material_normalized
    FROM product_variants
    GROUP BY 
        product_id,
        COALESCE(LOWER(TRIM(size)), 'n/a'),
        COALESCE(LOWER(TRIM(color)), 'n/a'),
        COALESCE(LOWER(TRIM(weight)), 'n/a'),
        COALESCE(LOWER(TRIM(grip)), 'n/a'),
        COALESCE(LOWER(TRIM(material)), 'n/a')
    HAVING COUNT(*) > 1
) duplicates;

-- ============================================
-- SUMMARY REPORT
-- ============================================
SELECT 
    'Validation Summary' as report_type,
    (SELECT COUNT(*) FROM product_variants) as total_variants,
    (SELECT COUNT(DISTINCT UPPER(sku)) FROM product_variants WHERE sku IS NOT NULL AND sku != '') as unique_skus,
    (SELECT COUNT(DISTINCT barcode) FROM product_variants WHERE barcode IS NOT NULL AND barcode != '') as unique_barcodes,
    (SELECT COUNT(*) FROM (
        SELECT product_id, LOWER(TRIM(variant_name))
        FROM product_variants
        WHERE variant_name IS NOT NULL AND variant_name != '' AND LOWER(TRIM(variant_name)) != 'n/a'
        GROUP BY product_id, LOWER(TRIM(variant_name))
    ) unique_variant_names) as unique_variant_name_combinations,
    (SELECT COUNT(*) FROM (
        SELECT 
            product_id,
            COALESCE(LOWER(TRIM(size)), 'n/a'),
            COALESCE(LOWER(TRIM(color)), 'n/a'),
            COALESCE(LOWER(TRIM(weight)), 'n/a'),
            COALESCE(LOWER(TRIM(grip)), 'n/a'),
            COALESCE(LOWER(TRIM(material)), 'n/a')
        FROM product_variants
        GROUP BY 
            product_id,
            COALESCE(LOWER(TRIM(size)), 'n/a'),
            COALESCE(LOWER(TRIM(color)), 'n/a'),
            COALESCE(LOWER(TRIM(weight)), 'n/a'),
            COALESCE(LOWER(TRIM(grip)), 'n/a'),
            COALESCE(LOWER(TRIM(material)), 'n/a')
    ) unique_combinations) as unique_attribute_combinations;

