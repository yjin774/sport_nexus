# SportNexus Supabase Database Schema Documentation

**Last Updated:** Auto-generated from database queries  
**Purpose:** Comprehensive documentation of all tables, columns, relationships, and constraints for debugging and development reference.

---

## 📋 Table of Contents

1. [Database Overview](#database-overview)
2. [Tables Summary](#tables-summary)
3. [Detailed Table Schemas](#detailed-table-schemas)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Indexes](#indexes)
6. [Row Level Security (RLS)](#row-level-security-rls)
7. [Triggers](#triggers)
8. [Data Types Summary](#data-types-summary)

---

## Database Overview

This document is generated from running the queries in `view-all-tables-columns.sql`. To update this documentation:

1. Run all queries in `view-all-tables-columns.sql` in Supabase SQL Editor
2. Copy the results and update this markdown file
3. Commit the updated documentation

---

## Tables Summary

| Table Name | Column Count | Primary Keys | Foreign Keys | Indexes | RLS Enabled |
|------------|--------------|--------------|--------------|---------|-------------|
| *Run Query #11 to populate* | | | | | |

---

## Detailed Table Schemas

### Categories Table (`categories`)

**Purpose:** Store product categories

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'categories'* | | | | |

**Primary Key:** `id` (UUID)  
**Foreign Keys:** `parent_category_id` → `categories(id)`  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Products Table (`products`)

**Purpose:** Store parent-level product information

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'products'* | | | | |

**Primary Key:** `id` (UUID)  
**Foreign Keys:** 
- `category_id` → `categories(id)`
- `created_by` → `auth.users(id)`

**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Product Variants Table (`product_variants`)

**Purpose:** Store detailed product variants (size, color, weight, etc.)

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'product_variants'* | | | | |

**Primary Key:** `id` (UUID)  
**Foreign Keys:** `product_id` → `products(id)` (CASCADE)  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Supplier Table (`supplier`)

**Purpose:** Store supplier information

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'supplier'* | | | | |

**Primary Key:** `id` (UUID)  
**Foreign Keys:** *Run Query #4*  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

**Note:** This table has been updated with additional columns for purchase order functionality:
- `lead_time_days` (INTEGER)
- `payment_terms` (VARCHAR(100))
- `credit_limit` (DECIMAL(10,2))
- `currency` (VARCHAR(3), default: 'MYR')
- `tax_id` (VARCHAR(100))
- `rating` (INTEGER, CHECK 1-5)
- Address fields: `address`, `city`, `state`, `postal_code`, `country`, `alternate_phone`

---

### Purchase Orders Table (`purchase_orders`)

**Purpose:** Store purchase order headers

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'purchase_orders'* | | | | |

**Primary Key:** `id` (UUID)  
**Foreign Keys:**
- `supplier_id` → `supplier(id)`
- `created_by` → `auth.users(id)`
- `approved_by` → `auth.users(id)`

**Status Values:** `'draft'`, `'pending'`, `'partially_received'`, `'completed'`, `'cancelled'`  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Purchase Order Items Table (`purchase_order_items`)

**Purpose:** Store purchase order line items

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'purchase_order_items'* | | | | |

**Primary Key:** `id` (UUID)  
**Foreign Keys:**
- `purchase_order_id` → `purchase_orders(id)` (CASCADE)
- `product_variant_id` → `product_variants(id)`

**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

**Triggers:**
- `calculate_po_item_line_total` - Auto-calculates `line_total`
- `update_po_totals_on_item_change` - Updates PO totals when items change
- `validate_po_item_quantity` - Validates `quantity_received <= quantity_ordered`

---

### Staff Table (`staff`)

**Purpose:** Store staff member information

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'staff'* | | | | |

**Primary Key:** *Run Query #3*  
**Foreign Keys:** *Run Query #4*  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Member Table (`member`)

**Purpose:** Store member/customer information

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'member'* | | | | |

**Primary Key:** *Run Query #3*  
**Foreign Keys:** *Run Query #4*  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Transactions Table (`transactions`)

**Purpose:** Store sales transactions

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'transactions'* | | | | |

**Primary Key:** *Run Query #3*  
**Foreign Keys:** *Run Query #4*  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Transaction Items Table (`transaction_items`)

**Purpose:** Store individual items in transactions

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'transaction_items'* | | | | |

**Primary Key:** *Run Query #3*  
**Foreign Keys:** *Run Query #4*  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Positions Table (`positions`)

**Purpose:** Store staff positions/job titles

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'positions'* | | | | |

**Primary Key:** *Run Query #3*  
**Foreign Keys:** *Run Query #4*  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Developer Table (`developer`)

**Purpose:** Store developer accounts

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'developer'* | | | | |

**Primary Key:** *Run Query #3*  
**Foreign Keys:** *Run Query #4*  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

---

### Password Resets Table (`password_resets`)

**Purpose:** Store password reset tokens

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| *Run Query #2 and filter by table_name = 'password_resets'* | | | | |

**Primary Key:** *Run Query #3*  
**Foreign Keys:** *Run Query #4*  
**Indexes:** *Run Query #7*  
**RLS:** *Run Query #8*

**Note:** This table is marked as UNRESTRICTED in Supabase UI.

---

## Relationships & Foreign Keys

Run **Query #4** from `view-all-tables-columns.sql` to get a complete list of all foreign key relationships.

### Key Relationships:

```
categories
  └── parent_category_id → categories(id) [Self-referential]

products
  ├── category_id → categories(id)
  └── created_by → auth.users(id)

product_variants
  └── product_id → products(id) [CASCADE DELETE]

purchase_orders
  ├── supplier_id → supplier(id)
  ├── created_by → auth.users(id)
  └── approved_by → auth.users(id)

purchase_order_items
  ├── purchase_order_id → purchase_orders(id) [CASCADE DELETE]
  └── product_variant_id → product_variants(id)
```

---

## Indexes

Run **Query #7** from `view-all-tables-columns.sql` to see all indexes.

### Common Indexes:

- Primary key indexes (automatic)
- Foreign key indexes (for performance)
- Status indexes (for filtering)
- Code/SKU indexes (for unique lookups)

---

## Row Level Security (RLS)

Run **Query #8** and **Query #9** from `view-all-tables-columns.sql` to see RLS status and policies.

### RLS Status:
- Most tables have RLS enabled
- Policies typically allow authenticated users to SELECT, INSERT, UPDATE
- DELETE policies may be restricted (e.g., only draft POs can be deleted)

---

## Triggers

Run **Query #10** from `view-all-tables-columns.sql` to see all triggers.

### Known Triggers:

1. **`update_updated_at_column`** - Automatically updates `updated_at` timestamp
   - Applied to: `categories`, `products`, `product_variants`, `purchase_orders`, `purchase_order_items`

2. **`calculate_po_item_line_total`** - Calculates line total for PO items
   - Applied to: `purchase_order_items` (BEFORE INSERT OR UPDATE)

3. **`update_po_totals_on_item_change`** - Updates PO totals when items change
   - Applied to: `purchase_order_items` (AFTER INSERT OR UPDATE OR DELETE)

4. **`validate_po_item_quantity`** - Validates quantity_received <= quantity_ordered
   - Applied to: `purchase_order_items` (BEFORE INSERT OR UPDATE)

---

## Data Types Summary

Run **Query #12** from `view-all-tables-columns.sql` to see data type distribution.

Common data types:
- `uuid` - Primary keys and foreign keys
- `varchar` / `text` - Strings
- `integer` - Whole numbers
- `numeric` / `decimal` - Monetary values
- `boolean` - True/false flags
- `timestamp` - Date/time values
- `date` - Date values
- `jsonb` - JSON data

---

## How to Update This Documentation

1. **Run the SQL queries:**
   ```sql
   -- Open view-all-tables-columns.sql in Supabase SQL Editor
   -- Run each query (1-14) and copy the results
   ```

2. **Update this markdown file:**
   - Replace placeholder text with actual query results
   - Update table schemas with column details
   - Update relationships section
   - Update indexes, RLS, and triggers sections

3. **Commit the changes:**
   ```bash
   git add SUPABASE_SCHEMA_DOCUMENTATION.md
   git commit -m "Update database schema documentation"
   ```

---

## Quick Reference Queries

### Get all columns for a specific table:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'your_table_name'
ORDER BY ordinal_position;
```

### Get all foreign keys for a table:
```sql
SELECT
  kcu.column_name AS source_column,
  ccu.table_name AS target_table,
  ccu.column_name AS target_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'your_table_name'
  AND tc.constraint_type = 'FOREIGN KEY';
```

### Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'your_table_name';
```

---

## Notes

- This documentation should be updated whenever the database schema changes
- Always run the queries in `view-all-tables-columns.sql` to get the latest schema information
- Keep this file in sync with actual database structure for accurate debugging

---

**Generated by:** `view-all-tables-columns.sql`  
**Last Schema Check:** *Run queries and update this date*
