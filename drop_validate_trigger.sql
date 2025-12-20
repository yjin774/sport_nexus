-- ============================================================================
-- DROP VALIDATE PO ITEM QUANTITY TRIGGER - TARGETED FIX
-- ============================================================================
-- This script specifically targets the validate_po_item_quantity trigger
-- that is preventing return goods functionality
--
-- Based on your query results, the trigger name is: validate_po_item_quantity
-- And the function is: validate_po_item_quantity_received()
-- ============================================================================

-- Step 1: Drop the trigger(s) - handle all possible variations
DO $$
DECLARE
    trigger_rec record;
BEGIN
    -- Find and drop all triggers that call validate_po_item_quantity_received
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
        RAISE NOTICE 'Dropped trigger: %.% on %.%',
            trigger_rec.event_object_schema,
            trigger_rec.trigger_name,
            trigger_rec.event_object_schema,
            trigger_rec.event_object_table;
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No matching triggers found';
    END IF;
END $$;

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS public.validate_po_item_quantity_received() CASCADE;

-- Step 3: Verify everything is removed
SELECT 
    'TRIGGER' AS type,
    trigger_name AS name,
    action_statement AS definition
FROM information_schema.triggers
WHERE event_object_table = 'purchase_order_items'
    AND (
        trigger_name LIKE '%validate_po_item_quantity%'
        OR action_statement LIKE '%validate_po_item_quantity_received%'
    );

-- If the query above returns no rows, the trigger has been successfully removed!
