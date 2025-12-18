-- ============================================
-- GENERAL SETTINGS TABLES FOR SPORT NEXUS
-- ============================================
-- This script creates tables for:
-- 1. General Settings (business info, working hours, etc.)
-- 2. Member Policy Settings
-- 3. Stock Count Requests & Items
-- 4. Activity Logs (Log Book)
-- ============================================

-- ============================================
-- 1. SETTINGS TABLE
-- ============================================
-- Stores general business settings
-- Single row design - only one set of settings
-- Mobile POS will query this table to check closing time
CREATE TABLE IF NOT EXISTS settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Single row identifier (always '1' to enforce single row)
    singleton boolean DEFAULT true NOT NULL,
    
    -- Business Information
    business_name character varying(255) DEFAULT 'SPORT NEXUS',
    company_address text,
    
    -- Working Hours (for mobile POS closing counter control)
    working_hours_start time DEFAULT '09:00:00',
    working_hours_end time DEFAULT '18:00:00',
    
    -- System Settings
    currency character varying(3) DEFAULT 'MYR',
    language character varying(10) DEFAULT 'en',
    business_subscribed_date date,
    
    -- Metadata
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES staff(id),
    
    -- Ensure only one row exists
    CONSTRAINT settings_single_row UNIQUE (singleton)
);

-- Insert default settings row if it doesn't exist
INSERT INTO settings (singleton, business_name, working_hours_start, working_hours_end, currency, language, business_subscribed_date)
VALUES (
    true,
    'SPORT NEXUS',
    '09:00:00',
    '18:00:00',
    'MYR',
    'en',
    '2025-11-01'
)
ON CONFLICT (singleton) DO NOTHING;

-- ============================================
-- 2. MEMBER_POLICY TABLE
-- ============================================
-- Stores member loyalty program policy settings
-- Single row design - only one set of policy settings
-- Mobile POS will query this table in real-time for points calculation
CREATE TABLE IF NOT EXISTS member_policy (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Single row identifier (always '1' to enforce single row)
    singleton boolean DEFAULT true NOT NULL,
    
    -- Points Configuration
    points_to_rm_ratio numeric(10,2) DEFAULT 1.00 NOT NULL,
    -- How many points equal to RM 1.00 (e.g., 1.00 means 1 point = RM 1.00)
    
    points_duration_days integer DEFAULT 365 NOT NULL,
    -- How long member points remain valid (in days)
    
    -- Points Earning Configuration
    bill_ratio_percentage numeric(5,2) DEFAULT 20.00 NOT NULL,
    -- Percentage of total bill that becomes member points
    -- (e.g., 20% means RM100 bill = 20 points)
    
    min_purchase_amount_for_points numeric(10,2) DEFAULT 0.00 NOT NULL,
    -- Minimum purchase amount required to earn points
    
    -- Metadata
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES staff(id),
    
    -- Ensure only one row exists
    CONSTRAINT member_policy_single_row UNIQUE (singleton)
);

-- Insert default member policy row if it doesn't exist
INSERT INTO member_policy (singleton, points_to_rm_ratio, points_duration_days, bill_ratio_percentage, min_purchase_amount_for_points)
VALUES (
    true,
    1.00,
    365,
    20.00,
    0.00
)
ON CONFLICT (singleton) DO NOTHING;

