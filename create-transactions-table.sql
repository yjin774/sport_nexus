-- ============================================
-- CREATE TRANSACTIONS TABLE FOR SALES DATA
-- ============================================
-- This table stores sales transaction headers
-- Based on DATA_MODEL_REFINEMENT.md and website requirements

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(100) UNIQUE NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID, -- Cashier/user who processed (references staff.id)
  member_id UUID, -- Member (if applicable, references member.id)
  device_id VARCHAR(100), -- POS device identifier
  session_id UUID, -- Device session reference
  transaction_type VARCHAR(50) DEFAULT 'sale' CHECK (transaction_type IN ('sale', 'return', 'exchange', 'refund')),
  original_transaction_id UUID REFERENCES transactions(id), -- Original transaction (for returns)
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_payment', 'mixed')),
  cash_amount DECIMAL(10,2),
  card_amount DECIMAL(10,2),
  change_amount DECIMAL(10,2) DEFAULT 0.00,
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled', 'refunded')),
  is_offline BOOLEAN DEFAULT false,
  synced_at TIMESTAMP WITH TIME ZONE,
  receipt_printed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction_items table for line items
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_variant_id UUID, -- Product variant reference (if products table exists)
  product_name VARCHAR(255), -- Product name at time of sale
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  line_total DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2), -- Cost price at time of sale (for profit calculation)
  profit DECIMAL(10,2), -- Profit for this line item
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);

-- Add comments to document the tables
COMMENT ON TABLE transactions IS 'Stores sales transaction headers';
COMMENT ON TABLE transaction_items IS 'Stores transaction line items';

COMMENT ON COLUMN transactions.transaction_number IS 'Unique transaction/receipt number';
COMMENT ON COLUMN transactions.transaction_date IS 'Date and time of transaction';
COMMENT ON COLUMN transactions.total_amount IS 'Final total amount after discounts and tax';
COMMENT ON COLUMN transactions.discount_amount IS 'Total discount amount applied';
COMMENT ON COLUMN transactions.subtotal IS 'Subtotal before tax and discount';

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions table
-- Policy: Allow all authenticated users to read transactions
CREATE POLICY "Allow authenticated users to read transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert transactions
CREATE POLICY "Allow authenticated users to insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update transactions
CREATE POLICY "Allow authenticated users to update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete transactions (for returns/refunds)
CREATE POLICY "Allow authenticated users to delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for transaction_items table
CREATE POLICY "Allow authenticated users to read transaction_items"
  ON transaction_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert transaction_items"
  ON transaction_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update transaction_items"
  ON transaction_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete transaction_items"
  ON transaction_items FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

