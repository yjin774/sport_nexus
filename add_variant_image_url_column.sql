-- ============================================
-- Add image_url column to product_variants table
-- ============================================
-- This migration adds the image_url column to store variant image URLs
-- Run this in your Supabase SQL Editor

-- Check if column already exists before adding
DO $$ 
BEGIN
    -- Check if image_url column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_variants' 
        AND column_name = 'image_url'
    ) THEN
        -- Add image_url column
        ALTER TABLE product_variants 
        ADD COLUMN image_url TEXT;
        
        RAISE NOTICE 'Column image_url added to product_variants table';
    ELSE
        RAISE NOTICE 'Column image_url already exists in product_variants table';
    END IF;
    
    -- Check if variant_image column exists (alternative column name)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_variants' 
        AND column_name = 'variant_image'
    ) THEN
        -- Add variant_image column as well (for backward compatibility)
        ALTER TABLE product_variants 
        ADD COLUMN variant_image TEXT;
        
        RAISE NOTICE 'Column variant_image added to product_variants table';
    ELSE
        RAISE NOTICE 'Column variant_image already exists in product_variants table';
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN product_variants.image_url IS 'URL of the variant image stored in Supabase Storage';
COMMENT ON COLUMN product_variants.variant_image IS 'Alternative column name for variant image URL (for backward compatibility)';
