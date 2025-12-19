# Member Points Transaction System Documentation

## Overview

This system implements a **transaction-based points tracking** with **FIFO (First In, First Out) expiration**. Each batch of points earned has its own expiration date, and points expire individually based on when they were earned.

## How It Works

### Example Scenario

1. **January 1, 2024**: Customer A purchases and earns **20 points**
   - Points expire: January 1, 2025 (1 year from earning date)
   - This is **Batch 1**

2. **February 15, 2024**: Customer A purchases again and earns **30 points**
   - Points expire: February 15, 2025 (1 year from earning date)
   - This is **Batch 2**

3. **March 10, 2024**: Customer A purchases again and earns **50 points**
   - Points expire: March 10, 2025 (1 year from earning date)
   - This is **Batch 3**

**Result**: Customer A has **3 separate batches** (20 + 30 + 50 = 100 total points), each expiring at different times.

## Database Structure

### Table: `member_points_transaction`

Tracks every points transaction (earned, redeemed, expired, adjusted).

**Key Fields:**
- `points`: Number of points (positive for earned, negative for redeemed)
- `earned_at`: When the points were earned
- `expires_at`: When these specific points expire
- `transaction_type`: 'earned', 'redeemed', 'expired', 'adjusted', 'voided'
- `balance_after`: Running balance after this transaction
- `reference_id`: Links to the source (sale, purchase order, etc.)

### Indexes

Optimized queries for:
- Finding active points by member
- Finding points expiring soon
- FIFO redemption (oldest first)

## Redemption Logic (FIFO)

When a member redeems points:
1. Query active point batches ordered by `expires_at ASC, earned_at ASC`
2. Deduct points from **oldest batches first**
3. Create a 'redeemed' transaction with negative points
4. Update remaining points in each affected batch

**Example:**
- Member has: Batch 1 (20 pts, expires Jan 1), Batch 2 (30 pts, expires Feb 15)
- Member redeems 25 points
- System uses: 20 pts from Batch 1 (fully used) + 5 pts from Batch 2 (25 remaining)

## UI Display

### Member Points Popup

The popup shows:

1. **Total Points Card**: Large display of total available points
2. **Points Breakdown**: List of all active batches showing:
   - Points in each batch
   - Date earned
   - Expiration date
   - Days remaining
   - Visual indicators:
     - **Green**: Active (more than 7 days remaining)
     - **Orange**: Expiring soon (7 days or less)
     - **Red**: Expired

### Features

- Scrollable list for many batches
- Color-coded expiration warnings
- Clear date formatting
- Fallback support for legacy data (members without transactions)

## Migration Notes

### For Existing Members

The system includes fallback logic:
- If no transactions exist, uses the old `member.member_points` field
- Calculates expiration from `member.updated_at` + `points_duration_days`
- Displays as a single batch

### To Migrate Existing Points

You'll need to create initial transactions for existing members:

```sql
-- Example: Migrate existing points for a member
INSERT INTO member_points_transaction (
  member_id, 
  transaction_type, 
  points, 
  balance_after,
  earned_at, 
  expires_at, 
  reference_type, 
  description
)
SELECT 
  id,
  'earned',
  member_points,
  member_points,
  COALESCE(updated_at, created_at) as earned_at,
  COALESCE(updated_at, created_at) + INTERVAL '365 days' as expires_at,
  'migration',
  'Initial points migration from legacy system'
FROM member
WHERE member_points > 0;
```

## Usage Examples

### Earning Points (from a sale)

```sql
INSERT INTO member_points_transaction (
  member_id,
  transaction_type,
  points,
  balance_after,
  earned_at,
  expires_at,
  reference_id,
  reference_type,
  description,
  created_by
)
VALUES (
  'member-uuid',
  'earned',
  100,
  get_member_active_points('member-uuid') + 100,
  NOW(),
  NOW() + (SELECT points_duration_days FROM member_policy WHERE singleton = true) * INTERVAL '1 day',
  'sale-uuid',
  'sale',
  'Points earned from purchase #12345',
  'staff-uuid'
);
```

### Getting Active Points

```sql
-- Using the helper function
SELECT get_member_active_points('member-uuid');

-- Or directly
SELECT SUM(points)
FROM member_points_transaction
WHERE member_id = 'member-uuid'
  AND transaction_type IN ('earned', 'adjusted')
  AND expires_at > NOW()
  AND points > 0;
```

### Getting Points Batches (for display)

```sql
SELECT 
  points,
  earned_at,
  expires_at,
  description
FROM member_points_transaction
WHERE member_id = 'member-uuid'
  AND transaction_type = 'earned'
  AND expires_at > NOW()
  AND points > 0
ORDER BY expires_at ASC, earned_at ASC;
```

## Benefits

1. **Accurate Expiration**: Each batch expires independently
2. **FIFO Compliance**: Natural ordering for redemption
3. **Audit Trail**: Complete history of all point transactions
4. **Flexibility**: Supports adjustments, voiding, and complex scenarios
5. **Performance**: Indexed for fast queries
6. **Transparency**: Members can see exactly when each batch expires

## Next Steps

1. Run the SQL migration script: `create_member_points_transaction_table.sql`
2. Update your point earning logic to create transactions
3. Update your point redemption logic to use FIFO
4. Consider migrating existing points to the new system
5. Set up automated cleanup for expired points (optional)