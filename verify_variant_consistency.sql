-- ============================================
-- VERIFICATION SCRIPT: Check Variant Consistency
-- This script verifies that all variants of each product
-- have the exact same active attributes with non-empty values
-- ============================================

-- Check 1: Verify all products have Size and Color active
SELECT 
    product_code,
    product_name,
    active_variant_attributes->>'size' as size_active,
    active_variant_attributes->>'color' as color_active,
    CASE 
        WHEN active_variant_attributes->>'size' IS NULL OR active_variant_attributes->>'size' = '' THEN 'ERROR: Size not active'
        WHEN active_variant_attributes->>'color' IS NULL OR active_variant_attributes->>'color' = '' THEN 'ERROR: Color not active'
        ELSE 'OK'
    END as status
FROM products
WHERE active_variant_attributes->>'size' IS NULL 
   OR active_variant_attributes->>'size' = ''
   OR active_variant_attributes->>'color' IS NULL 
   OR active_variant_attributes->>'color' = '';

-- Check 2: For each product, verify all variants have non-empty values for active attributes
WITH product_attributes AS (
    SELECT 
        p.id as product_id,
        p.product_code,
        p.product_name,
        p.active_variant_attributes,
        CASE WHEN p.active_variant_attributes->>'size' IS NOT NULL 
             AND p.active_variant_attributes->>'size' != '' THEN true ELSE false END as size_active,
        CASE WHEN p.active_variant_attributes->>'color' IS NOT NULL 
             AND p.active_variant_attributes->>'color' != '' THEN true ELSE false END as color_active,
        CASE WHEN p.active_variant_attributes->>'weight' IS NOT NULL 
             AND p.active_variant_attributes->>'weight' != '' THEN true ELSE false END as weight_active,
        CASE WHEN p.active_variant_attributes->>'grip' IS NOT NULL 
             AND p.active_variant_attributes->>'grip' != '' THEN true ELSE false END as grip_active,
        CASE WHEN p.active_variant_attributes->>'material' IS NOT NULL 
             AND p.active_variant_attributes->>'material' != '' THEN true ELSE false END as material_active
    FROM products p
)
SELECT 
    pa.product_code,
    pa.product_name,
    v.sku,
    v.variant_name,
    -- Check size
    CASE 
        WHEN pa.size_active AND (v.size IS NULL OR v.size = '') THEN 'ERROR: Size is active but variant has NULL/empty'
        WHEN NOT pa.size_active AND v.size IS NOT NULL THEN 'ERROR: Size is inactive but variant has value'
        ELSE 'OK'
    END as size_check,
    -- Check color
    CASE 
        WHEN pa.color_active AND (v.color IS NULL OR v.color = '') THEN 'ERROR: Color is active but variant has NULL/empty'
        WHEN NOT pa.color_active AND v.color IS NOT NULL THEN 'ERROR: Color is inactive but variant has value'
        ELSE 'OK'
    END as color_check,
    -- Check weight
    CASE 
        WHEN pa.weight_active AND (v.weight IS NULL OR v.weight = '') THEN 'ERROR: Weight is active but variant has NULL/empty'
        WHEN NOT pa.weight_active AND v.weight IS NOT NULL THEN 'ERROR: Weight is inactive but variant has value'
        ELSE 'OK'
    END as weight_check,
    -- Check grip
    CASE 
        WHEN pa.grip_active AND (v.grip IS NULL OR v.grip = '') THEN 'ERROR: Grip is active but variant has NULL/empty'
        WHEN NOT pa.grip_active AND v.grip IS NOT NULL THEN 'ERROR: Grip is inactive but variant has value'
        ELSE 'OK'
    END as grip_check,
    -- Check material
    CASE 
        WHEN pa.material_active AND (v.material IS NULL OR v.material = '') THEN 'ERROR: Material is active but variant has NULL/empty'
        WHEN NOT pa.material_active AND v.material IS NOT NULL THEN 'ERROR: Material is inactive but variant has value'
        ELSE 'OK'
    END as material_check
FROM product_attributes pa
JOIN product_variants v ON v.product_id = pa.product_id
WHERE 
    -- Find variants with errors
    (pa.size_active AND (v.size IS NULL OR v.size = ''))
    OR (NOT pa.size_active AND v.size IS NOT NULL)
    OR (pa.color_active AND (v.color IS NULL OR v.color = ''))
    OR (NOT pa.color_active AND v.color IS NOT NULL)
    OR (pa.weight_active AND (v.weight IS NULL OR v.weight = ''))
    OR (NOT pa.weight_active AND v.weight IS NOT NULL)
    OR (pa.grip_active AND (v.grip IS NULL OR v.grip = ''))
    OR (NOT pa.grip_active AND v.grip IS NOT NULL)
    OR (pa.material_active AND (v.material IS NULL OR v.material = ''))
    OR (NOT pa.material_active AND v.material IS NOT NULL)
ORDER BY pa.product_code, v.sku;

-- Check 3: Summary - Count variants per product and verify consistency
SELECT 
    p.product_code,
    p.product_name,
    COUNT(v.id) as variant_count,
    -- Count how many variants have each attribute
    COUNT(CASE WHEN v.size IS NOT NULL AND v.size != '' THEN 1 END) as variants_with_size,
    COUNT(CASE WHEN v.color IS NOT NULL AND v.color != '' THEN 1 END) as variants_with_color,
    COUNT(CASE WHEN v.weight IS NOT NULL AND v.weight != '' THEN 1 END) as variants_with_weight,
    COUNT(CASE WHEN v.grip IS NOT NULL AND v.grip != '' THEN 1 END) as variants_with_grip,
    COUNT(CASE WHEN v.material IS NOT NULL AND v.material != '' THEN 1 END) as variants_with_material,
    -- Check if all variants have the same attributes
    CASE 
        WHEN COUNT(CASE WHEN v.size IS NOT NULL AND v.size != '' THEN 1 END) NOT IN (0, COUNT(v.id)) THEN 'INCONSISTENT: Size'
        WHEN COUNT(CASE WHEN v.color IS NOT NULL AND v.color != '' THEN 1 END) NOT IN (0, COUNT(v.id)) THEN 'INCONSISTENT: Color'
        WHEN COUNT(CASE WHEN v.weight IS NOT NULL AND v.weight != '' THEN 1 END) NOT IN (0, COUNT(v.id)) THEN 'INCONSISTENT: Weight'
        WHEN COUNT(CASE WHEN v.grip IS NOT NULL AND v.grip != '' THEN 1 END) NOT IN (0, COUNT(v.id)) THEN 'INCONSISTENT: Grip'
        WHEN COUNT(CASE WHEN v.material IS NOT NULL AND v.material != '' THEN 1 END) NOT IN (0, COUNT(v.id)) THEN 'INCONSISTENT: Material'
        ELSE 'OK'
    END as consistency_status
FROM products p
LEFT JOIN product_variants v ON v.product_id = p.id
GROUP BY p.id, p.product_code, p.product_name
ORDER BY p.product_code;
