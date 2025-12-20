-- ============================================================================
-- FIX RETURN GOODS CONSTRAINT - ALL-IN-ONE SOLUTION
-- ============================================================================
-- This script removes BOTH the CHECK constraint AND the trigger function
-- that prevent quantity_received from exceeding quantity_ordered
--
-- How to Run in Supabase:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy this entire script
-- 3. Click "Run" or press Ctrl+Enter
-- 4. Check the "Messages" tab for success/error messages
-- ============================================================================

-- Step 1: Drop the trigger and function (this is the main culprit)
-- The trigger name is: validate_po_item_quantity
-- The function name is: validate_po_item_quantity_received()

-- Drop all triggers that validate quantity (there may be multiple for different events)
DO $$
DECLARE
    trigger_rec record;
BEGIN
    FOR trigger_rec IN 
        SELECT 
            trigger_name,
            event_object_schema,
            event_object_table
        FROM information_schema.triggers
        WHERE event_object_table = 'purchase_order_items'
            AND (
                trigger_name LIKE '%validate_po_item_quantity%'
                OR action_statement LIKE '%validate_po_item_quantity_received%'
            )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE',
            trigger_rec.trigger_name,
            trigger_rec.event_object_schema,
            trigger_rec.event_object_table
        );
        RAISE NOTICE 'Dropped trigger: % on %.%',
            trigger_rec.trigger_name,
            trigger_rec.event_object_schema,
            trigger_rec.event_object_table;
    END LOOP;
END $$;

-- Drop the function (CASCADE will also drop any dependent objects)
DROP FUNCTION IF EXISTS public.validate_po_item_quantity_received() CASCADE;
DROP FUNCTION IF EXISTS validate_po_item_quantity_received() CASCADE;

-- Step 2: Drop any CHECK constraints that limit quantity_received
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
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.conname;
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No matching CHECK constraints found (may have already been removed)';
    END IF;
END $$;

-- Step 3: Verify everything is removed
-- Check for remaining constraints
SELECT 
    'CHECK CONSTRAINT' AS type,
    conname AS name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.purchase_order_items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%quantity_received%'

UNION ALL

-- Check for remaining triggers
SELECT 
    'TRIGGER' AS type,
    trigger_name AS name,
    action_statement AS definition
FROM information_schema.triggers
WHERE event_object_table = 'purchase_order_items'
    AND (trigger_name LIKE '%quantity%' OR action_statement LIKE '%quantity%');

-- If the query above returns no rows, everything has been successfully removed!
-- You should now be able to save return goods with quantity_received > quantity_ordered
