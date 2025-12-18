# General Settings Tables Summary

**Created:** December 16, 2025  
**Purpose:** Database schema for general settings, member policy, stock count, and activity logging functionality

---

## Overview

This document summarizes the 5 new tables created for the Sport Nexus general settings system:

1. `settings` - General business settings
2. `member_policy` - Member loyalty program policy
3. `stock_count_requests` - Stock take requests
4. `stock_count_items` - Stock take item details
5. `activity_logs` - Activity log book

---

## Table 1: `settings`

**Purpose:** Stores general business settings. Single row table (only one settings record allowed).  
**Mobile POS Integration:** Queries `working_hours_end` to enable/disable closing counter button.

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `singleton` | boolean | NO | true | Single row identifier (always true) |
| `business_name` | character varying(255) | YES | 'SPORT NEXUS' | Business name |
| `company_address` | text | YES | null | Company address |
| `working_hours_start` | time | YES | '09:00:00' | Opening time |
| `working_hours_end` | time | YES | '18:00:00' | **Closing time (controls mobile POS closing counter)** |
| `currency` | character varying(3) | YES | 'MYR' | Currency code |
| `language` | character varying(10) | YES | 'en' | Language code |
| `business_subscribed_date` | date | YES | null | Business subscription date |
| `created_at` | timestamp with time zone | YES | now() | Creation timestamp |
| `updated_at` | timestamp with time zone | YES | now() | Last update timestamp (auto-updated) |
| `updated_by` | uuid | YES | null | Staff ID who last updated (FK to `staff.id`) |

### Constraints
- **Primary Key:** `id`
- **Unique Constraint:** `settings_single_row` on `singleton` (ensures only one row)

### Indexes
- None (single row table)

### Triggers
- `update_settings_updated_at` - Auto-updates `updated_at` on UPDATE

---

## Table 2: `member_policy`

**Purpose:** Stores member loyalty program policy settings. Single row table (only one policy record allowed).  
**Mobile POS Integration:** Queried in real-time for points calculation during transactions.

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `singleton` | boolean | NO | true | Single row identifier (always true) |
| `points_to_rm_ratio` | numeric(10,2) | NO | 1.00 | **How many points = RM 1.00** (e.g., 1.00 = 1 point = RM 1.00) |
| `points_duration_days` | integer | NO | 365 | **How long points remain valid** (in days) |
| `bill_ratio_percentage` | numeric(5,2) | NO | 20.00 | **Percentage of bill that becomes points** (e.g., 20% = RM100 bill = 20 points) |
| `min_purchase_amount_for_points` | numeric(10,2) | NO | 0.00 | **Minimum purchase amount to earn points** (RM) |
| `created_at` | timestamp with time zone | YES | now() | Creation timestamp |
| `updated_at` | timestamp with time zone | YES | now() | Last update timestamp (auto-updated) |
| `updated_by` | uuid | YES | null | Staff ID who last updated (FK to `staff.id`) |

### Constraints
- **Primary Key:** `id`
- **Unique Constraint:** `member_policy_single_row` on `singleton` (ensures only one row)

### Indexes
- None (single row table)

### Triggers
- `update_member_policy_updated_at` - Auto-updates `updated_at` on UPDATE

---

## Table 3: `stock_count_requests`

**Purpose:** Stores stock take requests sent from website. Mobile POS queries for pending requests and updates status.  
**Workflow:** `pending` → `in_progress` → `completed` → `cancelled`

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `request_number` | character varying(100) | NO | (auto-generated) | **Auto-generated request number** (e.g., STC-2025-001) |
| `requested_by` | uuid | NO | null | Staff ID who created request (FK to `staff.id`) |
| `requested_by_name` | character varying(255) | YES | null | Staff name (for quick reference without join) |
| `request_date` | timestamp with time zone | NO | now() | Request creation date |
| `status` | character varying(50) | NO | 'pending' | **Status:** 'pending', 'in_progress', 'completed', 'cancelled' |
| `started_by` | uuid | YES | null | Staff ID who started count on mobile POS (FK to `staff.id`) |
| `started_at` | timestamp with time zone | YES | null | When mobile POS user started counting |
| `completed_by` | uuid | YES | null | Staff ID who completed count on mobile POS (FK to `staff.id`) |
| `completed_at` | timestamp with time zone | YES | null | When mobile POS user completed counting |
| `total_items` | integer | YES | 0 | Total items in count (auto-calculated) |
| `items_with_difference` | integer | YES | 0 | Items with quantity differences (auto-calculated) |
| `total_difference_value` | numeric(10,2) | YES | 0.00 | Total value of differences (auto-calculated) |
| `notes` | text | YES | null | Request notes |
| `created_at` | timestamp with time zone | YES | now() | Creation timestamp |
| `updated_at` | timestamp with time zone | YES | now() | Last update timestamp (auto-updated) |

### Constraints
- **Primary Key:** `id`
- **Unique Constraint:** `request_number` (unique)
- **Foreign Keys:**
  - `requested_by` → `staff.id`
  - `started_by` → `staff.id`
  - `completed_by` → `staff.id`

