-- Create return_goods table to store return goods records
CREATE TABLE IF NOT EXISTS return_goods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  po_number VARCHAR(50) NOT NULL,
  reported_by VARCHAR(255) NOT NULL,
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  items JSONB NOT NULL, -- Array of items with item_id, quantity_ordered, quantity_received, excess_quantity
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on purchase_order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_return_goods_purchase_order_id ON return_goods(purchase_order_id);

-- Create index on po_number for faster searches
CREATE INDEX IF NOT EXISTS idx_return_goods_po_number ON return_goods(po_number);

-- Create index on reported_at for date filtering
CREATE INDEX IF NOT EXISTS idx_return_goods_reported_at ON return_goods(reported_at);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE return_goods ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read return goods
CREATE POLICY "Allow authenticated users to read return goods"
  ON return_goods
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow authenticated users to insert return goods
CREATE POLICY "Allow authenticated users to insert return goods"
  ON return_goods
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy to allow authenticated users to update return goods
CREATE POLICY "Allow authenticated users to update return goods"
  ON return_goods
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

