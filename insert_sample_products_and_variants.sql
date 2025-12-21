-- ============================================
-- INSERT SAMPLE PRODUCTS AND VARIANTS
-- Based on existing categories in Supabase
-- Creates 3 products per category, each with 3 variants
-- ============================================

-- Note: Replace the UUIDs below with actual generated UUIDs or use gen_random_uuid() in PostgreSQL
-- This script uses placeholder UUIDs that you should replace

-- ============================================
-- CATEGORY 1: SHIRT (Sports Apparel – Tops)
-- Category ID: b08edab6-66a0-4e72-a86e-386dd3572c2b
-- ============================================

-- Product 1: Nike Dri-FIT Training Shirt
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'SHIRT001',
    'Nike Dri-FIT Training Shirt',
    'Nike',
    'b08edab6-66a0-4e72-a86e-386dd3572c2b',
    'Premium moisture-wicking training shirt with Dri-FIT technology. Designed for intense workouts with breathable fabric that keeps you cool and dry.',
    'active',
    true,
    6.00,
    '["training","nike","apparel","moisture-wicking"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

-- Variants for Product 1
INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHIRT001'),
    'SHIRT001-BLK-M',
    'Black Medium',
    'Medium',
    'Black',
    45.00,
    89.99,
    25,
    5,
    10,
    'pcs',
    'Warehouse A',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHIRT001'),
    'SHIRT001-WHT-L',
    'White Large',
    'Large',
    'White',
    45.00,
    89.99,
    20,
    5,
    10,
    'pcs',
    'Warehouse A',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHIRT001'),
    'SHIRT001-RED-M',
    'Red Medium',
    'Medium',
    'Red',
    45.00,
    89.99,
    18,
    5,
    10,
    'pcs',
    'Warehouse A',
    'active',
    NOW(),
    NOW();

-- Product 2: Adidas Climalite Performance T-Shirt
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'SHIRT002',
    'Adidas Climalite Performance T-Shirt',
    'Adidas',
    'b08edab6-66a0-4e72-a86e-386dd3572c2b',
    'High-performance t-shirt with Climalite technology for optimal moisture management. Perfect for running and training sessions.',
    'active',
    true,
    6.00,
    '["running","adidas","performance","climalite"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHIRT002'),
    'SHIRT002-BLU-L',
    'Blue Large',
    'Large',
    'Blue',
    42.00,
    79.99,
    22,
    5,
    10,
    'pcs',
    'Warehouse A',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHIRT002'),
    'SHIRT002-GRY-M',
    'Gray Medium',
    'Medium',
    'Gray',
    42.00,
    79.99,
    19,
    5,
    10,
    'pcs',
    'Warehouse A',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHIRT002'),
    'SHIRT002-NVY-S',
    'Navy Small',
    'Small',
    'Navy',
    42.00,
    79.99,
    15,
    5,
    10,
    'pcs',
    'Warehouse A',
    'active',
    NOW(),
    NOW();

-- Product 3: Puma DryCELL Training Top
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'SHIRT003',
    'Puma DryCELL Training Top',
    'Puma',
    'b08edab6-66a0-4e72-a86e-386dd3572c2b',
    'Advanced training top with DryCELL technology for superior sweat-wicking. Lightweight and comfortable for all training activities.',
    'active',
    true,
    6.00,
    '["training","puma","drycell","athletic"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHIRT003'),
    'SHIRT003-ORG-M',
    'Orange Medium',
    'Medium',
    'Orange',
    38.00,
    74.99,
    21,
    5,
    10,
    'pcs',
    'Warehouse A',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHIRT003'),
    'SHIRT003-BLK-L',
    'Black Large',
    'Large',
    'Black',
    38.00,
    74.99,
    17,
    5,
    10,
    'pcs',
    'Warehouse A',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHIRT003'),
    'SHIRT003-GRN-S',
    'Green Small',
    'Small',
    'Green',
    38.00,
    74.99,
    14,
    5,
    10,
    'pcs',
    'Warehouse A',
    'active',
    NOW(),
    NOW();

-- ============================================
-- CATEGORY 2: BALLS (Sports Balls)
-- Category ID: 3f50fab7-5d32-4156-9ba8-f3e8dc16ccee
-- ============================================

-- Product 4: Nike Strike Football
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'BALLS001',
    'Nike Strike Football',
    'Nike',
    '3f50fab7-5d32-4156-9ba8-f3e8dc16ccee',
    'Professional-grade football with Nike Aerowtrac grooves for enhanced aerodynamics. Perfect for training and matches.',
    'active',
    true,
    6.00,
    '["football","nike","professional","training"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'BALLS001'),
    'BALLS001-SIZE5-WHT',
    'Size 5 White',
    'Size 5',
    'White',
    35.00,
    69.99,
    30,
    10,
    20,
    'pcs',
    'Warehouse B',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'BALLS001'),
    'BALLS001-SIZE4-BLK',
    'Size 4 Black',
    'Size 4',
    'Black',
    30.00,
    59.99,
    25,
    10,
    20,
    'pcs',
    'Warehouse B',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'BALLS001'),
    'BALLS001-SIZE5-MLT',
    'Size 5 Multi',
    'Size 5',
    'Multi',
    35.00,
    69.99,
    28,
    10,
    20,
    'pcs',
    'Warehouse B',
    'active',
    NOW(),
    NOW();

