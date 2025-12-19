-- ============================================
-- Member Points Transaction Table
-- ============================================
-- This table tracks individual point transactions for members
-- Each transaction represents a batch of points earned at a specific time
-- Points expire individually based on when they were earned (FIFO expiration)

CREATE TABLE IF NOT EXISTS member_points_transaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'voided')),
  points INTEGER NOT NULL, -- Positive for earned/adjusted, negative for redeemed
  
  -- Balance tracking
  balance_after INTEGER NOT NULL, -- Points balance after this transaction
  
  -- Expiration tracking
  earned_at TIMESTAMPTZ NOT NULL, -- When these points were earned (for earned transactions)
  expires_at TIMESTAMPTZ NOT NULL, -- When these points expire (only relevant for 'earned' type)
  
  -- Reference to source transaction
  reference_id UUID, -- Links to receipt/sale/purchase_order/transaction
  reference_type VARCHAR(50), -- 'sale', 'purchase', 'adjustment', 'manual', etc.
  description TEXT, -- Optional description of the transaction
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id), -- Staff member who created this transaction
  
  -- Ensure expires_at is after earned_at for earned transactions
  CONSTRAINT check_expiration CHECK (
    transaction_type != 'earned' OR expires_at > earned_at
  )
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_member_points_member_id ON member_points_transaction(member_id);
CREATE INDEX IF NOT EXISTS idx_member_points_expires_at ON member_points_transaction(expires_at);
-- Partial index for active points (earned/adjusted transactions only, excludes expired at query time)
CREATE INDEX IF NOT EXISTS idx_member_points_active ON member_points_transaction(member_id, expires_at) 
  WHERE transaction_type IN ('earned', 'adjusted');
CREATE INDEX IF NOT EXISTS idx_member_points_earned_at ON member_points_transaction(member_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_points_reference ON member_points_transaction(reference_id, reference_type);

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================
ALTER TABLE member_points_transaction ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view all point transactions
CREATE POLICY "Staff can view point transactions"
  ON member_points_transaction
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid()::text::uuid
    )
  );

-- Policy: Staff can insert point transactions
CREATE POLICY "Staff can insert point transactions"
  ON member_points_transaction
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid()::text::uuid
    )
  );

-- Policy: Staff can update point transactions (for adjustments)
CREATE POLICY "Staff can update point transactions"
  ON member_points_transaction
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid()::text::uuid
    )
  );

-- ============================================
-- Helper Function: Get Active Points Balance
-- ============================================
-- This function calculates the current active (non-expired) points for a member
CREATE OR REPLACE FUNCTION get_member_active_points(p_member_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(points)
    FROM member_points_transaction
    WHERE member_id = p_member_id
      AND transaction_type IN ('earned', 'adjusted')
      AND expires_at > NOW()
      AND points > 0
  ), 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Helper Function: Get Points Batches (for FIFO redemption)
-- ============================================
-- Returns active point batches ordered by expiration (oldest first) for FIFO redemption
-- This view can be used to determine which points to redeem first
-- Note: Filters out expired points at query time (NOW() is evaluated when view is queried)
CREATE OR REPLACE VIEW member_points_batches AS
SELECT 
  id,
  member_id,
  points as remaining_points,
  earned_at,
  expires_at,
  reference_type,
  description,
  created_at
FROM member_points_transaction
WHERE transaction_type = 'earned'
  AND expires_at > NOW() -- This is fine in a view, as NOW() is evaluated at query time
  AND points > 0
ORDER BY expires_at ASC, earned_at ASC;

-- ============================================
-- Notes on Usage
-- ============================================
-- 1. When a member earns points (e.g., from a purchase):
--    INSERT INTO member_points_transaction (member_id, transaction_type, points, balance_after, earned_at, expires_at, reference_id, reference_type, description)
--    VALUES (member_id, 'earned', 100, new_balance, NOW(), NOW() + INTERVAL '365 days', sale_id, 'sale', 'Points earned from purchase');
--
-- 2. When redeeming points (FIFO - use oldest points first):
--    - Query member_points_batches for the member
--    - Deduct points from oldest batches first
--    - Create 'redeemed' transactions with negative points
--
-- 3. To get current active points:
--    SELECT get_member_active_points(member_id);
--
-- 4. To get all active batches with expiration dates:
--    SELECT * FROM member_points_batches WHERE member_id = '...';