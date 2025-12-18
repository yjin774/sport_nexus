# Mobile POS Integration - Quick Reference

## Supabase Connection
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://giksmtowehwmgqyymevp.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY'; // Use anon key for client-side
const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## 1. Check Closing Time (Enable/Disable Closing Counter Button)

```javascript
async function checkClosingTime() {
  const { data, error } = await supabase
    .from('settings')
    .select('working_hours_end')
    .eq('singleton', true)
    .single();
  
  if (error) return false;
  
  const now = new Date();
  const [hours, minutes] = data.working_hours_end.split(':');
  const closingTime = new Date();
  closingTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return now >= closingTime;
}

// Usage
const canClose = await checkClosingTime();
document.getElementById('closing-btn').disabled = !canClose;
```

---

## 2. Get Member Policy (For Points Calculation)

```javascript
async function getMemberPolicy() {
  const { data, error } = await supabase
    .from('member_policy')
    .select('*')
    .eq('singleton', true)
    .single();
  
  return data;
}

// Calculate points
async function calculatePoints(transactionAmount) {
  const policy = await getMemberPolicy();
  
  if (transactionAmount < policy.min_purchase_amount_for_points) {
    return 0;
  }
  
  return Math.floor(
    (transactionAmount * policy.bill_ratio_percentage) / 100
  );
}
```

---

## 3. Get Pending Stock Count Requests

```javascript
async function getPendingStockCountRequests() {
  const { data, error } = await supabase
    .from('stock_count_requests')
    .select('*')
    .eq('status', 'pending')
    .order('request_date', { ascending: false });
  
  return data || [];
}
```

---

## 4. Start Stock Count

```javascript
async function startStockCount(requestId, userId) {
  const { error } = await supabase
    .from('stock_count_requests')
    .update({
      status: 'in_progress',
      started_by: userId,
      started_at: new Date().toISOString()
    })
    .eq('id', requestId);
  
  return !error;
}
```

---

## 5. Save Counted Item

```javascript
async function saveCountedItem(requestId, item) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('stock_count_items')
    .insert({
      stock_count_request_id: requestId,
      product_variant_id: item.variantId,
      product_code: item.productCode,
      product_name: item.productName,
      variant_name: item.variantName,
      sku: item.sku,
      expected_quantity: item.expectedQty,
      counted_quantity: item.countedQty,
      unit_cost: item.unitCost,
      counted_by: user.id,
      counted_at: new Date().toISOString()
    });
  
  return !error;
}
```

---

## 6. Complete Stock Count

```javascript
async function completeStockCount(requestId, userId) {
  const { error } = await supabase
    .from('stock_count_requests')
    .update({
      status: 'completed',
      completed_by: userId,
      completed_at: new Date().toISOString()
    })
    .eq('id', requestId);
  
  return !error;
}
```

---

## 7. Log Activity

```javascript
async function logActivity(type, entityType, entityId, description, deviceId) {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase
    .from('activity_logs')
    .insert({
      user_id: user.id,
      user_name: user.email,
      user_type: 'staff',
      activity_type: type,
      entity_type: entityType,
      entity_id: entityId,
      action_description: description,
      source: 'mobile_pos',
      device_id: deviceId,
      status: 'success',
      timestamp: new Date().toISOString()
    });
}
```

---

## Real-time Subscriptions (Optional)

```javascript
// Subscribe to settings changes
supabase
  .channel('settings')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'settings' },
    (payload) => {
      // Settings updated, refresh closing time
      checkClosingTime();
    }
  )
  .subscribe();

// Subscribe to new stock count requests
supabase
  .channel('stock-counts')
  .on('postgres_changes',
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'stock_count_requests',
      filter: 'status=eq.pending'
    },
    (payload) => {
      // New request received
      showNotification('New stock count request!');
    }
  )
  .subscribe();
```

---

## Common Activity Types

- `login` - User logged in
- `logout` - User logged out
- `transaction_create` - Created a sale
- `transaction_complete` - Completed a sale
- `stock_count_start` - Started stock count
- `stock_count_complete` - Completed stock count
- `stock_count_item_counted` - Counted an item
- `settings_view` - Viewed settings
- `member_points_earned` - Member earned points
- `member_points_redeemed` - Member redeemed points

---

## Common Entity Types

- `transaction` - Sales transaction
- `stock_count` - Stock count request
- `stock_count_item` - Stock count item
- `member` - Member account
- `product` - Product
- `product_variant` - Product variant
- `settings` - System settings
- `member_policy` - Member policy