-- Product 5: Spalding NBA Official Basketball
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'BALLS002',
    'Spalding NBA Official Basketball',
    'Spalding',
    '3f50fab7-5d32-4156-9ba8-f3e8dc16ccee',
    'Official NBA game ball with premium composite leather cover. Used in professional basketball leagues worldwide.',
    'active',
    true,
    6.00,
    '["basketball","spalding","nba","official"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'BALLS002'),
    'BALLS002-SIZE7-ORG',
    'Size 7 Orange',
    'Size 7',
    'Orange',
    55.00,
    119.99,
    20,
    8,
    15,
    'pcs',
    'Warehouse B',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'BALLS002'),
    'BALLS002-SIZE6-ORG',
    'Size 6 Orange',
    'Size 6',
    'Orange',
    50.00,
    109.99,
    18,
    8,
    15,
    'pcs',
    'Warehouse B',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'BALLS002'),
    'BALLS002-SIZE7-CST',
    'Size 7 Custom',
    'Size 7',
    'Custom',
    60.00,
    129.99,
    12,
    8,
    15,
    'pcs',
    'Warehouse B',
    'active',
    NOW(),
    NOW();

-- Product 6: Wilson Pro Staff Tennis Ball
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'BALLS003',
    'Wilson Pro Staff Tennis Ball',
    'Wilson',
    '3f50fab7-5d32-4156-9ba8-f3e8dc16ccee',
    'Professional tennis balls with extra-duty felt for durability. ITF approved for tournament play.',
    'active',
    true,
    6.00,
    '["tennis","wilson","professional","itf-approved"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'BALLS003'),
    'BALLS003-CAN4-YLW',
    'Can of 4 Yellow',
    'Can of 4',
    'Yellow',
    8.00,
    19.99,
    50,
    20,
    40,
    'pcs',
    'Warehouse B',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'BALLS003'),
    'BALLS003-CAN3-YLW',
    'Can of 3 Yellow',
    'Can of 3',
    'Yellow',
    6.50,
    15.99,
    45,
    20,
    40,
    'pcs',
    'Warehouse B',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'BALLS003'),
    'BALLS003-CAN4-PRS',
    'Can of 4 Pressureless',
    'Can of 4',
    'Pressureless',
    9.00,
    22.99,
    35,
    20,
    40,
    'pcs',
    'Warehouse B',
    'active',
    NOW(),
    NOW();

-- ============================================
-- CATEGORY 3: SHOE (Sports Footwear)
-- Category ID: 1e0f64f0-64fc-4fb3-b9e3-2bb94464a2f3
-- ============================================

-- Product 7: Nike Air Max Running Shoes
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'SHOE001',
    'Nike Air Max Running Shoes',
    'Nike',
    '1e0f64f0-64fc-4fb3-b9e3-2bb94464a2f3',
    'Premium running shoes with Air Max cushioning technology. Designed for maximum comfort and performance during long-distance runs.',
    'active',
    true,
    6.00,
    '["running","nike","air-max","cushioning"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHOE001'),
    'SHOE001-42-BLK',
    'Size 42 Black',
    '42',
    'Black',
    85.00,
    149.99,
    15,
    5,
    10,
    'pcs',
    'Warehouse C',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHOE001'),
    'SHOE001-43-WHT',
    'Size 43 White',
    '43',
    'White',
    85.00,
    149.99,
    12,
    5,
    10,
    'pcs',
    'Warehouse C',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHOE001'),
    'SHOE001-44-GRY',
    'Size 44 Gray',
    '44',
    'Gray',
    85.00,
    149.99,
    10,
    5,
    10,
    'pcs',
    'Warehouse C',
    'active',
    NOW(),
    NOW();

-- Product 8: Adidas Ultraboost Training Shoes
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'SHOE002',
    'Adidas Ultraboost Training Shoes',
    'Adidas',
    '1e0f64f0-64fc-4fb3-b9e3-2bb94464a2f3',
    'High-performance training shoes with Boost midsole technology. Provides exceptional energy return and comfort for intense workouts.',
    'active',
    true,
    6.00,
    '["training","adidas","ultraboost","energy-return"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHOE002'),
    'SHOE002-41-BLK',
    'Size 41 Black',
    '41',
    'Black',
    90.00,
    179.99,
    14,
    5,
    10,
    'pcs',
    'Warehouse C',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHOE002'),
    'SHOE002-42-WHT',
    'Size 42 White',
    '42',
    'White',
    90.00,
    179.99,
    11,
    5,
    10,
    'pcs',
    'Warehouse C',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHOE002'),
    'SHOE002-43-BLU',
    'Size 43 Blue',
    '43',
    'Blue',
    90.00,
    179.99,
    9,
    5,
    10,
    'pcs',
    'Warehouse C',
    'active',
    NOW(),
    NOW();

