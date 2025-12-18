-- ============================================
-- Insert Malaysia Sport Equipment Products
-- ============================================
-- This script will:
-- 1. Delete all existing products and variants
-- 2. Insert 5 products for EACH active category
-- 3. Each product will have 3 variants with logical values
-- ============================================
-- WARNING: This script will delete ALL existing data in related tables!
-- Make sure you have a backup before running this script.
-- ============================================

-- Step 1: Delete all records from tables that reference product_variants
-- This must be done first due to foreign key constraints
-- Delete in order: child tables first, then parent tables

-- Delete purchase order items (references product_variants)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') THEN
        DELETE FROM purchase_order_items;
        RAISE NOTICE 'Deleted purchase_order_items';
    END IF;
END $$;

-- Delete stock count items (references product_variants)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_count_items') THEN
        DELETE FROM stock_count_items;
        RAISE NOTICE 'Deleted stock_count_items';
    END IF;
END $$;

-- Delete transaction items if exists (references product_variants)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transaction_items') THEN
        DELETE FROM transaction_items;
        RAISE NOTICE 'Deleted transaction_items';
    END IF;
END $$;

-- Delete stock movement if exists (references product_variants)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movement') THEN
        DELETE FROM stock_movement;
        RAISE NOTICE 'Deleted stock_movement';
    END IF;
END $$;

-- Step 2: Delete all existing product variants
DO $$
BEGIN
    DELETE FROM product_variants;
    RAISE NOTICE 'Deleted all product_variants';
END $$;

-- Step 3: Delete all existing products
DO $$
BEGIN
    DELETE FROM products;
    RAISE NOTICE 'Deleted all products';
END $$;

-- Step 4: Insert products and variants for ALL active categories
-- This will loop through all active categories and insert 5 products with 3 variants each

DO $$
DECLARE
    cat_record RECORD;
    prod1_id UUID;
    prod2_id UUID;
    prod3_id UUID;
    prod4_id UUID;
    prod5_id UUID;
    category_counter INTEGER := 0;
    product_counter INTEGER := 0;
    variant_counter INTEGER := 0;
    cat_code_prefix TEXT;
