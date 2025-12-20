-- ============================================================================
-- UPDATE RETURN GOODS CONSTRAINT
-- ============================================================================
-- Purpose: Remove the database constraint that prevents quantity_received 
--          from exceeding quantity_ordered, allowing return goods functionality
--
-- How to Run:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" or press Ctrl+Enter
-- 5. Check the "Messages" tab for confirmation
--
-- If this doesn't work, try the alternative script: find_and_drop_constraint.sql
-- ============================================================================

-- Update purchase_order_items table to allow quantity_received > quantity_ordered for return goods
-- This removes the CHECK constraint that prevents return goods functionality

-- Step 1: Find all CHECK constraints on purchase_order_items table that involve quantity_received
-- Run this query first to see what constraints exist:
/*
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'purchase_order_items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%quantity_received%';
*/

-- Step 2: Drop the constraint(s) - This will drop ALL check constraints that mention quantity_received
-- Note: PostgreSQL/Supabase may auto-generate constraint names, so we need to find and drop them dynamically

-- Method 1: Drop by finding the constraint name dynamically (recommended)
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the constraint name that checks quantity_received <= quantity_ordered
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'purchase_order_items'::regclass
        AND contype = 'c'
        AND (
            pg_get_constraintdef(oid) LIKE '%quantity_received%quantity_ordered%'
            OR pg_get_constraintdef(oid) LIKE '%quantity_ordered%quantity_received%'
            OR (pg_get_constraintdef(oid) LIKE '%quantity_received%' AND pg_get_constraintdef(oid) LIKE '%<=%')
        )
    LIMIT 1;
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE purchase_order_items DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No constraint found matching the pattern. Constraint may have already been removed or has a different structure.';
    END IF;
END $$;

-- Method 2: Alternative - Drop all CHECK constraints on quantity_received (use with caution)
-- This will drop ALL check constraints that mention quantity_received
/*
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'purchase_order_items'::regclass
            AND contype = 'c'
            AND pg_get_constraintdef(oid) LIKE '%quantity_received%'
    LOOP
        EXECUTE 'ALTER TABLE purchase_order_items DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;
*/

-- Step 3: Verify the constraint has been removed
-- Run this to confirm no constraints remain that prevent quantity_received > quantity_ordered:
/*
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'purchase_order_items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%quantity_received%';
*/

-- Step 4: Drop the trigger function that validates quantity_received (if it exists)
-- IMPORTANT: The constraint might be enforced by a TRIGGER FUNCTION, not just a CHECK constraint
-- According to the schema documentation, there's a trigger: validate_po_item_quantity

-- Drop the trigger first
DROP TRIGGER IF EXISTS validate_po_item_quantity_trigger ON public.purchase_order_items;

-- Then drop the function (if you want to remove it completely)
-- Or modify it to allow return goods
DROP FUNCTION IF EXISTS validate_po_item_quantity() CASCADE;

-- Alternative: If you want to keep the function but modify it to allow return goods,
-- you would need to recreate it. However, since we're removing the validation,
-- it's safer to just drop it.

-- Step 5: Final verification - Check for any remaining triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'purchase_order_items'
    AND trigger_name LIKE '%quantity%';

-- Note: The original constraint was likely: CHECK (quantity_received <= quantity_ordered)
-- AND/OR a trigger function: validate_po_item_quantity
-- After running this script, quantity_received can exceed quantity_ordered for return goods functionality