-- Product 9: Puma Speedcat Football Boots
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'SHOE003',
    'Puma Speedcat Football Boots',
    'Puma',
    '1e0f64f0-64fc-4fb3-b9e3-2bb94464a2f3',
    'Professional football boots with lightweight design and superior grip. Perfect for speed and agility on the pitch.',
    'active',
    true,
    6.00,
    '["football","puma","speedcat","professional"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHOE003'),
    'SHOE003-40-BLK',
    'Size 40 Black',
    '40',
    'Black',
    75.00,
    129.99,
    13,
    5,
    10,
    'pcs',
    'Warehouse C',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHOE003'),
    'SHOE003-41-WHT',
    'Size 41 White',
    '41',
    'White',
    75.00,
    129.99,
    10,
    5,
    10,
    'pcs',
    'Warehouse C',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'SHOE003'),
    'SHOE003-42-RED',
    'Size 42 Red',
    '42',
    'Red',
    75.00,
    129.99,
    8,
    5,
    10,
    'pcs',
    'Warehouse C',
    'active',
    NOW(),
    NOW();

-- ============================================
-- CATEGORY 4: RACKETS (Racket Sports Equipment)
-- Category ID: 227940a6-7442-470f-bc1e-d2263b32fb24
-- ============================================

-- Product 10: Yonex Astrox 88D Pro Badminton Racket
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'RACKET001',
    'Yonex Astrox 88D Pro Badminton Racket',
    'Yonex',
    '227940a6-7442-470f-bc1e-d2263b32fb24',
    'Professional badminton racket with Rotational Generator System. Designed for powerful smashes and precise control.',
    'active',
    true,
    6.00,
    '["badminton","yonex","astrox","professional"]'::jsonb,
    '{"size": "Grip Size", "color": "Color", "weight": "Weight", "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, weight, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'RACKET001'),
    'RACKET001-G4-3U-BLK',
    'G4 Grip 3U Black',
    'G4',
    'Black',
    '3U (88g)',
    120.00,
    249.99,
    8,
    3,
    6,
    'pcs',
    'Warehouse D',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'RACKET001'),
    'RACKET001-G5-4U-BLK',
    'G5 Grip 4U Black',
    'G5',
    'Black',
    '4U (83g)',
    120.00,
    249.99,
    7,
    3,
    6,
    'pcs',
    'Warehouse D',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'RACKET001'),
    'RACKET001-G4-3U-RED',
    'G4 Grip 3U Red',
    'G4',
    'Red',
    '3U (88g)',
    120.00,
    249.99,
    6,
    3,
    6,
    'pcs',
    'Warehouse D',
    'active',
    NOW(),
    NOW();

-- Product 11: Wilson Blade 98 Tennis Racket
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'RACKET002',
    'Wilson Blade 98 Tennis Racket',
    'Wilson',
    '227940a6-7442-470f-bc1e-d2263b32fb24',
    'Professional tennis racket with Countervail technology. Perfect balance of power and control for advanced players.',
    'active',
    true,
    6.00,
    '["tennis","wilson","blade","countervail"]'::jsonb,
    '{"size": "Grip Size", "color": "Color", "weight": "Weight", "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, weight, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'RACKET002'),
    'RACKET002-L3-300-BLK',
    'L3 Grip 300g Black',
    'L3',
    'Black',
    '300g',
    150.00,
    299.99,
    6,
    3,
    6,
    'pcs',
    'Warehouse D',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'RACKET002'),
    'RACKET002-L4-305-BLK',
    'L4 Grip 305g Black',
    'L4',
    'Black',
    '305g',
    150.00,
    299.99,
    5,
    3,
    6,
    'pcs',
    'Warehouse D',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'RACKET002'),
    'RACKET002-L3-300-WHT',
    'L3 Grip 300g White',
    'L3',
    'White',
    '300g',
    150.00,
    299.99,
    4,
    3,
    6,
    'pcs',
    'Warehouse D',
    'active',
    NOW(),
    NOW();

-- Product 12: Head Speed Pro Squash Racket
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'RACKET003',
    'Head Speed Pro Squash Racket',
    'Head',
    '227940a6-7442-470f-bc1e-d2263b32fb24',
    'Professional squash racket with Graphene 360+ technology. Lightweight design for maximum speed and maneuverability.',
    'active',
    true,
    6.00,
    '["squash","head","speed-pro","graphene"]'::jsonb,
    '{"size": "Grip Size", "color": "Color", "weight": "Weight", "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, weight, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'RACKET003'),
    'RACKET003-SM-125-BLK',
    'Small Grip 125g Black',
    'Small',
    'Black',
    '125g',
    100.00,
    199.99,
    7,
    3,
    6,
    'pcs',
    'Warehouse D',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'RACKET003'),
    'RACKET003-MD-130-BLK',
    'Medium Grip 130g Black',
    'Medium',
    'Black',
    '130g',
    100.00,
    199.99,
    6,
    3,
    6,
    'pcs',
    'Warehouse D',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'RACKET003'),
    'RACKET003-SM-125-BLU',
    'Small Grip 125g Blue',
    'Small',
    'Blue',
    '125g',
    100.00,
    199.99,
    5,
    3,
    6,
    'pcs',
    'Warehouse D',
    'active',
    NOW(),
    NOW();

