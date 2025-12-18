-- ============================================
-- Add 'max_redemption_ratio_percentage' column to member_policy table
-- ============================================

-- Add max_redemption_ratio_percentage column (numeric field for percentage 0-100)
ALTER TABLE member_policy 
ADD COLUMN IF NOT EXISTS max_redemption_ratio_percentage NUMERIC(5,2) DEFAULT 20.00;

-- Add comment to document the column
COMMENT ON COLUMN member_policy.max_redemption_ratio_percentage IS 'Maximum redemption ratio as percentage of total bill (0-100). Default: 20%';

-- Update existing rows to have the default value if they don't have one
UPDATE member_policy 
SET max_redemption_ratio_percentage = 20.00 
WHERE max_redemption_ratio_percentage IS NULL;
