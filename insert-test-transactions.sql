-- ============================================
-- INSERT TEST DATA FOR TRANSACTIONS TABLE
-- ============================================
-- This script inserts sample sales data for testing the statistic page graphs

-- First, let's get a staff user_id to use (or use NULL if not available)
-- You may need to adjust these based on your actual staff table data

-- Insert test transactions for the past 6 weeks (to match chart data)
-- Transaction dates spread across different days to create realistic sales patterns

-- Week 1 transactions (6 weeks ago)
INSERT INTO transactions (transaction_number, transaction_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, transaction_type) VALUES
('TXN001', NOW() - INTERVAL '42 days', 500.00, 25.00, 0.00, 475.00, 'cash', 'completed', 'sale'),
('TXN002', NOW() - INTERVAL '41 days', 1200.00, 60.00, 0.00, 1140.00, 'card', 'completed', 'sale'),
('TXN003', NOW() - INTERVAL '40 days', 800.00, 40.00, 0.00, 760.00, 'cash', 'completed', 'sale'),
('TXN004', NOW() - INTERVAL '39 days', 1500.00, 75.00, 0.00, 1425.00, 'card', 'completed', 'sale'),
('TXN005', NOW() - INTERVAL '38 days', 950.00, 47.50, 0.00, 902.50, 'cash', 'completed', 'sale');

-- Week 2 transactions (5 weeks ago)
INSERT INTO transactions (transaction_number, transaction_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, transaction_type) VALUES
('TXN006', NOW() - INTERVAL '35 days', 1100.00, 55.00, 0.00, 1045.00, 'card', 'completed', 'sale'),
('TXN007', NOW() - INTERVAL '34 days', 1300.00, 65.00, 0.00, 1235.00, 'card', 'completed', 'sale'),
('TXN008', NOW() - INTERVAL '33 days', 700.00, 35.00, 0.00, 665.00, 'cash', 'completed', 'sale'),
('TXN009', NOW() - INTERVAL '32 days', 1600.00, 80.00, 0.00, 1520.00, 'card', 'completed', 'sale'),
('TXN010', NOW() - INTERVAL '31 days', 1000.00, 50.00, 0.00, 950.00, 'cash', 'completed', 'sale');

-- Week 3 transactions (4 weeks ago)
INSERT INTO transactions (transaction_number, transaction_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, transaction_type) VALUES
('TXN011', NOW() - INTERVAL '28 days', 900.00, 45.00, 0.00, 855.00, 'cash', 'completed', 'sale'),
('TXN012', NOW() - INTERVAL '27 days', 1400.00, 70.00, 0.00, 1330.00, 'card', 'completed', 'sale'),
('TXN013', NOW() - INTERVAL '26 days', 1050.00, 52.50, 0.00, 997.50, 'card', 'completed', 'sale'),
('TXN014', NOW() - INTERVAL '25 days', 750.00, 37.50, 0.00, 712.50, 'cash', 'completed', 'sale'),
('TXN015', NOW() - INTERVAL '24 days', 1250.00, 62.50, 0.00, 1187.50, 'card', 'completed', 'sale');

-- Week 4 transactions (3 weeks ago)
INSERT INTO transactions (transaction_number, transaction_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, transaction_type) VALUES
('TXN016', NOW() - INTERVAL '21 days', 1700.00, 85.00, 0.00, 1615.00, 'card', 'completed', 'sale'),
('TXN017', NOW() - INTERVAL '20 days', 1150.00, 57.50, 0.00, 1092.50, 'card', 'completed', 'sale'),
('TXN018', NOW() - INTERVAL '19 days', 1350.00, 67.50, 0.00, 1282.50, 'card', 'completed', 'sale'),
('TXN019', NOW() - INTERVAL '18 days', 850.00, 42.50, 0.00, 807.50, 'cash', 'completed', 'sale'),
('TXN020', NOW() - INTERVAL '17 days', 1100.00, 55.00, 0.00, 1045.00, 'card', 'completed', 'sale');

