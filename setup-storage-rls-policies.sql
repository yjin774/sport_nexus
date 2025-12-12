-- ============================================
-- SUPABASE STORAGE RLS POLICIES FOR PRODUCT IMAGES
-- ============================================
-- This script sets up Row Level Security (RLS) policies for the product-images storage bucket
-- Run this in Supabase SQL Editor after creating the 'product-images' bucket

-- Enable RLS on the storage.objects table (if not already enabled)
-- Note: RLS is typically enabled by default on storage.objects

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to upload product images" ON storage.objects;

-- Policy 1: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
);

-- Policy 2: Allow authenticated users to read/view images
CREATE POLICY "Allow authenticated users to read product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images');

-- Policy 3: Allow authenticated users to update images
CREATE POLICY "Allow authenticated users to update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Policy 4: Allow authenticated users to delete images
CREATE POLICY "Allow authenticated users to delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Alternative: If you want to make the bucket completely public (no authentication required)
-- Uncomment the following policies and comment out the authenticated policies above:

-- DROP POLICY IF EXISTS "Allow public to read product images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public to upload product images" ON storage.objects;

-- CREATE POLICY "Allow public to read product images"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'product-images');

-- CREATE POLICY "Allow public to upload product images"
-- ON storage.objects
-- FOR INSERT
-- TO public
-- WITH CHECK (bucket_id = 'product-images');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the policies are set up correctly:

-- Check if bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'product-images';

-- Check existing policies for the bucket
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================
-- NOTES
-- ============================================
-- 1. Make sure the 'product-images' bucket exists in Supabase Storage
-- 2. The bucket should be set to "Public" if you want public access, or "Private" with RLS policies
-- 3. If using authenticated policies, users must be logged in to upload images
-- 4. You may need to adjust the folder structure in the WITH CHECK clause if you want to organize images in subfolders

