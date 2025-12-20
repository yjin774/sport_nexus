-- SIMPLIFIED: Find and Drop Constraint for Return Goods
-- Run this in Supabase SQL Editor

-- Step 1: First, find the exact constraint name
-- Uncomment and run this query to see what constraints exist:
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.purchase_order_items'::regclass
    AND contype = 'c'
    AND (
        pg_get_constraintdef(oid) LIKE '%quantity_received%'
        OR pg_get_constraintdef(oid) LIKE '%quantity_ordered%'
    );

-- Step 2: Once you see the constraint name, use it in the DROP statement below
-- Replace 'YOUR_CONSTRAINT_NAME_HERE' with the actual constraint name from Step 1
-- ALTER TABLE public.purchase_order_items DROP CONSTRAINT IF EXISTS YOUR_CONSTRAINT_NAME_HERE;

-- OR use this automated approach (recommended):
DO $$
DECLARE
    constraint_rec record;
BEGIN
    -- Find and drop all check constraints that limit quantity_received
    FOR constraint_rec IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.purchase_order_items'::regclass
            AND contype = 'c'
            AND (
                pg_get_constraintdef(oid) LIKE '%quantity_received%quantity_ordered%'
                OR pg_get_constraintdef(oid) LIKE '%quantity_ordered%quantity_received%'
                OR (pg_get_constraintdef(oid) LIKE '%quantity_received%' AND pg_get_constraintdef(oid) LIKE '%<=%')
            )
    LOOP
        EXECUTE 'ALTER TABLE public.purchase_order_items DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_rec.conname);
        RAISE NOTICE 'Successfully dropped constraint: %', constraint_rec.conname;
    END LOOP;
    
    -- If no constraints were found, let user know
    IF NOT FOUND THEN
        RAISE NOTICE 'No matching constraints found. The constraint may have already been removed.';
    END IF;
END $$;

-- Step 3: Verify the constraint is gone
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.purchase_order_items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%quantity_received%';

-- If the query above returns no rows, the constraint has been successfully removed!

-- Step 4: Also check for and drop any TRIGGER functions that might enforce this
-- IMPORTANT: The error might be coming from a trigger function, not just a CHECK constraint

-- Drop the trigger
DROP TRIGGER IF EXISTS validate_po_item_quantity_trigger ON public.purchase_order_items;

-- Drop the function
DROP FUNCTION IF EXISTS validate_po_item_quantity() CASCADE;

-- Verify no quantity-related triggers remain
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'purchase_order_items'
    AND trigger_name LIKE '%quantity%';

-- If this returns no rows, all triggers have been removed!