-- Week 5 transactions (2 weeks ago)
INSERT INTO transactions (transaction_number, transaction_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, transaction_type) VALUES
('TXN021', NOW() - INTERVAL '14 days', 1000.00, 50.00, 0.00, 950.00, 'cash', 'completed', 'sale'),
('TXN022', NOW() - INTERVAL '13 days', 1450.00, 72.50, 0.00, 1377.50, 'card', 'completed', 'sale'),
('TXN023', NOW() - INTERVAL '12 days', 1200.00, 60.00, 0.00, 1140.00, 'card', 'completed', 'sale'),
('TXN024', NOW() - INTERVAL '11 days', 950.00, 47.50, 0.00, 902.50, 'cash', 'completed', 'sale'),
('TXN025', NOW() - INTERVAL '10 days', 1300.00, 65.00, 0.00, 1235.00, 'card', 'completed', 'sale');

-- Week 6 transactions (1 week ago / current week)
INSERT INTO transactions (transaction_number, transaction_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, transaction_type) VALUES
('TXN026', NOW() - INTERVAL '7 days', 1500.00, 75.00, 0.00, 1425.00, 'card', 'completed', 'sale'),
('TXN027', NOW() - INTERVAL '6 days', 1100.00, 55.00, 0.00, 1045.00, 'card', 'completed', 'sale'),
('TXN028', NOW() - INTERVAL '5 days', 1600.00, 80.00, 0.00, 1520.00, 'card', 'completed', 'sale'),
('TXN029', NOW() - INTERVAL '4 days', 1050.00, 52.50, 0.00, 997.50, 'cash', 'completed', 'sale'),
('TXN030', NOW() - INTERVAL '3 days', 1400.00, 70.00, 0.00, 1330.00, 'card', 'completed', 'sale'),
('TXN031', NOW() - INTERVAL '2 days', 1250.00, 62.50, 0.00, 1187.50, 'card', 'completed', 'sale'),
('TXN032', NOW() - INTERVAL '1 day', 1350.00, 67.50, 0.00, 1282.50, 'card', 'completed', 'sale'),
('TXN033', NOW(), 1200.00, 60.00, 0.00, 1140.00, 'card', 'completed', 'sale');

-- Insert some refund/return transactions for testing
INSERT INTO transactions (transaction_number, transaction_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, transaction_type) VALUES
('TXN034', NOW() - INTERVAL '10 days', 200.00, 0.00, 0.00, 200.00, 'card', 'completed', 'return'),
('TXN035', NOW() - INTERVAL '5 days', 150.00, 0.00, 0.00, 150.00, 'cash', 'completed', 'refund');

-- Insert some transaction items for a few transactions (optional, for detailed reporting)
-- Get transaction IDs first (these will be generated, so we'll use a subquery)
INSERT INTO transaction_items (transaction_id, product_name, quantity, unit_price, discount_amount, line_total, cost_price, profit)
SELECT 
  t.id,
  'Product A',
  2,
  250.00,
  25.00,
  475.00,
  150.00,
  175.00
FROM transactions t
WHERE t.transaction_number = 'TXN001'
LIMIT 1;

INSERT INTO transaction_items (transaction_id, product_name, quantity, unit_price, discount_amount, line_total, cost_price, profit)
SELECT 
  t.id,
  'Product B',
  3,
  400.00,
  60.00,
  1140.00,
  250.00,
  380.00
FROM transactions t
WHERE t.transaction_number = 'TXN002'
LIMIT 1;

INSERT INTO transaction_items (transaction_id, product_name, quantity, unit_price, discount_amount, line_total, cost_price, profit)
SELECT 
  t.id,
  'Product C',
  1,
  800.00,
  40.00,
  760.00,
  400.00,
  360.00
FROM transactions t
WHERE t.transaction_number = 'TXN003'
LIMIT 1;

-- Verify the data
SELECT 
  COUNT(*) as total_transactions,
  SUM(total_amount) as total_sales,
  SUM(discount_amount) as total_discounts,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM transactions
WHERE transaction_type = 'sale' AND status = 'completed';

