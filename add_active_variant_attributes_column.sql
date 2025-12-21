-- Add active_variant_attributes column to products table
-- This column stores the configured variant attributes (size, color, weight, grip, material)
-- as a JSONB object for each product

-- Check if column exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'active_variant_attributes'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN active_variant_attributes JSONB DEFAULT NULL;
        
        RAISE NOTICE 'Column active_variant_attributes added successfully to products table';
    ELSE
        RAISE NOTICE 'Column active_variant_attributes already exists in products table';
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.products.active_variant_attributes IS 
'Stores the configured variant attributes for the product. JSONB format: {"size": "Size", "color": "Color", "weight": "", "grip": "", "material": ""}. Empty strings indicate inactive attributes, non-empty strings indicate active attributes with their configured values.';
