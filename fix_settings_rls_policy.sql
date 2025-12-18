-- Fix RLS Policy for Settings Table
-- This adds the missing INSERT policy that's needed for upsert operations

-- Policy: Allow authenticated users to insert settings (needed for upsert)
-- Check if policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'settings' 
        AND policyname = 'Allow authenticated insert settings'
    ) THEN
        CREATE POLICY "Allow authenticated insert settings" ON settings
            FOR INSERT
            WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- Note: The UPDATE policy should already exist, but we ensure it's correct
-- If the policy doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'settings' 
        AND policyname = 'Allow staff update settings'
    ) THEN
        CREATE POLICY "Allow staff update settings" ON settings
            FOR UPDATE
            USING (auth.role() = 'authenticated');
    END IF;
END $$;