-- ============================================
-- CATEGORY 5: FITNESS (Fitness Equipment)
-- Category ID: 7d8fc796-c08a-4aab-8540-397a0bec6f43
-- ============================================

-- Product 13: Nike Adjustable Dumbbells Set
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'FITNESS001',
    'Nike Adjustable Dumbbells Set',
    'Nike',
    '7d8fc796-c08a-4aab-8540-397a0bec6f43',
    'Professional adjustable dumbbells with quick-change weight system. Range from 5kg to 25kg per dumbbell. Perfect for home gyms.',
    'active',
    true,
    6.00,
    '["weights","nike","adjustable","home-gym"]'::jsonb,
    '{"size": null, "color": "Color", "weight": "Weight Range", "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, color, weight, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'FITNESS001'),
    'FITNESS001-BLK-5-25',
    'Black 5-25kg',
    'Black',
    '5-25kg',
    200.00,
    399.99,
    5,
    2,
    4,
    'set',
    'Warehouse E',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'FITNESS001'),
    'FITNESS001-GRY-10-30',
    'Gray 10-30kg',
    'Gray',
    '10-30kg',
    250.00,
    499.99,
    4,
    2,
    4,
    'set',
    'Warehouse E',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'FITNESS001'),
    'FITNESS001-BLK-2-20',
    'Black 2-20kg',
    'Black',
    '2-20kg',
    180.00,
    349.99,
    6,
    2,
    4,
    'set',
    'Warehouse E',
    'active',
    NOW(),
    NOW();

-- Product 14: Adidas Resistance Bands Set
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'FITNESS002',
    'Adidas Resistance Bands Set',
    'Adidas',
    '7d8fc796-c08a-4aab-8540-397a0bec6f43',
    'Professional resistance bands set with 5 different resistance levels. Includes door anchor and exercise guide. Perfect for strength training.',
    'active',
    true,
    6.00,
    '["resistance-bands","adidas","strength-training","portable"]'::jsonb,
    '{"size": null, "color": "Color", "weight": "Resistance Level", "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, color, weight, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'FITNESS002'),
    'FITNESS002-MLT-LIGHT',
    'Multi Light',
    'Multi',
    'Light (5-15kg)',
    25.00,
    49.99,
    20,
    10,
    20,
    'set',
    'Warehouse E',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'FITNESS002'),
    'FITNESS002-MLT-MED',
    'Multi Medium',
    'Multi',
    'Medium (15-30kg)',
    30.00,
    59.99,
    18,
    10,
    20,
    'set',
    'Warehouse E',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'FITNESS002'),
    'FITNESS002-MLT-HVY',
    'Multi Heavy',
    'Multi',
    'Heavy (30-50kg)',
    35.00,
    69.99,
    15,
    10,
    20,
    'set',
    'Warehouse E',
    'active',
    NOW(),
    NOW();

-- Product 15: Puma Yoga Mat Pro
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'FITNESS003',
    'Puma Yoga Mat Pro',
    'Puma',
    '7d8fc796-c08a-4aab-8540-397a0bec6f43',
    'Premium yoga mat with non-slip surface and extra cushioning. Eco-friendly TPE material. Perfect for yoga, pilates, and stretching.',
    'active',
    true,
    6.00,
    '["yoga","puma","non-slip","eco-friendly"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": "Thickness", "grip": null, "material": "Material"}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, weight, material, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'FITNESS003'),
    'FITNESS003-STD-PPL-6MM',
    'Standard Purple 6mm',
    'Standard (183x61cm)',
    'Purple',
    '6mm',
    'TPE',
    35.00,
    69.99,
    12,
    5,
    10,
    'pcs',
    'Warehouse E',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'FITNESS003'),
    'FITNESS003-STD-BLK-8MM',
    'Standard Black 8mm',
    'Standard (183x61cm)',
    'Black',
    '8mm',
    'TPE',
    40.00,
    79.99,
    10,
    5,
    10,
    'pcs',
    'Warehouse E',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'FITNESS003'),
    'FITNESS003-LRG-BLU-6MM',
    'Large Blue 6mm',
    'Large (200x80cm)',
    'Blue',
    '6mm',
    'TPE',
    45.00,
    89.99,
    8,
    5,
    10,
    'pcs',
    'Warehouse E',
    'active',
    NOW(),
    NOW();

-- ============================================
-- CATEGORY 6: OUTDOORINDOOR (Outdoor & Indoor Sports)
-- Category ID: 0d0b66ae-1547-49b3-9a2e-35001aa51f7a
-- ============================================