### Indexes
- `idx_stock_count_requests_status` on `status`
- `idx_stock_count_requests_requested_by` on `requested_by`
- `idx_stock_count_requests_request_date` on `request_date DESC`
- `idx_stock_count_requests_request_number` on `request_number`

### Triggers
- `update_stock_count_requests_updated_at` - Auto-updates `updated_at` on UPDATE
- `generate_stock_count_request_number_trigger` - Auto-generates `request_number` on INSERT if NULL

---

## Table 4: `stock_count_items`

**Purpose:** Stores individual items in a stock count request. Mobile POS inserts/updates items as they count.  
**Auto-calculated:** `difference_quantity` and `difference_value` are generated columns.

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `stock_count_request_id` | uuid | NO | null | Stock count request ID (FK to `stock_count_requests.id`) |
| `product_variant_id` | uuid | NO | null | Product variant ID (FK to `product_variants.id`) |
| `product_code` | character varying(100) | YES | null | Product code (for quick reference) |
| `product_name` | character varying(255) | YES | null | Product name (for quick reference) |
| `variant_name` | character varying(255) | YES | null | Variant name (for quick reference) |
| `sku` | character varying(100) | YES | null | SKU (for quick reference) |
| `category_id` | uuid | YES | null | Category ID (FK to `categories.id`) |
| `category_name` | character varying(255) | YES | null | Category name (for quick reference) |
| `expected_quantity` | integer | NO | 0 | **Expected stock from system** (from `product_variants.current_stock`) |
| `counted_quantity` | integer | YES | null | **Actual counted quantity from mobile POS** (NULL until counted) |
| `difference_quantity` | integer | (GENERATED) | (auto) | **Auto-calculated:** `counted_quantity - expected_quantity` |
| `unit_cost` | numeric(10,2) | YES | null | Unit cost (for value calculation) |
| `difference_value` | numeric(10,2) | (GENERATED) | (auto) | **Auto-calculated:** `difference_quantity * unit_cost` |
| `counted_by` | uuid | YES | null | Staff ID who counted this item (FK to `staff.id`) |
| `counted_at` | timestamp with time zone | YES | null | When this item was counted |
| `notes` | text | YES | null | Item notes |
| `created_at` | timestamp with time zone | YES | now() | Creation timestamp |
| `updated_at` | timestamp with time zone | YES | now() | Last update timestamp (auto-updated) |

### Constraints
- **Primary Key:** `id`
- **Foreign Keys:**
  - `stock_count_request_id` → `stock_count_requests.id` (ON DELETE CASCADE)
  - `product_variant_id` → `product_variants.id`
  - `category_id` → `categories.id`
  - `counted_by` → `staff.id`
- **Generated Columns:**
  - `difference_quantity` = `COALESCE(counted_quantity, 0) - expected_quantity`
  - `difference_value` = `(COALESCE(counted_quantity, 0) - expected_quantity) * COALESCE(unit_cost, 0)`

### Indexes
- `idx_stock_count_items_request_id` on `stock_count_request_id`
- `idx_stock_count_items_product_variant_id` on `product_variant_id`
- `idx_stock_count_items_category_id` on `category_id`
- `idx_stock_count_items_difference` on `difference_quantity` WHERE `difference_quantity != 0`

### Triggers
- `update_stock_count_items_updated_at` - Auto-updates `updated_at` on UPDATE
- `update_stock_count_summary_trigger` - Auto-updates summary stats in `stock_count_requests` when items change

---

## Table 5: `activity_logs`

**Purpose:** Stores all user actions from both website and mobile POS. Used for Log Book functionality and audit trail.

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `user_id` | uuid | YES | null | User ID (can reference `staff.id`, `supplier.id`, or `member.id`) |
| `user_name` | character varying(255) | YES | null | User name (for quick reference without join) |
| `user_type` | character varying(50) | YES | null | **User type:** 'staff', 'supplier', 'member', 'system' |
| `activity_type` | character varying(100) | NO | null | **Activity type:** 'create', 'update', 'delete', 'view', 'login', 'logout', 'stock_count_request', 'stock_count_complete', 'settings_updated', etc. |
| `entity_type` | character varying(100) | YES | null | **Entity type:** 'product', 'product_variant', 'purchase_order', 'transaction', 'member', 'staff', 'supplier', 'stock_count', 'settings', etc. |
| `entity_id` | uuid | YES | null | ID of the affected entity |
| `action_description` | text | NO | null | Human-readable description of the action |
| `old_value` | jsonb | YES | null | Previous values (JSON format, for updates) |
| `new_value` | jsonb | YES | null | New values (JSON format, for updates) |
| `source` | character varying(50) | NO | 'website' | **Source:** 'website', 'mobile_pos', 'system' |
| `device_id` | character varying(100) | YES | null | Device identifier (for mobile POS) |
| `status` | character varying(50) | YES | 'success' | **Status:** 'success', 'failed', 'pending' |
| `error_message` | text | YES | null | Error message (if status is 'failed') |
| `timestamp` | timestamp with time zone | NO | now() | Action timestamp |
| `ip_address` | character varying(50) | YES | null | IP address |
| `user_agent` | text | YES | null | User agent string |
| `created_at` | timestamp with time zone | YES | now() | Creation timestamp |

