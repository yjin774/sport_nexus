-- Set all product variant quantities to 1
-- This updates the current_stock field in product_variants table

UPDATE product_variants
SET current_stock = 1
WHERE current_stock IS NOT NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_variants,
  COUNT(CASE WHEN current_stock = 1 THEN 1 END) as variants_with_quantity_1,
  COUNT(CASE WHEN current_stock != 1 THEN 1 END) as variants_with_other_quantity
FROM product_variants;
