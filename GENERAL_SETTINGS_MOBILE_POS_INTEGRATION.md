# General Settings & Mobile POS Integration Guide

This document explains the database schema and workflow for integrating the website's general settings with the mobile POS system.

## Database Tables Overview

### 1. `settings` - General Business Settings
Stores general business information including working hours, which controls the mobile POS closing counter function.

### 2. `member_policy` - Member Loyalty Program Settings
Stores member points policy that mobile POS queries in real-time for points calculation.

### 3. `stock_count_requests` - Stock Take Requests
Stores stock take requests sent from the website. Mobile POS queries this table for pending requests.

### 4. `stock_count_items` - Stock Take Item Details
Stores individual items in a stock count request. Mobile POS inserts/updates items as they count.

### 5. `activity_logs` - Activity Log Book
Stores all user actions from both website and mobile POS for audit trail.

---

## Workflow 1: Working Hours & Closing Counter

### Website Side (general-settings.html)
1. Admin updates working hours in `general-settings.html`
2. `saveGeneralSettings()` function updates the `settings` table
3. `working_hours_end` field is updated

### Mobile POS Side
1. Mobile POS queries `settings` table periodically (e.g., every minute) or on app start
2. Check if current time >= `working_hours_end`
3. If true: Enable closing counter button
4. If false: Disable closing counter button

### SQL Query for Mobile POS
```sql
-- Get closing time
SELECT working_hours_end 
FROM settings 
WHERE singleton = true;

-- Or use Supabase client
const { data, error } = await supabase
  .from('settings')
  .select('working_hours_end')
  .eq('singleton', true)
  .single();
```

### JavaScript Example (Mobile POS)
```javascript
async function checkClosingTime() {
  const { data, error } = await supabase
    .from('settings')
    .select('working_hours_end')
    .eq('singleton', true)
    .single();
  
  if (error) {
    console.error('Error fetching closing time:', error);
    return false;
  }
  
  const now = new Date();
  const closingTime = new Date();
  const [hours, minutes] = data.working_hours_end.split(':');
  closingTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Enable button if current time >= closing time
  const canClose = now >= closingTime;
  document.getElementById('closing-counter-btn').disabled = !canClose;
  
  return canClose;
}

// Check every minute
setInterval(checkClosingTime, 60000);
// Check on app start
checkClosingTime();
```

---

## Workflow 2: Stock Take Request

### Website Side (general-settings.html)
1. Admin clicks "SEND REQUEST" button
2. `sendStockCountRequest()` function creates a new row in `stock_count_requests` table
3. Status is set to `'pending'`
4. Request is visible in "VIEW HISTORY"

### Mobile POS Side
1. Mobile POS queries `stock_count_requests` table for `status = 'pending'`
2. Display pending requests to user
3. User selects a request and starts counting
4. Mobile POS updates request status to `'in_progress'`
5. For each item counted:
   - Insert/update row in `stock_count_items` table
   - Set `counted_quantity`, `counted_by`, `counted_at`
6. When all items are counted:
   - Update request status to `'completed'`
   - Set `completed_by` and `completed_at`

### Website Side (After Mobile POS Completion)
1. Website queries `stock_count_requests` where `status = 'completed'`
2. Display completed requests in history
3. User clicks "VIEW STOCK" to see details
4. Navigate to `stock-take-details.html` showing all items with differences

### SQL Queries

#### Website: Create Stock Count Request
```sql
INSERT INTO stock_count_requests (
  requested_by,
  requested_by_name,
  request_date,
  status
) VALUES (
  'user-uuid-here',
  'Admin User',
  NOW(),
  'pending'
);
```

#### Mobile POS: Get Pending Requests
```sql
SELECT 
  id,
  request_number,
  requested_by_name,
  request_date,
  notes
FROM stock_count_requests
WHERE status = 'pending'
ORDER BY request_date DESC;
```

#### Mobile POS: Start Counting
```sql
UPDATE stock_count_requests
SET 
  status = 'in_progress',
  started_by = 'mobile-user-uuid',
  started_at = NOW()
WHERE id = 'request-id-here';
```

#### Mobile POS: Insert Counted Item
```sql
INSERT INTO stock_count_items (
  stock_count_request_id,
  product_variant_id,
  product_code,
  product_name,
  variant_name,
  sku,
  expected_quantity,
  counted_quantity,
  unit_cost,
  counted_by,
  counted_at
) VALUES (
  'request-id-here',
  'variant-uuid-here',
  'PROD001',
  'Product Name',
  'Size M',
  'SKU-001',
  100,  -- Expected from system
  95,   -- Actual counted
  25.50,
  'mobile-user-uuid',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  counted_quantity = EXCLUDED.counted_quantity,
  counted_by = EXCLUDED.counted_by,
  counted_at = EXCLUDED.counted_at,
  updated_at = NOW();
```

#### Mobile POS: Complete Request
```sql
UPDATE stock_count_requests
SET 
  status = 'completed',
  completed_by = 'mobile-user-uuid',
  completed_at = NOW()
WHERE id = 'request-id-here';
```

#### Website: Get Stock Count Details
```sql
SELECT 
  scr.*,
  json_agg(
    json_build_object(
      'id', sci.id,
      'product_name', sci.product_name,
      'variant_name', sci.variant_name,
      'sku', sci.sku,
      'expected_quantity', sci.expected_quantity,
      'counted_quantity', sci.counted_quantity,
      'difference_quantity', sci.difference_quantity,
      'difference_value', sci.difference_value
    )
  ) as items
FROM stock_count_requests scr
LEFT JOIN stock_count_items sci ON sci.stock_count_request_id = scr.id
WHERE scr.id = 'request-id-here'
GROUP BY scr.id;
```