### Constraints
- **Primary Key:** `id`
- **Foreign Keys:** None (flexible user_id reference)

### Indexes
- `idx_activity_logs_user_id` on `user_id`
- `idx_activity_logs_timestamp` on `timestamp DESC`
- `idx_activity_logs_activity_type` on `activity_type`
- `idx_activity_logs_entity_type` on `entity_type`
- `idx_activity_logs_entity_id` on `entity_id`
- `idx_activity_logs_source` on `source`
- `idx_activity_logs_user_type` on `user_type`
- `idx_activity_logs_timestamp_user` on `timestamp DESC, user_id` (composite)

### Triggers
- None

---

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### `settings`
- **SELECT:** Authenticated users can read
- **UPDATE:** Authenticated users can update

### `member_policy`
- **SELECT:** Authenticated users can read
- **UPDATE:** Authenticated users can update

### `stock_count_requests`
- **SELECT:** Authenticated users can read
- **INSERT:** Authenticated users can create
- **UPDATE:** Authenticated users can update

### `stock_count_items`
- **SELECT:** Authenticated users can read
- **ALL (INSERT/UPDATE/DELETE):** Authenticated users can manage (for mobile POS)

### `activity_logs`
- **SELECT:** Authenticated users can read
- **INSERT:** Authenticated users can insert

---

## Database Functions

### 1. `update_updated_at_column()`
- **Purpose:** Auto-updates `updated_at` timestamp
- **Used by:** Triggers on `settings`, `member_policy`, `stock_count_requests`, `stock_count_items`

### 2. `generate_stock_count_request_number()`
- **Purpose:** Auto-generates stock count request numbers (e.g., STC-2025-001)
- **Format:** `STC-{YEAR}-{SEQUENCE}` (e.g., STC-2025-001, STC-2025-002)
- **Used by:** Trigger on `stock_count_requests` INSERT

### 3. `update_stock_count_summary()`
- **Purpose:** Auto-updates summary statistics in `stock_count_requests` when items are added/updated/deleted
- **Updates:**
  - `total_items` - Count of all items
  - `items_with_difference` - Count of items with differences
  - `total_difference_value` - Sum of absolute difference values
- **Used by:** Trigger on `stock_count_items` INSERT/UPDATE/DELETE

---

## Key Relationships

```
settings
  └── updated_by → staff.id

member_policy
  └── updated_by → staff.id

stock_count_requests
  ├── requested_by → staff.id
  ├── started_by → staff.id
  ├── completed_by → staff.id
  └── stock_count_items (one-to-many)

stock_count_items
  ├── stock_count_request_id → stock_count_requests.id (CASCADE DELETE)
  ├── product_variant_id → product_variants.id
  ├── category_id → categories.id
  └── counted_by → staff.id

activity_logs
  └── user_id → staff.id | supplier.id | member.id (flexible)
```

---

## Mobile POS Integration Points

### 1. **Closing Counter Control**
- **Table:** `settings`
- **Column:** `working_hours_end`
- **Query:** Mobile POS checks if current time >= `working_hours_end` to enable closing counter button

### 2. **Member Points Calculation**
- **Table:** `member_policy`
- **Columns:** `bill_ratio_percentage`, `min_purchase_amount_for_points`, `points_to_rm_ratio`
- **Query:** Mobile POS queries policy in real-time before calculating points

### 3. **Stock Count Workflow**
- **Table:** `stock_count_requests`
- **Query:** Mobile POS queries for `status = 'pending'` requests
- **Update:** Mobile POS updates status to `'in_progress'` → `'completed'`
- **Table:** `stock_count_items`
- **Insert/Update:** Mobile POS inserts/updates items as they count

### 4. **Activity Logging**
- **Table:** `activity_logs`
- **Insert:** Both website and mobile POS insert logs with `source` field ('website' or 'mobile_pos')

---

## Notes

1. **Single Row Tables:** `settings` and `member_policy` use a `singleton` boolean column with UNIQUE constraint to ensure only one row exists.

2. **Auto-Generated Values:**
   - Stock count request numbers are auto-generated (STC-YYYY-###)
   - `difference_quantity` and `difference_value` are generated columns (auto-calculated)
   - Summary statistics in `stock_count_requests` are auto-updated via trigger

3. **Cascade Delete:** Deleting a `stock_count_requests` record will automatically delete all related `stock_count_items` records.

4. **Flexible User Reference:** `activity_logs.user_id` can reference different user tables depending on `user_type`.

5. **Real-time Updates:** Mobile POS should query `member_policy` and `settings` tables periodically or use Supabase Realtime subscriptions for instant updates.

---

**Last Updated:** December 16, 2025