-- ============================================
-- 3. STOCK_COUNT_REQUESTS TABLE
-- ============================================
-- Stores stock take requests sent from website
-- Mobile POS will query this table for pending requests
-- Status workflow: pending -> in_progress -> completed -> cancelled
CREATE TABLE IF NOT EXISTS stock_count_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request Information
    request_number character varying(100) UNIQUE NOT NULL,
    -- Auto-generated request number (e.g., STC-2025-001)
    
    requested_by uuid REFERENCES staff(id) NOT NULL,
    requested_by_name character varying(255),
    -- Store name for quick reference without join
    
    request_date timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Status Tracking
    status character varying(50) DEFAULT 'pending' NOT NULL,
    -- Values: 'pending', 'in_progress', 'completed', 'cancelled'
    
    -- Mobile POS Information
    started_by uuid REFERENCES staff(id),
    -- Staff member who started the count on mobile POS
    started_at timestamp with time zone,
    -- When mobile POS user started the count
    
    completed_by uuid REFERENCES staff(id),
    -- Staff member who completed the count on mobile POS
    completed_at timestamp with time zone,
    -- When mobile POS user completed the count
    
    -- Summary Information (calculated from items)
    total_items integer DEFAULT 0,
    items_with_difference integer DEFAULT 0,
    total_difference_value numeric(10,2) DEFAULT 0.00,
    
    -- Notes
    notes text,
    
    -- Metadata
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for stock_count_requests
CREATE INDEX IF NOT EXISTS idx_stock_count_requests_status ON stock_count_requests(status);
CREATE INDEX IF NOT EXISTS idx_stock_count_requests_requested_by ON stock_count_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_stock_count_requests_request_date ON stock_count_requests(request_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_count_requests_request_number ON stock_count_requests(request_number);

-- ============================================
-- 4. STOCK_COUNT_ITEMS TABLE
-- ============================================
-- Stores individual items in a stock count request
-- Mobile POS will insert/update items as they count
CREATE TABLE IF NOT EXISTS stock_count_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Key
    stock_count_request_id uuid REFERENCES stock_count_requests(id) ON DELETE CASCADE NOT NULL,
    
    -- Product Information
    product_variant_id uuid REFERENCES product_variants(id) NOT NULL,
    product_code character varying(100),
    product_name character varying(255),
    variant_name character varying(255),
    sku character varying(100),
    -- Store product info for quick reference without join
    
    -- Category
    category_id uuid REFERENCES categories(id),
    category_name character varying(255),
    
    -- Stock Count Values
    expected_quantity integer NOT NULL DEFAULT 0,
    -- Expected stock from system (from product_variants.current_stock)
    
    counted_quantity integer,
    -- Actual counted quantity from mobile POS (NULL until counted)
    
    difference_quantity integer GENERATED ALWAYS AS (COALESCE(counted_quantity, 0) - expected_quantity) STORED,
    -- Calculated difference
    
    -- Value Information (for reporting)
    unit_cost numeric(10,2),
    difference_value numeric(10,2) GENERATED ALWAYS AS ((COALESCE(counted_quantity, 0) - expected_quantity) * COALESCE(unit_cost, 0)) STORED,
    
    -- Counting Information
    counted_by uuid REFERENCES staff(id),
    -- Staff member who counted this item on mobile POS
    counted_at timestamp with time zone,
    -- When this item was counted
    
    -- Notes
    notes text,
    
    -- Metadata
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for stock_count_items
CREATE INDEX IF NOT EXISTS idx_stock_count_items_request_id ON stock_count_items(stock_count_request_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_items_product_variant_id ON stock_count_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_items_category_id ON stock_count_items(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_items_difference ON stock_count_items(difference_quantity) WHERE difference_quantity != 0;

-- ============================================
-- 5. ACTIVITY_LOGS TABLE
-- ============================================
-- Stores all user actions from both website and mobile POS
-- Used for Log Book functionality and audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    user_id uuid,
    -- Can reference staff.id, supplier.id, or member.id depending on user_type
    user_name character varying(255),
    -- Store name for quick reference without join
    user_type character varying(50),
    -- Values: 'staff', 'supplier', 'member', 'system'
    
    -- Action Information
    activity_type character varying(100) NOT NULL,
    -- Values: 'create', 'update', 'delete', 'view', 'login', 'logout', 
    --         'stock_count_request', 'stock_count_complete', 'settings_updated', etc.
    
    entity_type character varying(100),
    -- Values: 'product', 'product_variant', 'purchase_order', 'transaction', 
    --         'member', 'staff', 'supplier', 'stock_count', 'settings', etc.
    
    entity_id uuid,
    -- ID of the affected entity
    
    -- Action Details
    action_description text NOT NULL,
    -- Human-readable description of the action
    
    -- Change Tracking (for updates)
    old_value jsonb,
    -- Previous values (JSON format)
    new_value jsonb,
    -- New values (JSON format)
    
    -- Source Information
    source character varying(50) DEFAULT 'website' NOT NULL,
    -- Values: 'website', 'mobile_pos', 'system'
    
    device_id character varying(100),
    -- Device identifier for mobile POS
    
    -- Status
    status character varying(50) DEFAULT 'success',
    -- Values: 'success', 'failed', 'pending'
    
    error_message text,
    -- Error message if status is 'failed'
    
    -- Timestamp
    timestamp timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Metadata
    ip_address character varying(50),
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_source ON activity_logs(source);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type ON activity_logs(user_type);

-- Composite index for common queries (date range + user)
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp_user ON activity_logs(timestamp DESC, user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for member_policy table
DROP TRIGGER IF EXISTS update_member_policy_updated_at ON member_policy;
CREATE TRIGGER update_member_policy_updated_at
    BEFORE UPDATE ON member_policy
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for stock_count_requests table
DROP TRIGGER IF EXISTS update_stock_count_requests_updated_at ON stock_count_requests;
CREATE TRIGGER update_stock_count_requests_updated_at
    BEFORE UPDATE ON stock_count_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for stock_count_items table
DROP TRIGGER IF EXISTS update_stock_count_items_updated_at ON stock_count_items;
CREATE TRIGGER update_stock_count_items_updated_at
    BEFORE UPDATE ON stock_count_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate stock count request number
CREATE OR REPLACE FUNCTION generate_stock_count_request_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix text;
    sequence_num integer;
    new_number text;
BEGIN
    -- Get year prefix (e.g., 2025)
    year_prefix := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 'STC-\d{4}-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM stock_count_requests
    WHERE request_number LIKE 'STC-' || year_prefix || '-%';
    
    -- Generate new number (e.g., STC-2025-001)
    new_number := 'STC-' || year_prefix || '-' || LPAD(sequence_num::text, 3, '0');
    
    NEW.request_number := new_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request number
DROP TRIGGER IF EXISTS generate_stock_count_request_number_trigger ON stock_count_requests;
CREATE TRIGGER generate_stock_count_request_number_trigger
    BEFORE INSERT ON stock_count_requests
    FOR EACH ROW
    WHEN (NEW.request_number IS NULL)
    EXECUTE FUNCTION generate_stock_count_request_number();

-- Function to update stock_count_requests summary when items are updated
CREATE OR REPLACE FUNCTION update_stock_count_summary()
RETURNS TRIGGER AS $$
DECLARE
    request_id uuid;
BEGIN
    -- Determine which request_id to update
    IF TG_OP = 'DELETE' THEN
        request_id := OLD.stock_count_request_id;
    ELSE
        request_id := NEW.stock_count_request_id;
    END IF;
    
    -- Update summary statistics
    UPDATE stock_count_requests
    SET
        total_items = (
            SELECT COUNT(*) 
            FROM stock_count_items 
            WHERE stock_count_request_id = request_id
        ),
        items_with_difference = (
            SELECT COUNT(*) 
            FROM stock_count_items 
            WHERE stock_count_request_id = request_id 
            AND difference_quantity != 0
        ),
        total_difference_value = (
            SELECT COALESCE(SUM(ABS(difference_value)), 0)
            FROM stock_count_items
            WHERE stock_count_request_id = request_id
        ),
        updated_at = now()
    WHERE id = request_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update summary when items change
DROP TRIGGER IF EXISTS update_stock_count_summary_trigger ON stock_count_items;
CREATE TRIGGER update_stock_count_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON stock_count_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_count_summary();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read settings
CREATE POLICY "Allow authenticated read settings" ON settings
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert settings (needed for upsert)
CREATE POLICY "Allow authenticated insert settings" ON settings
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow staff/admin to update settings
CREATE POLICY "Allow staff update settings" ON settings
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to read member policy
CREATE POLICY "Allow authenticated read member_policy" ON member_policy
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Allow staff/admin to update member policy
CREATE POLICY "Allow staff update member_policy" ON member_policy
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to read stock count requests
CREATE POLICY "Allow authenticated read stock_count_requests" ON stock_count_requests
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Allow staff to create stock count requests
CREATE POLICY "Allow staff create stock_count_requests" ON stock_count_requests
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow staff to update stock count requests
CREATE POLICY "Allow staff update stock_count_requests" ON stock_count_requests
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to read stock count items
CREATE POLICY "Allow authenticated read stock_count_items" ON stock_count_items
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Allow staff to insert/update stock count items (for mobile POS)
CREATE POLICY "Allow staff manage stock_count_items" ON stock_count_items
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to read activity logs
CREATE POLICY "Allow authenticated read activity_logs" ON activity_logs
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert activity logs
CREATE POLICY "Allow authenticated insert activity_logs" ON activity_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE settings IS 'Stores general business settings. Mobile POS queries this table to check closing time for closing counter function.';
COMMENT ON COLUMN settings.working_hours_end IS 'Closing time. Mobile POS closing counter button becomes active when current time >= this time.';
COMMENT ON COLUMN settings.working_hours_start IS 'Opening time.';

COMMENT ON TABLE member_policy IS 'Stores member loyalty program policy settings. Mobile POS queries this table in real-time for points calculation.';
COMMENT ON COLUMN member_policy.points_to_rm_ratio IS 'How many points equal to RM 1.00 (e.g., 1.00 means 1 point = RM 1.00)';
COMMENT ON COLUMN member_policy.bill_ratio_percentage IS 'Percentage of total bill that becomes member points (e.g., 20% means RM100 = 20 points)';

COMMENT ON TABLE stock_count_requests IS 'Stores stock take requests sent from website. Mobile POS queries this table for pending requests.';
COMMENT ON COLUMN stock_count_requests.status IS 'Workflow: pending -> in_progress -> completed -> cancelled';

COMMENT ON TABLE stock_count_items IS 'Stores individual items in a stock count request. Mobile POS inserts/updates items as they count.';
COMMENT ON COLUMN stock_count_items.counted_quantity IS 'Actual counted quantity from mobile POS (NULL until counted)';
COMMENT ON COLUMN stock_count_items.expected_quantity IS 'Expected stock from system (from product_variants.current_stock)';

COMMENT ON TABLE activity_logs IS 'Stores all user actions from both website and mobile POS. Used for Log Book and audit trail.';
COMMENT ON COLUMN activity_logs.source IS 'Values: website, mobile_pos, system';
COMMENT ON COLUMN activity_logs.user_type IS 'Values: staff, supplier, member, system';

-- ============================================
-- END OF SCRIPT
-- ============================================