-- Product 16: Nike Training Backpack
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'OUTDOOR001',
    'Nike Training Backpack',
    'Nike',
    '0d0b66ae-1547-49b3-9a2e-35001aa51f7a',
    'Durable training backpack with multiple compartments. Water-resistant material with padded laptop sleeve. Perfect for gym and outdoor activities.',
    'active',
    true,
    6.00,
    '["backpack","nike","training","water-resistant"]'::jsonb,
    '{"size": "Capacity", "color": "Color", "weight": null, "grip": null, "material": "Material"}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, material, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'OUTDOOR001'),
    'OUTDOOR001-30L-BLK',
    '30L Black',
    '30L',
    'Black',
    'Polyester',
    45.00,
    89.99,
    15,
    5,
    10,
    'pcs',
    'Warehouse F',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'OUTDOOR001'),
    'OUTDOOR001-25L-GRY',
    '25L Gray',
    '25L',
    'Gray',
    'Polyester',
    40.00,
    79.99,
    13,
    5,
    10,
    'pcs',
    'Warehouse F',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'OUTDOOR001'),
    'OUTDOOR001-35L-NVY',
    '35L Navy',
    '35L',
    'Navy',
    'Nylon',
    50.00,
    99.99,
    11,
    5,
    10,
    'pcs',
    'Warehouse F',
    'active',
    NOW(),
    NOW();

-- Product 17: Adidas Camping Sleeping Bag
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'OUTDOOR002',
    'Adidas Camping Sleeping Bag',
    'Adidas',
    '0d0b66ae-1547-49b3-9a2e-35001aa51f7a',
    'Lightweight sleeping bag with synthetic insulation. Comfortable for temperatures down to 10°C. Compact and easy to carry.',
    'active',
    true,
    6.00,
    '["camping","adidas","sleeping-bag","lightweight"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": "Temperature Rating", "grip": null, "material": "Material"}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, weight, material, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'OUTDOOR002'),
    'OUTDOOR002-RGL-GRN-10C',
    'Regular Green 10°C',
    'Regular',
    'Green',
    '10°C',
    'Polyester',
    60.00,
    119.99,
    8,
    3,
    6,
    'pcs',
    'Warehouse F',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'OUTDOOR002'),
    'OUTDOOR002-LRG-BLK-5C',
    'Large Black 5°C',
    'Large',
    'Black',
    '5°C',
    'Polyester',
    70.00,
    139.99,
    6,
    3,
    6,
    'pcs',
    'Warehouse F',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'OUTDOOR002'),
    'OUTDOOR002-RGL-BLU-0C',
    'Regular Blue 0°C',
    'Regular',
    'Blue',
    '0°C',
    'Synthetic Down',
    80.00,
    159.99,
    5,
    3,
    6,
    'pcs',
    'Warehouse F',
    'active',
    NOW(),
    NOW();

-- Product 18: Puma Portable Water Bottle
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'OUTDOOR003',
    'Puma Portable Water Bottle',
    'Puma',
    '0d0b66ae-1547-49b3-9a2e-35001aa51f7a',
    'BPA-free water bottle with leak-proof lid. Insulated design keeps drinks cold for 24 hours. Perfect for sports and outdoor activities.',
    'active',
    true,
    6.00,
    '["water-bottle","puma","insulated","bpa-free"]'::jsonb,
    '{"size": "Capacity", "color": "Color", "weight": null, "grip": null, "material": "Material"}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, material, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'OUTDOOR003'),
    'OUTDOOR003-750ML-BLK',
    '750ml Black',
    '750ml',
    'Black',
    'Stainless Steel',
    20.00,
    39.99,
    25,
    10,
    20,
    'pcs',
    'Warehouse F',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'OUTDOOR003'),
    'OUTDOOR003-1L-WHT',
    '1L White',
    '1L',
    'White',
    'Stainless Steel',
    25.00,
    49.99,
    22,
    10,
    20,
    'pcs',
    'Warehouse F',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'OUTDOOR003'),
    'OUTDOOR003-500ML-BLU',
    '500ml Blue',
    '500ml',
    'Blue',
    'Plastic',
    15.00,
    29.99,
    30,
    10,
    20,
    'pcs',
    'Warehouse F',
    'active',
    NOW(),
    NOW();

-- ============================================
-- CATEGORY 7: WATER (Water Sports Equipment)
-- Category ID: 9d3d4430-c62e-406e-baaf-a06c2f1788ee
-- ============================================

-- Product 19: Speedo Fastskin Elite Goggles
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'WATER001',
    'Speedo Fastskin Elite Goggles',
    'Speedo',
    '9d3d4430-c62e-406e-baaf-a06c2f1788ee',
    'Professional swimming goggles with anti-fog technology. Hydrophilic coating and UV protection. Used by Olympic swimmers.',
    'active',
    true,
    6.00,
    '["swimming","speedo","goggles","professional"]'::jsonb,
    '{"size": null, "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'WATER001'),
    'WATER001-BLK',
    'Black',
    'Black',
    35.00,
    69.99,
    20,
    10,
    20,
    'pcs',
    'Warehouse G',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WATER001'),
    'WATER001-BLU',
    'Blue',
    'Blue',
    35.00,
    69.99,
    18,
    10,
    20,
    'pcs',
    'Warehouse G',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WATER001'),
    'WATER001-CLR',
    'Clear',
    'Clear',
    35.00,
    69.99,
    15,
    10,
    20,
    'pcs',
    'Warehouse G',
    'active',
    NOW(),
    NOW();

