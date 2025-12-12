-- ============================================
-- PRODUCTS AND PRODUCT VARIANTS INSPECTION QUERIES
-- ============================================

-- 1. View all products
SELECT 
  id,
  product_code,
  product_name,
  brand,
  category_id,
  status,
  image_url,
  created_at,
  updated_at
FROM products
ORDER BY created_at DESC;

-- 2. View all product variants
SELECT 
  id,
  product_id,
  sku,
  barcode,
  variant_name,
  size,
  color,
  cost_price,
  selling_price,
  current_stock,
  status,
  created_at,
  updated_at
FROM product_variants
ORDER BY created_at DESC;

-- 3. View products with their variants (JOIN)
SELECT 
  p.id AS product_id,
  p.product_code,
  p.product_name,
  p.brand,
  p.status AS product_status,
  pv.id AS variant_id,
  pv.sku,
  pv.barcode,
  pv.variant_name,
  pv.size,
  pv.color,
  pv.cost_price,
  pv.selling_price,
  pv.current_stock,
  pv.status AS variant_status
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
ORDER BY p.created_at DESC, pv.created_at ASC;

-- 4. Count variants per product
SELECT 
  p.id,
  p.product_code,
  p.product_name,
  COUNT(pv.id) AS variant_count
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.product_code, p.product_name
ORDER BY variant_count DESC, p.product_name;

-- 5. Products without any variants
SELECT 
  p.id,
  p.product_code,
  p.product_name,
  p.brand,
  p.status,
  p.created_at
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.id IS NULL
ORDER BY p.created_at DESC;

-- 6. Variants without valid product (orphaned variants - should not exist)
SELECT 
  pv.id,
  pv.product_id,
  pv.sku,
  pv.variant_name,
  pv.status
FROM product_variants pv
LEFT JOIN products p ON pv.product_id = p.id
WHERE p.id IS NULL;

-- 7. Products with default variants (variants with 'DEFAULT' in SKU)
SELECT 
  p.id AS product_id,
  p.product_code,
  p.product_name,
  pv.id AS variant_id,
  pv.sku,
  pv.variant_name,
  pv.cost_price,
  pv.selling_price,
  pv.status
FROM products p
INNER JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.sku LIKE '%-DEFAULT-%'
ORDER BY p.created_at DESC;

-- 8. Variants with empty or null values (checking for incomplete data)
SELECT 
  pv.id,
  pv.product_id,
  p.product_name,
  pv.sku,
  pv.variant_name,
  pv.size,
  pv.color,
  pv.cost_price,
  pv.selling_price,
  CASE 
    WHEN pv.variant_name = 'N/A' OR pv.variant_name IS NULL THEN 'Missing variant name'
    WHEN pv.size = 'N/A' OR pv.size IS NULL THEN 'Missing size'
    WHEN pv.color = 'N/A' OR pv.color IS NULL THEN 'Missing color'
    WHEN pv.cost_price = 0 THEN 'Zero cost price'
    WHEN pv.selling_price = 0 THEN 'Zero selling price'
    ELSE 'OK'
  END AS data_status
FROM product_variants pv
INNER JOIN products p ON pv.product_id = p.id
WHERE 
  (pv.variant_name = 'N/A' OR pv.variant_name IS NULL)
  OR (pv.size = 'N/A' OR pv.size IS NULL)
  OR (pv.color = 'N/A' OR pv.color IS NULL)
  OR pv.cost_price = 0
  OR pv.selling_price = 0
ORDER BY p.product_name, pv.sku;

-- 9. Summary statistics
SELECT 
  (SELECT COUNT(*) FROM products) AS total_products,
  (SELECT COUNT(*) FROM product_variants) AS total_variants,
  (SELECT COUNT(*) FROM products WHERE status = 'active') AS active_products,
  (SELECT COUNT(*) FROM product_variants WHERE status = 'active') AS active_variants,
  (SELECT COUNT(*) FROM products p 
   LEFT JOIN product_variants pv ON p.id = pv.product_id 
   WHERE pv.id IS NULL) AS products_without_variants,
  (SELECT AVG(variant_count) FROM (
    SELECT COUNT(pv.id) AS variant_count
    FROM products p
    LEFT JOIN product_variants pv ON p.id = pv.product_id
    GROUP BY p.id
  ) AS counts) AS avg_variants_per_product;

-- 10. Recent products and their variants (last 10 products)
SELECT 
  p.id AS product_id,
  p.product_code,
  p.product_name,
  p.brand,
  p.created_at AS product_created,
  pv.id AS variant_id,
  pv.sku,
  pv.variant_name,
  pv.cost_price,
  pv.selling_price,
  pv.current_stock,
  pv.created_at AS variant_created
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.created_at >= NOW() - INTERVAL '30 days'
ORDER BY p.created_at DESC, pv.created_at ASC
LIMIT 50;

