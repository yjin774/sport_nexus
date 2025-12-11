-- ============================================
-- INSERT ADDITIONAL TEST DATA FOR BETTER CHART VISUALIZATION
-- ============================================
-- This script adds more transactions to create better chart patterns
-- Run this after create-transactions-table.sql and insert-test-transactions.sql

-- Add more transactions for current month (last 30 days) to show "This Month" trend
INSERT INTO transactions (transaction_number, transaction_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, transaction_type) VALUES
-- Today's transactions
('TXN100', NOW(), 1800.00, 90.00, 0.00, 1710.00, 'card', 'completed', 'sale'),
('TXN101', NOW() - INTERVAL '1 hour', 950.00, 47.50, 0.00, 902.50, 'cash', 'completed', 'sale'),
('TXN102', NOW() - INTERVAL '2 hours', 2200.00, 110.00, 0.00, 2090.00, 'card', 'completed', 'sale'),

-- Yesterday
('TXN103', NOW() - INTERVAL '1 day', 1650.00, 82.50, 0.00, 1567.50, 'card', 'completed', 'sale'),
('TXN104', NOW() - INTERVAL '1 day' - INTERVAL '3 hours', 1100.00, 55.00, 0.00, 1045.00, 'card', 'completed', 'sale'),
('TXN105', NOW() - INTERVAL '1 day' - INTERVAL '6 hours', 1400.00, 70.00, 0.00, 1330.00, 'cash', 'completed', 'sale'),

-- 2 days ago
('TXN106', NOW() - INTERVAL '2 days', 1900.00, 95.00, 0.00, 1805.00, 'card', 'completed', 'sale'),
('TXN107', NOW() - INTERVAL '2 days' - INTERVAL '4 hours', 1250.00, 62.50, 0.00, 1187.50, 'card', 'completed', 'sale'),

-- 3 days ago
('TXN108', NOW() - INTERVAL '3 days', 1500.00, 75.00, 0.00, 1425.00, 'card', 'completed', 'sale'),
('TXN109', NOW() - INTERVAL '3 days' - INTERVAL '2 hours', 1000.00, 50.00, 0.00, 950.00, 'cash', 'completed', 'sale'),
('TXN110', NOW() - INTERVAL '3 days' - INTERVAL '5 hours', 1750.00, 87.50, 0.00, 1662.50, 'card', 'completed', 'sale'),

-- 4 days ago
('TXN111', NOW() - INTERVAL '4 days', 1300.00, 65.00, 0.00, 1235.00, 'card', 'completed', 'sale'),
('TXN112', NOW() - INTERVAL '4 days' - INTERVAL '3 hours', 1600.00, 80.00, 0.00, 1520.00, 'card', 'completed', 'sale'),

-- 5 days ago
('TXN113', NOW() - INTERVAL '5 days', 1450.00, 72.50, 0.00, 1377.50, 'card', 'completed', 'sale'),
('TXN114', NOW() - INTERVAL '5 days' - INTERVAL '2 hours', 1150.00, 57.50, 0.00, 1092.50, 'cash', 'completed', 'sale'),
('TXN115', NOW() - INTERVAL '5 days' - INTERVAL '6 hours', 2000.00, 100.00, 0.00, 1900.00, 'card', 'completed', 'sale'),

-- 6 days ago
('TXN116', NOW() - INTERVAL '6 days', 1200.00, 60.00, 0.00, 1140.00, 'card', 'completed', 'sale'),
('TXN117', NOW() - INTERVAL '6 days' - INTERVAL '4 hours', 1350.00, 67.50, 0.00, 1282.50, 'card', 'completed', 'sale'),

-- 7 days ago
('TXN118', NOW() - INTERVAL '7 days', 1550.00, 77.50, 0.00, 1472.50, 'card', 'completed', 'sale'),
('TXN119', NOW() - INTERVAL '7 days' - INTERVAL '2 hours', 1050.00, 52.50, 0.00, 997.50, 'cash', 'completed', 'sale'),
('TXN120', NOW() - INTERVAL '7 days' - INTERVAL '5 hours', 1850.00, 92.50, 0.00, 1757.50, 'card', 'completed', 'sale'),