-- Product 20: Arena Carbon Pro Swim Fins
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'WATER002',
    'Arena Carbon Pro Swim Fins',
    'Arena',
    '9d3d4430-c62e-406e-baaf-a06c2f1788ee',
    'Professional swim fins with carbon fiber construction. Enhanced propulsion and flexibility. Perfect for competitive swimming training.',
    'active',
    true,
    6.00,
    '["swimming","arena","fins","carbon-fiber"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": "Material"}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, material, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'WATER002'),
    'WATER002-40-BLK',
    'Size 40 Black',
    '40',
    'Black',
    'Carbon Fiber',
    80.00,
    149.99,
    10,
    5,
    10,
    'pcs',
    'Warehouse G',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WATER002'),
    'WATER002-42-BLU',
    'Size 42 Blue',
    '42',
    'Blue',
    'Carbon Fiber',
    80.00,
    149.99,
    8,
    5,
    10,
    'pcs',
    'Warehouse G',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WATER002'),
    'WATER002-44-YLW',
    'Size 44 Yellow',
    '44',
    'Yellow',
    'Carbon Fiber',
    80.00,
    149.99,
    6,
    5,
    10,
    'pcs',
    'Warehouse G',
    'active',
    NOW(),
    NOW();

-- Product 21: TYR Sport Kickboard
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'WATER003',
    'TYR Sport Kickboard',
    'TYR',
    '9d3d4430-c62e-406e-baaf-a06c2f1788ee',
    'Professional kickboard for swim training. Durable EVA foam construction with ergonomic hand grips. Perfect for leg strength development.',
    'active',
    true,
    6.00,
    '["swimming","tyr","kickboard","training"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": "Material"}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, material, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'WATER003'),
    'WATER003-JR-BLU',
    'Junior Blue',
    'Junior',
    'Blue',
    'EVA Foam',
    15.00,
    29.99,
    15,
    5,
    10,
    'pcs',
    'Warehouse G',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WATER003'),
    'WATER003-ADULT-RED',
    'Adult Red',
    'Adult',
    'Red',
    'EVA Foam',
    18.00,
    34.99,
    12,
    5,
    10,
    'pcs',
    'Warehouse G',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WATER003'),
    'WATER003-ADULT-YLW',
    'Adult Yellow',
    'Adult',
    'Yellow',
    'EVA Foam',
    18.00,
    34.99,
    10,
    5,
    10,
    'pcs',
    'Warehouse G',
    'active',
    NOW(),
    NOW();

-- ============================================
-- CATEGORY 8: WINTER (Winter Sports Equipment)
-- Category ID: b2fb6fc4-d3fb-43e6-9aba-db93b13f97fd
-- ============================================

-- Product 22: Salomon X Ultra Winter Boots
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'WINTER001',
    'Salomon X Ultra Winter Boots',
    'Salomon',
    'b2fb6fc4-d3fb-43e6-9aba-db93b13f97fd',
    'Premium winter boots with waterproof membrane and thermal insulation. Perfect for snow sports and cold weather activities.',
    'active',
    true,
    6.00,
    '["winter","salomon","boots","waterproof"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'WINTER001'),
    'WINTER001-42-BLK',
    'Size 42 Black',
    '42',
    'Black',
    120.00,
    229.99,
    8,
    3,
    6,
    'pcs',
    'Warehouse H',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WINTER001'),
    'WINTER001-43-BRN',
    'Size 43 Brown',
    '43',
    'Brown',
    120.00,
    229.99,
    6,
    3,
    6,
    'pcs',
    'Warehouse H',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WINTER001'),
    'WINTER001-44-BLK',
    'Size 44 Black',
    '44',
    'Black',
    120.00,
    229.99,
    5,
    3,
    6,
    'pcs',
    'Warehouse H',
    'active',
    NOW(),
    NOW();

-- Product 23: Burton Custom Snowboard
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'WINTER002',
    'Burton Custom Snowboard',
    'Burton',
    'b2fb6fc4-d3fb-43e6-9aba-db93b13f97fd',
    'Professional snowboard with directional camber profile. Perfect for all-mountain riding. Durable construction for advanced riders.',
    'active',
    true,
    6.00,
    '["snowboard","burton","all-mountain","professional"]'::jsonb,
    '{"size": "Length", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'WINTER002'),
    'WINTER002-155-BLK',
    '155cm Black',
    '155cm',
    'Black',
    300.00,
    599.99,
    4,
    2,
    4,
    'pcs',
    'Warehouse H',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WINTER002'),
    'WINTER002-158-BLU',
    '158cm Blue',
    '158cm',
    'Blue',
    300.00,
    599.99,
    3,
    2,
    4,
    'pcs',
    'Warehouse H',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WINTER002'),
    'WINTER002-160-GRY',
    '160cm Gray',
    '160cm',
    'Gray',
    300.00,
    599.99,
    2,
    2,
    4,
    'pcs',
    'Warehouse H',
    'active',
    NOW(),
    NOW();