---

## Workflow 3: Member Policy Settings

### Website Side (general-settings.html)
1. Admin updates member policy settings
2. `saveMemberPolicySettings()` function updates the `member_policy` table
3. Changes are saved immediately

### Mobile POS Side
1. Mobile POS queries `member_policy` table when:
   - App starts
   - Before calculating points for a transaction
   - Periodically (e.g., every 5 minutes) to get real-time updates
2. Use the policy values to calculate points:
   - Check if transaction amount >= `min_purchase_amount_for_points`
   - Calculate points: `(transaction_amount * bill_ratio_percentage / 100)`
   - Points expire after `points_duration_days`

### SQL Query for Mobile POS
```sql
SELECT 
  points_to_rm_ratio,
  points_duration_days,
  bill_ratio_percentage,
  min_purchase_amount_for_points,
  updated_at
FROM member_policy
WHERE singleton = true;
```

### JavaScript Example (Mobile POS)
```javascript
let memberPolicy = null;
let lastPolicyUpdate = null;

async function getMemberPolicy() {
  // Check if we need to refresh (every 5 minutes)
  const now = new Date();
  if (memberPolicy && lastPolicyUpdate) {
    const minutesSinceUpdate = (now - lastPolicyUpdate) / 60000;
    if (minutesSinceUpdate < 5) {
      return memberPolicy; // Use cached policy
    }
  }
  
  const { data, error } = await supabase
    .from('member_policy')
    .select('*')
    .eq('singleton', true)
    .single();
  
  if (error) {
    console.error('Error fetching member policy:', error);
    return memberPolicy; // Return cached if available
  }
  
  memberPolicy = data;
  lastPolicyUpdate = now;
  return memberPolicy;
}

async function calculateMemberPoints(transactionAmount) {
  const policy = await getMemberPolicy();
  
  // Check minimum purchase amount
  if (transactionAmount < policy.min_purchase_amount_for_points) {
    return 0;
  }
  
  // Calculate points based on bill ratio
  const points = Math.floor(
    (transactionAmount * policy.bill_ratio_percentage) / 100
  );
  
  return points;
}

// Use in transaction processing
const transactionAmount = 100.00; // RM 100
const pointsEarned = await calculateMemberPoints(transactionAmount);
console.log(`Member earns ${pointsEarned} points`);
```

---

## Workflow 4: Activity Logs (Log Book)

### Recording Activities

Both website and mobile POS should log all user actions to the `activity_logs` table.

### Website Side
```javascript
async function logActivity(activityType, entityType, entityId, description, oldValue, newValue) {
  const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
  
  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: userSession.userData?.id,
      user_name: userSession.userData?.username || userSession.userData?.email,
      user_type: 'staff',
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      action_description: description,
      old_value: oldValue,
      new_value: newValue,
      source: 'website',
      status: 'success',
      timestamp: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error logging activity:', error);
  }
}

// Example usage
logActivity(
  'update',
  'settings',
  settingsId,
  'Updated working hours',
  { working_hours_end: '18:00:00' },
  { working_hours_end: '20:00:00' }
);
```

### Mobile POS Side
```javascript
async function logActivity(activityType, entityType, entityId, description, deviceId) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: user.id,
      user_name: user.email,
      user_type: 'staff',
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      action_description: description,
      source: 'mobile_pos',
      device_id: deviceId,
      status: 'success',
      timestamp: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error logging activity:', error);
  }
}

// Example usage
logActivity(
  'stock_count_complete',
  'stock_count',
  requestId,
  'Completed stock count for request STC-2025-001',
  'device-uuid-here'
);
```

### Website: View Log Book
```sql
SELECT 
  timestamp,
  user_name,
  activity_type,
  entity_type,
  action_description,
  source
FROM activity_logs
WHERE timestamp >= '2025-01-01'::date
  AND timestamp <= '2025-12-31'::date
ORDER BY timestamp DESC
LIMIT 100;
```

---

## Real-time Updates (Optional)

For real-time updates without polling, consider using Supabase Realtime:

### Mobile POS: Subscribe to Settings Changes
```javascript
// Subscribe to settings changes
const settingsChannel = supabase
  .channel('settings-changes')
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'settings' 
    },
    (payload) => {
      console.log('Settings updated:', payload.new);
      // Refresh closing time check
      checkClosingTime();
    }
  )
  .subscribe();

// Subscribe to member policy changes
const policyChannel = supabase
  .channel('member-policy-changes')
  .on('postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'member_policy'
    },
    (payload) => {
      console.log('Member policy updated:', payload.new);
      // Refresh member policy cache
      memberPolicy = payload.new;
      lastPolicyUpdate = new Date();
    }
  )
  .subscribe();

// Subscribe to new stock count requests
const stockCountChannel = supabase
  .channel('stock-count-requests')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'stock_count_requests',
      filter: 'status=eq.pending'
    },
    (payload) => {
      console.log('New stock count request:', payload.new);
      // Show notification to user
      showNotification('New stock count request received!');
    }
  )
  .subscribe();
```

---

## Summary

1. **Working Hours**: Mobile POS polls `settings.working_hours_end` to enable/disable closing counter
2. **Stock Take**: Website creates request → Mobile POS queries pending → Mobile POS counts → Mobile POS uploads → Website displays results
3. **Member Policy**: Mobile POS queries `member_policy` table in real-time (or uses Realtime subscription) for points calculation
4. **Log Book**: Both website and mobile POS insert into `activity_logs` table with `source` field to distinguish origin

All tables are designed with proper indexes, foreign keys, and RLS policies for security.

