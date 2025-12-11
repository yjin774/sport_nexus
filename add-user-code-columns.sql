-- Add user_code column to staff table
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS user_code TEXT;

-- Add user_code column to member table (if member_code doesn't exist, we'll use user_code)
-- If member_code already exists, this will be an additional column
ALTER TABLE member
ADD COLUMN IF NOT EXISTS user_code TEXT;

-- Add user_code column to supplier table
ALTER TABLE supplier
ADD COLUMN IF NOT EXISTS user_code TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN staff.user_code IS 'Unique user code for staff (e.g., STF123456)';
COMMENT ON COLUMN member.user_code IS 'Unique user code for member (e.g., MEM123456). Can be same as member_code if needed.';
COMMENT ON COLUMN supplier.user_code IS 'Unique user code for supplier (e.g., SUP123456)';

-- Optional: Create indexes for faster lookups (if needed)
CREATE INDEX IF NOT EXISTS idx_staff_user_code ON staff(user_code);
CREATE INDEX IF NOT EXISTS idx_member_user_code ON member(user_code);
CREATE INDEX IF NOT EXISTS idx_supplier_user_code ON supplier(user_code);