-- Product 24: K2 Ski Poles
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'WINTER003',
    'K2 Ski Poles',
    'K2',
    'b2fb6fc4-d3fb-43e6-9aba-db93b13f97fd',
    'Lightweight aluminum ski poles with ergonomic grips. Adjustable straps and durable baskets. Perfect for alpine skiing.',
    'active',
    true,
    6.00,
    '["skiing","k2","poles","aluminum"]'::jsonb,
    '{"size": "Length", "color": "Color", "weight": null, "grip": null, "material": "Material"}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, material, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'WINTER003'),
    'WINTER003-120-BLK',
    '120cm Black',
    '120cm',
    'Black',
    'Aluminum',
    40.00,
    79.99,
    12,
    5,
    10,
    'pcs',
    'Warehouse H',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WINTER003'),
    'WINTER003-130-SLV',
    '130cm Silver',
    '130cm',
    'Silver',
    'Aluminum',
    40.00,
    79.99,
    10,
    5,
    10,
    'pcs',
    'Warehouse H',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'WINTER003'),
    'WINTER003-140-BLK',
    '140cm Black',
    '140cm',
    'Black',
    'Carbon Fiber',
    60.00,
    119.99,
    8,
    5,
    10,
    'pcs',
    'Warehouse H',
    'active',
    NOW(),
    NOW();

-- ============================================
-- CATEGORY 9: ACCESSORIES (Sports Accessories)
-- Category ID: accbd741-d9f0-4ec8-8322-2ee1eed187cc
-- ============================================

-- Product 25: Nike Pro Headband
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'ACCESSORIES001',
    'Nike Pro Headband',
    'Nike',
    'accbd741-d9f0-4ec8-8322-2ee1eed187cc',
    'Moisture-wicking headband with Dri-FIT technology. Keeps sweat away from eyes during intense workouts. One-size-fits-all design.',
    'active',
    true,
    6.00,
    '["headband","nike","dri-fit","moisture-wicking"]'::jsonb,
    '{"size": null, "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'ACCESSORIES001'),
    'ACCESSORIES001-BLK',
    'Black',
    'Black',
    8.00,
    14.99,
    50,
    20,
    40,
    'pcs',
    'Warehouse I',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'ACCESSORIES001'),
    'ACCESSORIES001-WHT',
    'White',
    'White',
    8.00,
    14.99,
    45,
    20,
    40,
    'pcs',
    'Warehouse I',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'ACCESSORIES001'),
    'ACCESSORIES001-RED',
    'Red',
    'Red',
    8.00,
    14.99,
    40,
    20,
    40,
    'pcs',
    'Warehouse I',
    'active',
    NOW(),
    NOW();

-- Product 26: Adidas Training Wristbands
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'ACCESSORIES002',
    'Adidas Training Wristbands',
    'Adidas',
    'accbd741-d9f0-4ec8-8322-2ee1eed187cc',
    'Absorbent wristbands for sweat management during training. Soft terry cloth material. Set of 2 wristbands.',
    'active',
    true,
    6.00,
    '["wristbands","adidas","sweat-management","training"]'::jsonb,
    '{"size": null, "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'ACCESSORIES002'),
    'ACCESSORIES002-BLK',
    'Black',
    'Black',
    6.00,
    12.99,
    40,
    20,
    40,
    'set',
    'Warehouse I',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'ACCESSORIES002'),
    'ACCESSORIES002-WHT',
    'White',
    'White',
    6.00,
    12.99,
    35,
    20,
    40,
    'set',
    'Warehouse I',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'ACCESSORIES002'),
    'ACCESSORIES002-GRY',
    'Gray',
    'Gray',
    6.00,
    12.99,
    30,
    20,
    40,
    'set',
    'Warehouse I',
    'active',
    NOW(),
    NOW();

-- Product 27: Puma Sports Towel
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'ACCESSORIES003',
    'Puma Sports Towel',
    'Puma',
    'accbd741-d9f0-4ec8-8322-2ee1eed187cc',
    'Quick-dry microfiber sports towel. Ultra-absorbent and lightweight. Perfect for gym, swimming, and outdoor activities.',
    'active',
    true,
    6.00,
    '["towel","puma","microfiber","quick-dry"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": "Material"}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, material, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'ACCESSORIES003'),
    'ACCESSORIES003-SM-BLK',
    'Small Black',
    'Small (30x60cm)',
    'Black',
    'Microfiber',
    12.00,
    24.99,
    25,
    10,
    20,
    'pcs',
    'Warehouse I',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'ACCESSORIES003'),
    'ACCESSORIES003-MD-BLU',
    'Medium Blue',
    'Medium (50x100cm)',
    'Blue',
    'Microfiber',
    18.00,
    34.99,
    20,
    10,
    20,
    'pcs',
    'Warehouse I',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'ACCESSORIES003'),
    'ACCESSORIES003-LRG-GRY',
    'Large Gray',
    'Large (70x140cm)',
    'Gray',
    'Microfiber',
    25.00,
    49.99,
    15,
    10,
    20,
    'pcs',
    'Warehouse I',
    'active',
    NOW(),
    NOW();