-- 11. Check for duplicate SKUs (should not exist)
SELECT 
  sku,
  COUNT(*) AS duplicate_count,
  STRING_AGG(id::text, ', ') AS variant_ids
FROM product_variants
GROUP BY sku
HAVING COUNT(*) > 1;

-- 12. Check for duplicate barcodes (excluding nulls)
SELECT 
  barcode,
  COUNT(*) AS duplicate_count,
  STRING_AGG(id::text, ', ') AS variant_ids
FROM product_variants
WHERE barcode IS NOT NULL
GROUP BY barcode
HAVING COUNT(*) > 1;

-- 13. Products with categories
SELECT 
  p.id,
  p.product_code,
  p.product_name,
  p.brand,
  c.category_name,
  c.category_code,
  p.status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY c.category_name, p.product_name;

-- 14. Variants with stock information
SELECT 
  p.product_code,
  p.product_name,
  pv.sku,
  pv.variant_name,
  pv.current_stock,
  pv.reorder_level,
  pv.max_stock,
  CASE 
    WHEN pv.current_stock <= pv.reorder_level THEN 'Low Stock'
    WHEN pv.max_stock IS NOT NULL AND pv.current_stock >= pv.max_stock THEN 'At Max'
    ELSE 'OK'
  END AS stock_status
FROM product_variants pv
INNER JOIN products p ON pv.product_id = p.id
ORDER BY p.product_name, pv.variant_name;

-- 15. Variants with pricing information
SELECT 
  p.product_code,
  p.product_name,
  pv.sku,
  pv.variant_name,
  pv.cost_price,
  pv.selling_price,
  pv.discount_price,
  pv.min_selling_price,
  CASE 
    WHEN pv.discount_price IS NOT NULL THEN pv.discount_price
    ELSE pv.selling_price
  END AS current_price,
  (pv.selling_price - pv.cost_price) AS profit_margin,
  ROUND(((pv.selling_price - pv.cost_price) / NULLIF(pv.selling_price, 0)) * 100, 2) AS profit_margin_percent
FROM product_variants pv
INNER JOIN products p ON pv.product_id = p.id
WHERE pv.cost_price > 0 AND pv.selling_price > 0
ORDER BY profit_margin_percent DESC;

-- ============================================
-- CATEGORIES TABLE INSPECTION QUERIES
-- ============================================

-- 16. View all categories
SELECT 
  id,
  category_code,
  category_name,
  parent_category_id,
  description,
  image_url,
  display_order,
  is_active,
  created_at,
  updated_at
FROM categories
ORDER BY display_order, category_name;

-- 17. Categories with their parent categories (hierarchical view)
SELECT 
  c.id,
  c.category_code,
  c.category_name,
  c.parent_category_id,
  parent.category_name AS parent_category_name,
  parent.category_code AS parent_category_code,
  c.is_active,
  c.display_order
FROM categories c
LEFT JOIN categories parent ON c.parent_category_id = parent.id
ORDER BY c.display_order, c.category_name;

-- 18. Categories with product count
SELECT 
  c.id,
  c.category_code,
  c.category_name,
  c.is_active,
  COUNT(p.id) AS product_count,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) AS active_products,
  COUNT(CASE WHEN p.status = 'inactive' THEN 1 END) AS inactive_products
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.category_code, c.category_name, c.is_active
ORDER BY product_count DESC, c.category_name;

-- 19. Categories without any products
SELECT 
  c.id,
  c.category_code,
  c.category_name,
  c.description,
  c.is_active,
  c.created_at
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
WHERE p.id IS NULL
ORDER BY c.created_at DESC;

-- 20. Products without categories
SELECT 
  p.id,
  p.product_code,
  p.product_name,
  p.brand,
  p.status,
  p.created_at
FROM products p
WHERE p.category_id IS NULL
ORDER BY p.created_at DESC;

-- 21. Categories with subcategories (parent categories)
SELECT 
  parent.id,
  parent.category_code,
  parent.category_name,
  parent.is_active,
  COUNT(child.id) AS subcategory_count,
  STRING_AGG(child.category_name, ', ' ORDER BY child.display_order) AS subcategories
FROM categories parent
LEFT JOIN categories child ON parent.id = child.parent_category_id
WHERE child.id IS NOT NULL
GROUP BY parent.id, parent.category_code, parent.category_name, parent.is_active
ORDER BY subcategory_count DESC, parent.category_name;

