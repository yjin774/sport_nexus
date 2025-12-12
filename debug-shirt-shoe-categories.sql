-- ============================================
-- DEBUG QUERIES FOR SHIRT AND SHOE CATEGORIES
-- ============================================

-- 1. Check all categories to see how "shirt" and "shoe" are stored
--    (checking for case variations and exact names)
SELECT 
  id,
  category_code,
  category_name,
  LOWER(category_name) AS category_name_lower,
  is_active,
  created_at
FROM categories
WHERE LOWER(category_name) LIKE '%shirt%' 
   OR LOWER(category_name) LIKE '%shoe%'
   OR LOWER(category_name) LIKE '%shoes%'
ORDER BY category_name;

-- 2. Get all categories (to see the full list)
SELECT 
  id,
  category_code,
  category_name,
  is_active,
  created_at
FROM categories
ORDER BY category_name;

-- 3. Get all products in shirt and shoe categories with full details
SELECT 
  p.id,
  p.product_code,
  p.product_name,
  p.brand,
  p.category_id,
  c.category_name,
  c.category_code,
  p.image_url,
  p.image_urls,
  p.status AS product_status,
  p.description,
  p.created_at,
  p.updated_at,
  -- Check if image_url is null or empty
  CASE 
    WHEN p.image_url IS NULL OR p.image_url = '' THEN 'NO IMAGE URL'
    WHEN p.image_url LIKE 'http%' THEN 'FULL URL (Supabase Storage)'
    WHEN p.image_url LIKE 'image/%' THEN 'RELATIVE PATH (with image/)'
    ELSE 'RELATIVE PATH (without image/)'
  END AS image_url_type
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE LOWER(c.category_name) LIKE '%shirt%' 
   OR LOWER(c.category_name) LIKE '%shoe%'
   OR LOWER(c.category_name) LIKE '%shoes%'
   OR c.id IN (
     SELECT id FROM categories 
     WHERE LOWER(category_name) LIKE '%shirt%' 
        OR LOWER(category_name) LIKE '%shoe%'
        OR LOWER(category_name) LIKE '%shoes%'
   )
ORDER BY c.category_name, p.product_name;

-- 4. Get products with their variants and stock for shirt/shoe categories
SELECT 
  p.id AS product_id,
  p.product_code,
  p.product_name,
  c.category_name,
  p.image_url,
  p.status AS product_status,
  pv.id AS variant_id,
  pv.sku,
  pv.current_stock,
  pv.selling_price,
  pv.status AS variant_status,
  -- Calculate total stock per product
  SUM(pv.current_stock) OVER (PARTITION BY p.id) AS total_stock_per_product
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE LOWER(c.category_name) LIKE '%shirt%' 
   OR LOWER(c.category_name) LIKE '%shoe%'
   OR LOWER(c.category_name) LIKE '%shoes%'
ORDER BY c.category_name, p.product_name, pv.sku;

-- 5. Check for products with NULL or invalid category_id
SELECT 
  p.id,
  p.product_code,
  p.product_name,
  p.category_id,
  p.image_url,
  p.status,
  CASE 
    WHEN p.category_id IS NULL THEN 'NULL category_id'
    WHEN c.id IS NULL THEN 'INVALID category_id (orphaned)'
    ELSE 'VALID category_id'
  END AS category_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id IS NULL 
   OR c.id IS NULL
ORDER BY p.product_name;

-- 6. Summary: Count products by category (including shirt/shoe)
SELECT 
  c.category_name,
  c.category_code,
  COUNT(p.id) AS product_count,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) AS active_products,
  COUNT(CASE WHEN p.image_url IS NOT NULL AND p.image_url != '' THEN 1 END) AS products_with_images,
  COUNT(CASE WHEN p.image_url IS NULL OR p.image_url = '' THEN 1 END) AS products_without_images
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.category_name, c.category_code
HAVING LOWER(c.category_name) LIKE '%shirt%' 
    OR LOWER(c.category_name) LIKE '%shoe%'
    OR LOWER(c.category_name) LIKE '%shoes%'
    OR COUNT(p.id) > 0
ORDER BY c.category_name;

