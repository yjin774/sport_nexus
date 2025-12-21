-- ============================================
-- DATA QUALITY FIXES
-- Based on analysis of products and product_variants tables
-- ============================================

-- ============================================
-- CRITICAL FIX 1: Fix Negative Stock Levels
-- ============================================
-- Set negative stock values to 0
UPDATE product_variants 
SET current_stock = 0,
    updated_at = NOW()
WHERE current_stock < 0;

-- Verify fix
SELECT id, sku, current_stock 
FROM product_variants 
WHERE current_stock < 0;
-- Should return 0 rows

-- ============================================
-- CRITICAL FIX 2: Fix Pricing Logic Error
-- ============================================
-- Fix variants where selling_price < cost_price
-- Option 1: Set selling_price to cost_price * 1.2 (20% markup minimum)
UPDATE product_variants 
SET selling_price = ROUND(cost_price * 1.2, 2),
    updated_at = NOW()
WHERE selling_price < cost_price 
  AND cost_price > 0
  AND selling_price > 0;

-- Option 2: If you want to set selling_price = cost_price (no profit)
-- UPDATE product_variants 
-- SET selling_price = cost_price,
--     updated_at = NOW()
-- WHERE selling_price < cost_price 
--   AND cost_price > 0
--   AND selling_price > 0;

-- Verify fix
SELECT id, sku, cost_price, selling_price 
FROM product_variants 
WHERE selling_price < cost_price AND cost_price > 0;
-- Should return 0 rows (or only rows where cost_price = 0)

-- ============================================
-- CRITICAL FIX 3: Generate Missing QR Codes
-- ============================================
-- Generate QR codes from variant IDs (remove hyphens)
UPDATE product_variants 
SET qr_code = REPLACE(id::text, '-', ''),
    updated_at = NOW()
WHERE qr_code IS NULL OR qr_code = '';

-- Verify fix
SELECT id, sku, qr_code 
FROM product_variants 
WHERE qr_code IS NULL OR qr_code = '';
-- Should return 0 rows

-- ============================================
-- MODERATE FIX 1: Standardize Case Formatting
-- ============================================
-- Fix variant names to Title Case
UPDATE product_variants 
SET variant_name = INITCAP(LOWER(variant_name)),
    updated_at = NOW()
WHERE variant_name != INITCAP(LOWER(variant_name))
  AND variant_name != 'N/A';

-- Fix color to Title Case
UPDATE product_variants 
SET color = INITCAP(LOWER(color)),
    updated_at = NOW()
WHERE color != INITCAP(LOWER(color))
  AND color != 'N/A'
  AND color IS NOT NULL;

-- Fix size to Title Case (for text sizes)
UPDATE product_variants 
SET size = INITCAP(LOWER(size)),
    updated_at = NOW()
WHERE size != INITCAP(LOWER(size))
  AND size != 'N/A'
  AND size IS NOT NULL
  AND size !~ '^[0-9]+$'; -- Don't change numeric sizes

-- ============================================
-- MODERATE FIX 2: Standardize SKU Formatting
-- ============================================
-- Fix SKUs to uppercase (if needed)
UPDATE product_variants 
SET sku = UPPER(sku),
    updated_at = NOW()
WHERE sku != UPPER(sku);

-- ============================================
-- MODERATE FIX 3: Fix Brand Mismatch
-- ============================================
-- Fix product where name says "Puma" but brand is "Wilson"
-- Option: Update brand to match product name
UPDATE products 
SET brand = 'Puma',
    updated_at = NOW()
WHERE id = '926afafe-777e-4c51-bf23-274bd257664e'
  AND product_name LIKE '%Puma%'
  AND brand = 'Wilson';

-- OR update product name to match brand
-- UPDATE products 
-- SET product_name = 'Wilson Moisture-Wicking Shirt',
--     updated_at = NOW()
-- WHERE id = '926afafe-777e-4c51-bf23-274bd257664e'
--   AND product_name LIKE '%Puma%'
--   AND brand = 'Wilson';

-- ============================================
-- MODERATE FIX 4: Assign Missing Category
-- ============================================
-- Assign category to product without category
-- You need to determine the correct category_id for "Yonex Premium PU Super Grip"
-- This is likely an "Accessories" category
-- Example (update with correct category_id):
-- UPDATE products 
-- SET category_id = 'YOUR_ACCESSORIES_CATEGORY_ID',
--     updated_at = NOW()
-- WHERE id = '70b0be9c-29e4-4e32-94ab-98cb0b47a88d'
--   AND category_id IS NULL;

-- ============================================
-- ADD DATABASE CONSTRAINTS (Prevent Future Issues)
-- ============================================

-- Constraint 1: Prevent negative stock
ALTER TABLE product_variants 
DROP CONSTRAINT IF EXISTS check_stock_non_negative;

ALTER TABLE product_variants 
ADD CONSTRAINT check_stock_non_negative 
CHECK (current_stock >= 0);

-- Constraint 2: Ensure selling_price >= cost_price (when both are > 0)
ALTER TABLE product_variants 
DROP CONSTRAINT IF EXISTS check_selling_price_valid;

ALTER TABLE product_variants 
ADD CONSTRAINT check_selling_price_valid 
CHECK (
  (cost_price = 0 AND selling_price >= 0) OR
  (cost_price > 0 AND selling_price >= cost_price) OR
  (selling_price = 0)
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check for remaining negative stock
SELECT COUNT(*) as negative_stock_count
FROM product_variants 
WHERE current_stock < 0;
-- Should be 0

-- Check for remaining pricing errors
SELECT COUNT(*) as pricing_error_count
FROM product_variants 
WHERE selling_price < cost_price 
  AND cost_price > 0 
  AND selling_price > 0;
-- Should be 0

-- Check for missing QR codes
SELECT COUNT(*) as missing_qr_count
FROM product_variants 
WHERE qr_code IS NULL OR qr_code = '';
-- Should be 0

-- Check for products without categories
SELECT COUNT(*) as products_without_category
FROM products 
WHERE category_id IS NULL;
-- Review and fix manually

-- Check for case inconsistencies (variant names)
SELECT COUNT(*) as case_inconsistencies
FROM product_variants 
WHERE variant_name != INITCAP(LOWER(variant_name))
  AND variant_name != 'N/A';
-- Should be 0 after fix

-- ============================================
-- DATA QUALITY REPORT QUERY
-- ============================================

-- Generate a data quality report
SELECT 
  'Negative Stock' as issue_type,
  COUNT(*) as count
FROM product_variants 
WHERE current_stock < 0

UNION ALL

SELECT 
  'Pricing Error (selling < cost)' as issue_type,
  COUNT(*) as count
FROM product_variants 
WHERE selling_price < cost_price 
  AND cost_price > 0 
  AND selling_price > 0

UNION ALL

SELECT 
  'Missing QR Codes' as issue_type,
  COUNT(*) as count
FROM product_variants 
WHERE qr_code IS NULL OR qr_code = ''

UNION ALL

SELECT 
  'Products Without Category' as issue_type,
  COUNT(*) as count
FROM products 
WHERE category_id IS NULL

UNION ALL

SELECT 
  'Default Variants (N/A values)' as issue_type,
  COUNT(*) as count
FROM product_variants 
WHERE variant_name = 'N/A' 
  AND size = 'N/A' 
  AND color = 'N/A';

-- ============================================
-- NOTES
-- ============================================
-- 1. Run these fixes in a transaction for safety
-- 2. Test in development environment first
-- 3. Backup database before running
-- 4. Review each fix before applying
-- 5. Some fixes may need manual review (e.g., category assignment)
-- 6. Constraints will prevent future data quality issues