-- ============================================
-- CATEGORY 10: MARTIAL (Martial Arts & Combat Sports Equipment)
-- Category ID: bd3a2806-eedb-4dc4-a243-604e9b188776
-- ============================================

-- Product 28: Everlast Pro Style Boxing Gloves
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'MARTIAL001',
    'Everlast Pro Style Boxing Gloves',
    'Everlast',
    'bd3a2806-eedb-4dc4-a243-604e9b188776',
    'Professional boxing gloves with premium leather construction. Multi-layer foam padding for maximum protection. Used by professional boxers.',
    'active',
    true,
    6.00,
    '["boxing","everlast","gloves","professional"]'::jsonb,
    '{"size": "Weight/Ounce", "color": "Color", "weight": null, "grip": null, "material": "Material"}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, material, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'MARTIAL001'),
    'MARTIAL001-12OZ-RED',
    '12oz Red',
    '12oz',
    'Red',
    'Leather',
    60.00,
    119.99,
    10,
    5,
    10,
    'pcs',
    'Warehouse J',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'MARTIAL001'),
    'MARTIAL001-14OZ-BLK',
    '14oz Black',
    '14oz',
    'Black',
    'Leather',
    65.00,
    129.99,
    8,
    5,
    10,
    'pcs',
    'Warehouse J',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'MARTIAL001'),
    'MARTIAL001-16OZ-BLK',
    '16oz Black',
    '16oz',
    'Black',
    'Leather',
    70.00,
    139.99,
    6,
    5,
    10,
    'pcs',
    'Warehouse J',
    'active',
    NOW(),
    NOW();

-- Product 29: Venum Elite Muay Thai Shin Guards
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'MARTIAL002',
    'Venum Elite Muay Thai Shin Guards',
    'Venum',
    'bd3a2806-eedb-4dc4-a243-604e9b188776',
    'Professional shin guards with full protection coverage. Durable construction with secure velcro straps. Perfect for Muay Thai training.',
    'active',
    true,
    6.00,
    '["muay-thai","venum","shin-guards","protection"]'::jsonb,
    '{"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, size, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'MARTIAL002'),
    'MARTIAL002-SM-BLK',
    'Small Black',
    'Small',
    'Black',
    45.00,
    89.99,
    8,
    3,
    6,
    'pcs',
    'Warehouse J',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'MARTIAL002'),
    'MARTIAL002-MD-RED',
    'Medium Red',
    'Medium',
    'Red',
    45.00,
    89.99,
    6,
    3,
    6,
    'pcs',
    'Warehouse J',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'MARTIAL002'),
    'MARTIAL002-LRG-BLK',
    'Large Black',
    'Large',
    'Black',
    45.00,
    89.99,
    5,
    3,
    6,
    'pcs',
    'Warehouse J',
    'active',
    NOW(),
    NOW();

-- Product 30: Hayabusa T3 Boxing Hand Wraps
INSERT INTO products (
    id, product_code, product_name, brand, category_id, description, 
    status, is_taxable, tax_rate, tags, active_variant_attributes, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'MARTIAL003',
    'Hayabusa T3 Boxing Hand Wraps',
    'Hayabusa',
    'bd3a2806-eedb-4dc4-a243-604e9b188776',
    'Professional hand wraps with thumb loop and velcro closure. 180-inch length for full hand protection. Premium elastic material.',
    'active',
    true,
    6.00,
    '["boxing","hayabusa","hand-wraps","protection"]'::jsonb,
    '{"size": null, "color": "Color", "weight": null, "grip": null, "material": null}'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO product_variants (
    product_id, sku, variant_name, color, cost_price, selling_price, 
    current_stock, reorder_level, reorder_quantity, unit_of_measure, location, status, created_at, updated_at
)
SELECT 
    (SELECT id FROM products WHERE product_code = 'MARTIAL003'),
    'MARTIAL003-BLK',
    'Black',
    'Black',
    15.00,
    29.99,
    30,
    15,
    30,
    'pcs',
    'Warehouse J',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'MARTIAL003'),
    'MARTIAL003-RED',
    'Red',
    'Red',
    15.00,
    29.99,
    25,
    15,
    30,
    'pcs',
    'Warehouse J',
    'active',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM products WHERE product_code = 'MARTIAL003'),
    'MARTIAL003-WHT',
    'White',
    'White',
    15.00,
    29.99,
    20,
    15,
    30,
    'pcs',
    'Warehouse J',
    'active',
    NOW(),
    NOW();

-- ============================================
-- SUMMARY
-- ============================================
-- Total: 30 products (3 per category × 10 categories)
-- Total: 90 variants (3 variants per product × 30 products)
-- All products are set to 'active' status
-- All variants are set to 'active' status
-- Variant attributes configured based on product type
-- ============================================