-- 22. Subcategories (categories with parent)
SELECT 
  child.id,
  child.category_code,
  child.category_name,
  child.parent_category_id,
  parent.category_name AS parent_category_name,
  child.is_active,
  child.display_order
FROM categories child
INNER JOIN categories parent ON child.parent_category_id = parent.id
ORDER BY parent.category_name, child.display_order, child.category_name;

-- 23. Top-level categories (categories without parent)
SELECT 
  id,
  category_code,
  category_name,
  description,
  is_active,
  display_order,
  created_at
FROM categories
WHERE parent_category_id IS NULL
ORDER BY display_order, category_name;

-- 24. Category hierarchy tree (all levels)
WITH RECURSIVE category_tree AS (
  -- Base case: top-level categories
  SELECT 
    id,
    category_code,
    category_name,
    parent_category_id,
    is_active,
    display_order,
    0 AS level,
    category_name::text AS path
  FROM categories
  WHERE parent_category_id IS NULL
  
  UNION ALL
  
  -- Recursive case: subcategories
  SELECT 
    c.id,
    c.category_code,
    c.category_name,
    c.parent_category_id,
    c.is_active,
    c.display_order,
    ct.level + 1,
    (ct.path || ' > ' || c.category_name)::text AS path
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_category_id = ct.id
)
SELECT 
  id,
  category_code,
  category_name,
  parent_category_id,
  is_active,
  display_order,
  level,
  path,
  REPEAT('  ', level) || category_name AS indented_name
FROM category_tree
ORDER BY path;

-- 25. Active vs Inactive categories summary
SELECT 
  is_active,
  COUNT(*) AS category_count,
  COUNT(CASE WHEN parent_category_id IS NULL THEN 1 END) AS top_level_count,
  COUNT(CASE WHEN parent_category_id IS NOT NULL THEN 1 END) AS subcategory_count
FROM categories
GROUP BY is_active
ORDER BY is_active DESC;

-- 26. Categories with most products (top 10)
SELECT 
  c.id,
  c.category_code,
  c.category_name,
  c.is_active,
  COUNT(p.id) AS total_products,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) AS active_products,
  COUNT(CASE WHEN p.status = 'inactive' THEN 1 END) AS inactive_products,
  COUNT(DISTINCT pv.id) AS total_variants
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY c.id, c.category_code, c.category_name, c.is_active
HAVING COUNT(p.id) > 0
ORDER BY total_products DESC
LIMIT 10;

-- 27. Category statistics with product and variant counts
SELECT 
  c.id,
  c.category_code,
  c.category_name,
  c.is_active,
  COALESCE(product_stats.product_count, 0) AS product_count,
  COALESCE(product_stats.active_product_count, 0) AS active_product_count,
  COALESCE(variant_stats.variant_count, 0) AS variant_count,
  COALESCE(variant_stats.total_stock, 0) AS total_stock,
  COALESCE(variant_stats.avg_price, 0) AS avg_selling_price
FROM categories c
LEFT JOIN (
  SELECT 
    category_id,
    COUNT(*) AS product_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_product_count
  FROM products
  GROUP BY category_id
) product_stats ON c.id = product_stats.category_id
LEFT JOIN (
  SELECT 
    p.category_id,
    COUNT(pv.id) AS variant_count,
    SUM(pv.current_stock) AS total_stock,
    AVG(pv.selling_price) AS avg_price
  FROM product_variants pv
  INNER JOIN products p ON pv.product_id = p.id
  WHERE p.category_id IS NOT NULL
  GROUP BY p.category_id
) variant_stats ON c.id = variant_stats.category_id
ORDER BY product_count DESC, c.category_name;

-- 28. Check for duplicate category codes
SELECT 
  category_code,
  COUNT(*) AS duplicate_count,
  STRING_AGG(id::text, ', ') AS category_ids,
  STRING_AGG(category_name, ', ') AS category_names
FROM categories
GROUP BY category_code
HAVING COUNT(*) > 1;

-- 29. Check for circular category references (categories that reference themselves)
SELECT 
  id,
  category_code,
  category_name,
  parent_category_id
FROM categories
WHERE id = parent_category_id;

-- 30. Categories with products and their variants summary
SELECT 
  c.category_code,
  c.category_name,
  c.is_active AS category_active,
  COUNT(DISTINCT p.id) AS product_count,
  COUNT(DISTINCT pv.id) AS variant_count,
  SUM(pv.current_stock) AS total_stock,
  MIN(pv.selling_price) AS min_price,
  MAX(pv.selling_price) AS max_price,
  AVG(pv.selling_price) AS avg_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY c.id, c.category_code, c.category_name, c.is_active
HAVING COUNT(DISTINCT p.id) > 0
ORDER BY product_count DESC, c.category_name;

