-- Add member_points column to member table if it doesn't exist
-- This column stores the member's available loyalty points

ALTER TABLE member
ADD COLUMN IF NOT EXISTS member_points INTEGER DEFAULT 0;

-- Add comment to document the column
COMMENT ON COLUMN member.member_points IS 'Available member points for loyalty rewards';

-- Optional: Create index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_member_member_points ON member(member_points);

