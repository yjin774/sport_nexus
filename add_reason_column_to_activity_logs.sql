-- ============================================
-- Add 'reason' column to activity_logs table
-- ============================================

-- Add reason column (nullable text field)
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add comment to document the column
COMMENT ON COLUMN activity_logs.reason IS 'Optional reason provided by staff when performing authenticated actions';