-- 8-14 days ago (last week)
('TXN121', NOW() - INTERVAL '8 days', 1400.00, 70.00, 0.00, 1330.00, 'card', 'completed', 'sale'),
('TXN122', NOW() - INTERVAL '9 days', 1100.00, 55.00, 0.00, 1045.00, 'card', 'completed', 'sale'),
('TXN123', NOW() - INTERVAL '10 days', 1700.00, 85.00, 0.00, 1615.00, 'card', 'completed', 'sale'),
('TXN124', NOW() - INTERVAL '11 days', 1250.00, 62.50, 0.00, 1187.50, 'card', 'completed', 'sale'),
('TXN125', NOW() - INTERVAL '12 days', 1500.00, 75.00, 0.00, 1425.00, 'card', 'completed', 'sale'),
('TXN126', NOW() - INTERVAL '13 days', 1000.00, 50.00, 0.00, 950.00, 'cash', 'completed', 'sale'),
('TXN127', NOW() - INTERVAL '14 days', 1600.00, 80.00, 0.00, 1520.00, 'card', 'completed', 'sale'),

-- 15-21 days ago (2 weeks ago)
('TXN128', NOW() - INTERVAL '15 days', 1300.00, 65.00, 0.00, 1235.00, 'card', 'completed', 'sale'),
('TXN129', NOW() - INTERVAL '16 days', 1450.00, 72.50, 0.00, 1377.50, 'card', 'completed', 'sale'),
('TXN130', NOW() - INTERVAL '17 days', 1150.00, 57.50, 0.00, 1092.50, 'card', 'completed', 'sale'),
('TXN131', NOW() - INTERVAL '18 days', 1750.00, 87.50, 0.00, 1662.50, 'card', 'completed', 'sale'),
('TXN132', NOW() - INTERVAL '19 days', 1200.00, 60.00, 0.00, 1140.00, 'cash', 'completed', 'sale'),
('TXN133', NOW() - INTERVAL '20 days', 1550.00, 77.50, 0.00, 1472.50, 'card', 'completed', 'sale'),
('TXN134', NOW() - INTERVAL '21 days', 1050.00, 52.50, 0.00, 997.50, 'card', 'completed', 'sale'),

-- 22-30 days ago (last month for comparison)
('TXN135', NOW() - INTERVAL '22 days', 1400.00, 70.00, 0.00, 1330.00, 'card', 'completed', 'sale'),
('TXN136', NOW() - INTERVAL '23 days', 1100.00, 55.00, 0.00, 1045.00, 'card', 'completed', 'sale'),
('TXN137', NOW() - INTERVAL '24 days', 1600.00, 80.00, 0.00, 1520.00, 'card', 'completed', 'sale'),
('TXN138', NOW() - INTERVAL '25 days', 1250.00, 62.50, 0.00, 1187.50, 'card', 'completed', 'sale'),
('TXN139', NOW() - INTERVAL '26 days', 1500.00, 75.00, 0.00, 1425.00, 'card', 'completed', 'sale'),
('TXN140', NOW() - INTERVAL '27 days', 1000.00, 50.00, 0.00, 950.00, 'cash', 'completed', 'sale'),
('TXN141', NOW() - INTERVAL '28 days', 1700.00, 85.00, 0.00, 1615.00, 'card', 'completed', 'sale'),
('TXN142', NOW() - INTERVAL '29 days', 1350.00, 67.50, 0.00, 1282.50, 'card', 'completed', 'sale'),
('TXN143', NOW() - INTERVAL '30 days', 1450.00, 72.50, 0.00, 1377.50, 'card', 'completed', 'sale');

-- Add a few more refunds for testing
INSERT INTO transactions (transaction_number, transaction_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, status, transaction_type) VALUES
('TXN144', NOW() - INTERVAL '15 days', 300.00, 0.00, 0.00, 300.00, 'card', 'completed', 'return'),
('TXN145', NOW() - INTERVAL '8 days', 250.00, 0.00, 0.00, 250.00, 'cash', 'completed', 'refund'),
('TXN146', NOW() - INTERVAL '3 days', 180.00, 0.00, 0.00, 180.00, 'card', 'completed', 'return');

-- Verify the data distribution
SELECT 
  DATE(transaction_date) as sale_date,
  COUNT(*) as transaction_count,
  SUM(total_amount) as daily_total,
  SUM(discount_amount) as daily_discounts,
  SUM(CASE WHEN transaction_type IN ('return', 'refund') THEN total_amount ELSE 0 END) as daily_refunds
FROM transactions
WHERE transaction_type = 'sale' AND status = 'completed'
GROUP BY DATE(transaction_date)
ORDER BY sale_date DESC
LIMIT 30;

