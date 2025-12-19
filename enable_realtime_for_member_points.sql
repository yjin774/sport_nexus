-- Enable realtime for member points related tables
-- Note: Realtime cannot be enabled on views (like member_points_batches)
-- Enable realtime on the underlying tables instead

-- Enable realtime for member_points_transaction table (base table for points)
ALTER PUBLICATION supabase_realtime ADD TABLE member_points_transaction;

-- Enable realtime for member table (to track member_points column changes)
ALTER PUBLICATION supabase_realtime ADD TABLE member;

-- Note: If you need realtime updates for member_points_batches view data,
-- subscribe to the member_points_transaction table instead and filter in your application
-- The view will automatically reflect changes when the underlying table is updated