-- 7. Detailed image URL analysis for shirt/shoe products
SELECT 
  p.id,
  p.product_code,
  p.product_name,
  c.category_name,
  p.image_url,
  p.image_urls,
  -- Image URL analysis
  CASE 
    WHEN p.image_url IS NULL THEN 'NULL'
    WHEN p.image_url = '' THEN 'EMPTY STRING'
    WHEN p.image_url LIKE 'http://%' OR p.image_url LIKE 'https://%' THEN 'FULL URL'
    WHEN p.image_url LIKE 'image/%' THEN 'RELATIVE (has image/ prefix)'
    WHEN p.image_url LIKE '%.png' OR p.image_url LIKE '%.jpg' OR p.image_url LIKE '%.jpeg' THEN 'FILENAME ONLY'
    ELSE 'OTHER FORMAT'
  END AS image_url_format,
  LENGTH(p.image_url) AS image_url_length,
  p.status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE LOWER(c.category_name) LIKE '%shirt%' 
   OR LOWER(c.category_name) LIKE '%shoe%'
   OR LOWER(c.category_name) LIKE '%shoes%'
ORDER BY c.category_name, p.product_name;

-- 8. Check product variants stock for shirt/shoe products
SELECT 
  p.id AS product_id,
  p.product_code,
  p.product_name,
  c.category_name,
  COUNT(pv.id) AS variant_count,
  SUM(pv.current_stock) AS total_stock,
  MIN(pv.current_stock) AS min_stock,
  MAX(pv.current_stock) AS max_stock,
  COUNT(CASE WHEN pv.status = 'active' THEN 1 END) AS active_variants
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE LOWER(c.category_name) LIKE '%shirt%' 
   OR LOWER(c.category_name) LIKE '%shoe%'
   OR LOWER(c.category_name) LIKE '%shoes%'
GROUP BY p.id, p.product_code, p.product_name, c.category_name
ORDER BY c.category_name, p.product_name;

-- 9. Check if there are any products that should be in shirt/shoe but aren't displaying
--    (products with status = 'active' and valid category)
SELECT 
  p.id,
  p.product_code,
  p.product_name,
  c.category_name,
  p.status,
  p.image_url,
  CASE 
    WHEN p.status != 'active' THEN 'INACTIVE STATUS'
    WHEN p.category_id IS NULL THEN 'NO CATEGORY'
    WHEN c.id IS NULL THEN 'INVALID CATEGORY'
    WHEN p.image_url IS NULL OR p.image_url = '' THEN 'NO IMAGE'
    ELSE 'SHOULD DISPLAY'
  END AS display_issue
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE (LOWER(c.category_name) LIKE '%shirt%' 
    OR LOWER(c.category_name) LIKE '%shoe%'
    OR LOWER(c.category_name) LIKE '%shoes%')
   AND (p.status != 'active' 
    OR p.category_id IS NULL 
    OR c.id IS NULL)
ORDER BY c.category_name, p.product_name;

-- 10. Check for type mismatch issues - compare category_id types
SELECT 
  'Categories' AS table_name,
  id,
  category_name,
  pg_typeof(id) AS id_type
FROM categories
WHERE LOWER(category_name) LIKE '%shirt%' 
   OR LOWER(category_name) LIKE '%shoe%'
   OR LOWER(category_name) LIKE '%shoes%'
UNION ALL
SELECT 
  'Products' AS table_name,
  category_id AS id,
  product_name,
  pg_typeof(category_id) AS id_type
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE LOWER(c.category_name) LIKE '%shirt%' 
   OR LOWER(c.category_name) LIKE '%shoe%'
   OR LOWER(c.category_name) LIKE '%shoes%'
LIMIT 20;

-- 11. Check exact category_id values for shirt/shoe products (to compare with filter)
SELECT 
  p.id AS product_id,
  p.product_code,
  p.product_name,
  p.category_id,
  c.id AS category_table_id,
  c.category_name,
  c.category_code,
  -- Check if category_id matches category.id exactly
  CASE 
    WHEN p.category_id = c.id THEN 'MATCH'
    WHEN p.category_id IS NULL THEN 'NULL category_id'
    WHEN c.id IS NULL THEN 'NO MATCHING CATEGORY'
    ELSE 'MISMATCH'
  END AS id_match_status,
  -- Convert to string for comparison
  p.category_id::text AS category_id_text,
  c.id::text AS category_id_text_from_categories
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE LOWER(c.category_name) LIKE '%shirt%' 
   OR LOWER(c.category_name) LIKE '%shoe%'
   OR LOWER(c.category_name) LIKE '%shoes%'
ORDER BY c.category_name, p.product_name;