BEGIN
    -- Loop through all active categories
    FOR cat_record IN 
        SELECT id, category_name, category_code
        FROM categories 
        WHERE is_active = true 
        ORDER BY category_name
    LOOP
        category_counter := category_counter + 1;
        -- Generate unique prefix: use category_code if available, otherwise use first 3 chars of name
        -- Always append first 4 chars of category UUID to ensure uniqueness
        IF cat_record.category_code IS NOT NULL AND cat_record.category_code != '' THEN
            cat_code_prefix := UPPER(cat_record.category_code) || UPPER(SUBSTRING(REPLACE(cat_record.id::TEXT, '-', ''), 1, 4));
        ELSE
            -- Generate unique prefix: first 3 chars of category name + first 4 chars of UUID (without dashes)
            cat_code_prefix := UPPER(SUBSTRING(REPLACE(cat_record.category_name, ' ', ''), 1, 3)) || 
                              UPPER(SUBSTRING(REPLACE(cat_record.id::TEXT, '-', ''), 1, 4));
        END IF;
        
        RAISE NOTICE 'Processing category: % (ID: %, Code: %)', cat_record.category_name, cat_record.id, cat_code_prefix;
        
        -- Product 1: Professional Equipment
        INSERT INTO products (product_code, product_name, brand, category_id, description, status, is_taxable, tax_rate, tags)
        VALUES (
            cat_code_prefix || '001', 
            'Professional ' || cat_record.category_name || ' Equipment', 
            'Nike', 
            cat_record.id, 
            'High-performance ' || cat_record.category_name || ' equipment designed for professional athletes', 
            'active', 
            true, 
            6.00, 
            ARRAY[LOWER(REPLACE(cat_record.category_name, ' ', '_')), 'nike', 'professional']
        )
        RETURNING id INTO prod1_id;
        product_counter := product_counter + 1;
        
        INSERT INTO product_variants (product_id, sku, variant_name, size, color, cost_price, selling_price, current_stock, reorder_level, reorder_quantity, unit_of_measure, status)
        VALUES 
            (prod1_id, cat_code_prefix || '001-BLK-M', 'Black Medium', 'Medium', 'Black', 150.00, 269.00, 1, 1, 1, 'pcs', 'active'),
            (prod1_id, cat_code_prefix || '001-WHT-M', 'White Medium', 'Medium', 'White', 150.00, 269.00, 1, 1, 1, 'pcs', 'active'),
            (prod1_id, cat_code_prefix || '001-BLK-L', 'Black Large', 'Large', 'Black', 160.00, 289.00, 1, 1, 1, 'pcs', 'active');
        variant_counter := variant_counter + 3;
        
        -- Product 2: Premium Gear
        INSERT INTO products (product_code, product_name, brand, category_id, description, status, is_taxable, tax_rate, tags)
        VALUES (
            cat_code_prefix || '002', 
            'Premium ' || cat_record.category_name || ' Gear', 
            'Adidas', 
            cat_record.id, 
            'Premium quality ' || cat_record.category_name || ' gear with advanced technology and superior materials', 
            'active', 
            true, 
            6.00, 
            ARRAY[LOWER(REPLACE(cat_record.category_name, ' ', '_')), 'adidas', 'premium']
        )
        RETURNING id INTO prod2_id;
        product_counter := product_counter + 1;
        
        INSERT INTO product_variants (product_id, sku, variant_name, size, color, cost_price, selling_price, current_stock, reorder_level, reorder_quantity, unit_of_measure, status)
        VALUES 
            (prod2_id, cat_code_prefix || '002-BLU-M', 'Blue Medium', 'Medium', 'Blue', 180.00, 329.00, 1, 1, 1, 'pcs', 'active'),
            (prod2_id, cat_code_prefix || '002-RED-L', 'Red Large', 'Large', 'Red', 180.00, 329.00, 1, 1, 1, 'pcs', 'active'),
            (prod2_id, cat_code_prefix || '002-BLK-M', 'Black Medium', 'Medium', 'Black', 180.00, 329.00, 1, 1, 1, 'pcs', 'active');
        variant_counter := variant_counter + 3;
        
        -- Product 3: Training Equipment
        INSERT INTO products (product_code, product_name, brand, category_id, description, status, is_taxable, tax_rate, tags)
        VALUES (
            cat_code_prefix || '003', 
            'Training ' || cat_record.category_name || ' Equipment', 
            'Puma', 
            cat_record.id, 
            'Durable and reliable training equipment for ' || cat_record.category_name || ' practice sessions', 
            'active', 
            true, 
            6.00, 
            ARRAY[LOWER(REPLACE(cat_record.category_name, ' ', '_')), 'puma', 'training']
        )
        RETURNING id INTO prod3_id;
        product_counter := product_counter + 1;
        
        INSERT INTO product_variants (product_id, sku, variant_name, size, color, cost_price, selling_price, current_stock, reorder_level, reorder_quantity, unit_of_measure, status)
        VALUES 
            (prod3_id, cat_code_prefix || '003-GRN-S', 'Green Small', 'Small', 'Green', 95.00, 179.00, 1, 1, 1, 'pcs', 'active'),
            (prod3_id, cat_code_prefix || '003-YLW-M', 'Yellow Medium', 'Medium', 'Yellow', 95.00, 179.00, 1, 1, 1, 'pcs', 'active'),
            (prod3_id, cat_code_prefix || '003-ORG-L', 'Orange Large', 'Large', 'Orange', 105.00, 199.00, 1, 1, 1, 'pcs', 'active');
        variant_counter := variant_counter + 3;
        
        -- Product 4: Competition Kit
        INSERT INTO products (product_code, product_name, brand, category_id, description, status, is_taxable, tax_rate, tags)
        VALUES (
            cat_code_prefix || '004', 
            'Competition ' || cat_record.category_name || ' Kit', 
            'Wilson', 
            cat_record.id, 
            'Professional competition kit designed for ' || cat_record.category_name || ' tournaments and matches', 
            'active', 
            true, 
            6.00, 
            ARRAY[LOWER(REPLACE(cat_record.category_name, ' ', '_')), 'wilson', 'competition']
        )
        RETURNING id INTO prod4_id;
        product_counter := product_counter + 1;
        
        INSERT INTO product_variants (product_id, sku, variant_name, size, color, cost_price, selling_price, current_stock, reorder_level, reorder_quantity, unit_of_measure, status)
        VALUES 
            (prod4_id, cat_code_prefix || '004-NVY-STD', 'Navy Standard', 'Standard', 'Navy', 200.00, 379.00, 1, 1, 1, 'pcs', 'active'),
            (prod4_id, cat_code_prefix || '004-GRY-STD', 'Gray Standard', 'Standard', 'Gray', 200.00, 379.00, 1, 1, 1, 'pcs', 'active'),
            (prod4_id, cat_code_prefix || '004-NVY-L', 'Navy Large', 'Large', 'Navy', 210.00, 399.00, 1, 1, 1, 'pcs', 'active');
        variant_counter := variant_counter + 3;
        
        -- Product 5: Essential Accessories
        INSERT INTO products (product_code, product_name, brand, category_id, description, status, is_taxable, tax_rate, tags)
        VALUES (
            cat_code_prefix || '005', 
            'Essential ' || cat_record.category_name || ' Accessories', 
            'Generic', 
            cat_record.id, 
            'Essential accessories and equipment for ' || cat_record.category_name || ' activities and training', 
            'active', 
            true, 
            6.00, 
            ARRAY[LOWER(REPLACE(cat_record.category_name, ' ', '_')), 'accessories', 'essential']
        )
        RETURNING id INTO prod5_id;
        product_counter := product_counter + 1;
        
        INSERT INTO product_variants (product_id, sku, variant_name, size, color, cost_price, selling_price, current_stock, reorder_level, reorder_quantity, unit_of_measure, status)
        VALUES 
            (prod5_id, cat_code_prefix || '005-BLK-OS', 'Black One Size', 'One Size', 'Black', 55.00, 109.00, 1, 1, 1, 'pcs', 'active'),
            (prod5_id, cat_code_prefix || '005-WHT-OS', 'White One Size', 'One Size', 'White', 55.00, 109.00, 1, 1, 1, 'pcs', 'active'),
            (prod5_id, cat_code_prefix || '005-MLT-OS', 'Multi One Size', 'One Size', 'Multi', 60.00, 119.00, 1, 1, 1, 'pcs', 'active');
        variant_counter := variant_counter + 3;
        
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Insertion completed successfully!';
    RAISE NOTICE 'Categories processed: %', category_counter;
    RAISE NOTICE 'Products inserted: %', product_counter;
    RAISE NOTICE 'Variants inserted: %', variant_counter;
    RAISE NOTICE '========================================';
END $$;

-- Final verification
DO $$
DECLARE
    total_products INTEGER;
    total_variants INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_products FROM products;
    SELECT COUNT(*) INTO total_variants FROM product_variants;
    
    RAISE NOTICE 'Final count - Products: %, Variants: %', total_products, total_variants;
END $$;
