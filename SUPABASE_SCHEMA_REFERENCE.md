# Supabase Database Schema Reference

> **Last Updated:** 2024-12-20
> 
> This document serves as a reference for the current state of the Supabase database schema.
> **IMPORTANT:** This file must be kept updated whenever the database structure changes.
> Run queries from `view-all-tables-columns.sql` to get the latest schema information.

---

## Overview

This document contains the current schema structure for all tables in the Supabase database, including column names, data types, and constraints.

## How to Keep This File Updated

**IMPORTANT:** This file must be updated whenever the database schema changes.

### Steps to Update:

1. **Run SQL Queries:**
   - Open `view-all-tables-columns.sql` in Supabase SQL Editor
   - Run Query #2 to get all columns for all tables
   - Run Query #4 to get all foreign key relationships
   - Run Query #7 to get all indexes
   - Run Query #8 and #9 to get RLS status and policies
   - Run Query #10 to get all triggers

2. **Update This File:**
   - Copy the query results
   - Update the relevant table sections with actual column details
   - Update the Change Log with the date and changes made

3. **For New Tables:**
   - Add a new section following the same format
   - Include all columns, data types, constraints, and foreign keys
   - Document any special triggers or business rules

4. **For Modified Tables:**
   - Update the affected columns
   - Note the changes in the Change Log
   - Update any related documentation sections

### Quick Reference:
- Use Query #2 from `view-all-tables-columns.sql` to get column details for any table
- Use Query #11 to get a comprehensive summary of all tables
- Use Query #13 to identify tables without primary keys (potential issues)

---

## Tables

### 1. Staff Table

**Purpose:** Store staff/user account information

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | uuid_generate_v4() | ✅ YES | Primary key |
| email | character varying | NO | null | ❌ NO | Required, unique identifier |
| role | character varying | YES | 'staff' | ❌ NO | Default role |
| username | character varying | YES | null | ❌ NO | **Display name for current user** |
| first_name | character varying | YES | null | ❌ NO | First name |
| last_name | character varying | YES | null | ❌ NO | Last name |
| phone | character varying | YES | null | ❌ NO | Contact phone |
| department | character varying | YES | null | ❌ NO | Department |
| position | character varying | YES | null | ❌ NO | Position (references positions table) |
| business_name | character varying | YES | null | ❌ NO | Business name |
| business_contact | character varying | YES | null | ❌ NO | Business contact |
| business_ssm_reg_num | character varying | YES | null | ❌ NO | SSM registration number |
| user_id | uuid | YES | null | ❌ NO | Related user ID |
| is_active | boolean | YES | true | ❌ NO | Active status flag |
| user_code | text | YES | null | ❌ NO | User code (e.g., STF123456) |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |

**Key Fields for Current User Display:**
- ✅ **`username`** - Primary field for displaying current user name
- ✅ `email` - Fallback option (uses prefix before @)
- ⚠️ Note: `username` is nullable, so may be null for some users

---

### 2. Member Table

**Purpose:** Store member/customer information

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | uuid_generate_v4() | ✅ YES | Primary key |
| email | character varying | YES | null | ❌ NO | Email address |
| username | character varying | YES | null | ❌ NO | **Display name for current user** |
| member_code | character varying | YES | null | ❌ NO | Member code |
| first_name | character varying | YES | null | ❌ NO | First name |
| last_name | character varying | YES | null | ❌ NO | Last name |
| phone | character varying | YES | null | ❌ NO | Contact phone |
| member_points | integer | YES | 0 | ❌ NO | Loyalty points |
| date_of_birth | date | YES | null | ❌ NO | Date of birth |
| address | text | YES | null | ❌ NO | Street address |
| city | character varying | YES | null | ❌ NO | City |
| state | character varying | YES | null | ❌ NO | State/Province |
| postal_code | character varying | YES | null | ❌ NO | Postal code |
| country | character varying | YES | null | ❌ NO | Country |
| membership_type | character varying | YES | null | ❌ NO | Membership type |
| membership_status | character varying | YES | 'active' | ❌ NO | Membership status |
| notes | text | YES | null | ❌ NO | Additional notes |
| user_code | text | YES | null | ❌ NO | User code (e.g., MEM123456) |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |

**Key Fields for Current User Display:**
- ✅ **`username`** - Primary field for displaying current user name
- ✅ `email` - Fallback option (uses prefix before @)
- ⚠️ Note: `username` is nullable, so may be null for some users

---

### 3. Supplier Table

**Purpose:** Store supplier information

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | uuid_generate_v4() | ✅ YES | Primary key |
| email | character varying | NO | null | ❌ NO | Required, unique identifier |
| role | character varying | YES | 'supplier' | ❌ NO | Default role |
| supplier_code | character varying | YES | null | ❌ NO | Supplier code (e.g., SUP001) |
| company_name | character varying | YES | null | ❌ NO | **Display name for supplier** |
| contact_person | character varying | YES | null | ❌ NO | Contact person name |
| phone | character varying | YES | null | ❌ NO | Contact phone |
| alternate_phone | character varying | YES | null | ❌ NO | Alternate phone number |
| address | text | YES | null | ❌ NO | Business address |
| city | character varying | YES | null | ❌ NO | City |
| state | character varying | YES | null | ❌ NO | State/Province |
| postal_code | character varying | YES | null | ❌ NO | Postal/ZIP code |
| country | character varying | YES | null | ❌ NO | Country |
| tax_id | character varying | YES | null | ❌ NO | Tax identification number |
| payment_terms | character varying | YES | null | ❌ NO | Payment terms (e.g., "Net 30") |
| credit_limit | numeric(10,2) | YES | null | ❌ NO | Credit limit |
| currency | character varying(3) | YES | 'MYR' | ❌ NO | Currency code (default: MYR) |
| lead_time_days | integer | YES | null | ❌ NO | Average delivery lead time in days |
| status | character varying | YES | 'active' | ❌ NO | Supplier status ('active', 'inactive', 'blacklisted') |
| rating | integer | YES | null | ❌ NO | Supplier rating (1-5, CHECK constraint) |
| notes | text | YES | null | ❌ NO | Additional supplier notes |
| user_code | text | YES | null | ❌ NO | User code (e.g., SUP123456) |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |

**Key Fields for Current User Display:**
- ⚠️ **NO `username` field** - Supplier table does not have username
- ✅ **`company_name`** - Primary field for displaying supplier name
- ✅ `email` - Fallback option (uses prefix before @)
- ✅ `contact_person` - Alternative display option

**Purchase Order Related Fields:**
- `lead_time_days` - Used to calculate expected delivery dates for POs
- `payment_terms` - Payment terms for invoices
- `credit_limit` - Credit limit for supplier
- `currency` - Default currency for transactions

---

### 4. Positions Table

**Purpose:** Store staff position/role information

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | gen_random_uuid() | ✅ YES | Primary key |
| position_name | character varying | NO | null | ❌ NO | Position name (e.g., 'Manager', 'Staff') |
| display_order | integer | YES | 0 | ❌ NO | Order for display |
| is_active | boolean | YES | true | ❌ NO | Active status |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |

---

## Username Field Analysis

### Fields Related to Username/Display Name

| Table | Column Name | Data Type | Purpose | Status |
|-------|-------------|-----------|---------|--------|
| staff | **username** | character varying | User display name | ✅ EXISTS |
| member | **username** | character varying | Member display name | ✅ EXISTS |
| supplier | **company_name** | character varying | Company name (no username field) | ⚠️ USE THIS |
| supplier | contact_person | character varying | Contact person name | Alternative |

**Current Status:** 
- ✅ Username field identified: `username` in `staff` and `member` tables
- ✅ Company name field identified: `company_name` in `supplier` table
- ✅ Fallback: Email prefix (first part before @) for all tables

---

## Key Findings

### For Current User Display Feature

**Username Detection Strategy by Table:**

1. **Staff Table:**
   - Primary: `userData.username`
   - Fallback 1: `userData.email` (prefix before @)
   - Fallback 2: `user.id` (first 8 characters)

2. **Member Table:**
   - Primary: `userData.username`
   - Fallback 1: `userData.email` (prefix before @)
   - Fallback 2: `user.id` (first 8 characters)

3. **Supplier Table:**
   - Primary: `userData.company_name` (NO username field exists)
   - Fallback 1: `userData.contact_person`
   - Fallback 2: `userData.email` (prefix before @)
   - Fallback 3: `user.id` (first 8 characters)

**Current Implementation:**
- The `checkUserSession()` function in `dashboard.js` should check:
  - For staff/member: `user.userData.username`
  - For supplier: `user.userData.company_name` or `user.userData.contact_person`
  - All: Fallback to email prefix

**Issue Identified:**
- The code is checking for `username` field, which exists in staff/member tables ✅
- However, the code may not be correctly accessing the field or the field might be null in database
- Need to ensure proper fallback handling

---

## Common Patterns

### User Code Format
- **Staff:** `STF` + 6 digits (e.g., STF123456)
- **Member:** `MEM` + 6 digits (e.g., MEM123456)
- **Supplier:** `SUP` + 6 digits (e.g., SUP123456)

### Status Fields
- **Staff:** `is_active` (boolean) - true/false
- **Member:** `membership_status` (varchar) - 'active', 'inactive', etc.
- **Supplier:** `status` (varchar) - 'active', 'inactive', etc.

---

## Notes

- All tables use UUID for primary keys
- Timestamps use `timestamp with time zone` for timezone-aware storage
- Most user-facing fields (username, email, etc.) are nullable, so proper null checking is required
- The `user_code` column was recently added to all three tables (staff, member, supplier)

---

## Related Files

- `dashboard.js` - User session management and username display logic
- `script.js` - Login functionality that stores user data in sessionStorage
- `inspect-all-tables.sql` - SQL queries to inspect the database schema
- `add-user-code-columns.sql` - SQL script to add user_code column

---

---

### 5. Transactions Table

**Purpose:** Store sales transaction headers

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | gen_random_uuid() | ✅ YES | Primary key |
| transaction_number | character varying(100) | NO | null | ❌ NO | Unique transaction/receipt number |
| transaction_date | timestamp with time zone | NO | now() | ❌ NO | Date and time of transaction |
| user_id | uuid | YES | null | ❌ NO | Cashier/user who processed (references staff.id) |
| member_id | uuid | YES | null | ❌ NO | Member (if applicable, references member.id) |
| device_id | character varying(100) | YES | null | ❌ NO | POS device identifier |
| session_id | uuid | YES | null | ❌ NO | Device session reference |
| transaction_type | character varying(50) | YES | 'sale' | ❌ NO | 'sale', 'return', 'exchange', 'refund' |
| original_transaction_id | uuid | YES | null | ❌ NO | Original transaction (for returns) |
| subtotal | numeric(10,2) | NO | 0.00 | ❌ NO | Subtotal before tax and discount |
| discount_amount | numeric(10,2) | YES | 0.00 | ❌ NO | Total discount amount applied |
| tax_amount | numeric(10,2) | YES | 0.00 | ❌ NO | Total tax amount |
| total_amount | numeric(10,2) | NO | 0.00 | ❌ NO | Final total amount after discounts and tax |
| payment_method | character varying(50) | NO | 'cash' | ❌ NO | 'cash', 'card', 'mobile_payment', 'mixed' |
| cash_amount | numeric(10,2) | YES | null | ❌ NO | Cash amount paid |
| card_amount | numeric(10,2) | YES | null | ❌ NO | Card amount paid |
| change_amount | numeric(10,2) | YES | 0.00 | ❌ NO | Change given |
| points_earned | integer | YES | 0 | ❌ NO | Loyalty points earned |
| points_redeemed | integer | YES | 0 | ❌ NO | Loyalty points redeemed |
| status | character varying(50) | YES | 'completed' | ❌ NO | 'completed', 'pending', 'cancelled', 'refunded' |
| is_offline | boolean | YES | false | ❌ NO | Whether transaction was offline |
| synced_at | timestamp with time zone | YES | null | ❌ NO | When offline transaction was synced |
| receipt_printed | boolean | YES | false | ❌ NO | Whether receipt was printed |
| notes | text | YES | null | ❌ NO | Transaction notes |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |

---

### 6. Transaction Items Table

**Purpose:** Store transaction line items

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | gen_random_uuid() | ✅ YES | Primary key |
| transaction_id | uuid | NO | null | ❌ NO | Transaction reference (foreign key) |
| product_variant_id | uuid | YES | null | ❌ NO | Product variant reference |
| product_name | character varying(255) | YES | null | ❌ NO | Product name at time of sale |
| quantity | integer | NO | null | ❌ NO | Quantity sold |
| unit_price | numeric(10,2) | NO | null | ❌ NO | Price per unit at time of sale |
| discount_percentage | numeric(5,2) | YES | 0.00 | ❌ NO | Discount percentage |
| discount_amount | numeric(10,2) | YES | 0.00 | ❌ NO | Discount amount |
| tax_amount | numeric(10,2) | YES | 0.00 | ❌ NO | Tax amount for this item |
| line_total | numeric(10,2) | NO | null | ❌ NO | Line total |
| cost_price | numeric(10,2) | YES | null | ❌ NO | Cost price at time of sale |
| profit | numeric(10,2) | YES | null | ❌ NO | Profit for this line item |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |

---

### 7. Categories Table

**Purpose:** Organize products into categories

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | gen_random_uuid() | ✅ YES | Primary key |
| category_code | character varying(50) | NO | null | ❌ NO | Unique category code |
| category_name | character varying(255) | NO | null | ❌ NO | Category name |
| parent_category_id | uuid | YES | null | ❌ NO | Parent category (for hierarchy) |
| description | text | YES | null | ❌ NO | Category description |
| image_url | text | YES | null | ❌ NO | Category image URL |
| display_order | integer | YES | 0 | ❌ NO | Display order for sorting |
| is_active | boolean | YES | true | ❌ NO | Category active status |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |

**Foreign Keys:**
- `parent_category_id` → `categories(id)` (Self-referential, for category hierarchy)

---

### 8. Products Table

**Purpose:** Store parent-level product information

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | gen_random_uuid() | ✅ YES | Primary key |
| product_code | character varying(100) | NO | null | ❌ NO | Unique product code/SKU prefix |
| product_name | character varying(255) | NO | null | ❌ NO | Product name |
| brand | character varying(100) | YES | null | ❌ NO | Brand name |
| category_id | uuid | YES | null | ❌ NO | Product category (foreign key) |
| description | text | YES | null | ❌ NO | Product description |
| image_url | text | YES | null | ❌ NO | Primary product image URL |
| image_urls | text[] | YES | null | ❌ NO | Multiple product images (array) |
| status | character varying(20) | YES | 'active' | ❌ NO | 'active', 'inactive', 'discontinued' |
| is_taxable | boolean | YES | true | ❌ NO | Whether product is taxable |
| tax_rate | numeric(5,2) | YES | 0.00 | ❌ NO | Tax rate percentage |
| tags | character varying(100)[] | YES | null | ❌ NO | Product tags for search (array) |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |
| created_by | uuid | YES | null | ❌ NO | User who created the product |

**Foreign Keys:**
- `category_id` → `categories(id)`
- `created_by` → `auth.users(id)`

**Important Notes:**
- `status` field: Only products with `status = 'active'` should appear in product-display-section
- `image_urls` is an array type for multiple images
- `tags` is an array type for search functionality

---

### 9. Product Variants Table

**Purpose:** Store detailed product variants (size, color, weight, etc.)

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | gen_random_uuid() | ✅ YES | Primary key |
| product_id | uuid | NO | null | ❌ NO | Parent product (foreign key, CASCADE) |
| sku | character varying(100) | NO | null | ❌ NO | Unique Stock Keeping Unit |
| barcode | character varying(100) | YES | null | ❌ NO | Unique barcode (EAN, UPC, etc.) |
| variant_name | character varying(255) | YES | null | ❌ NO | Variant name/description |
| size | character varying(50) | YES | null | ❌ NO | Size variant |
| color | character varying(50) | YES | null | ❌ NO | Color variant |
| weight | character varying(50) | YES | null | ❌ NO | Weight variant |
| grip | character varying(50) | YES | null | ❌ NO | Grip variant |
| material | character varying(100) | YES | null | ❌ NO | Material variant |
| custom_attributes | jsonb | YES | null | ❌ NO | Additional variant attributes (JSON) |
| cost_price | numeric(10,2) | NO | null | ❌ NO | Cost price (purchase price) |
| selling_price | numeric(10,2) | NO | null | ❌ NO | Selling price |
| discount_price | numeric(10,2) | YES | null | ❌ NO | Discounted price (if on sale) |
| min_selling_price | numeric(10,2) | YES | null | ❌ NO | Minimum allowed selling price |
| current_stock | integer | YES | 0 | ❌ NO | Current stock quantity |
| reorder_level | integer | YES | 0 | ❌ NO | Reorder point threshold |
| reorder_quantity | integer | YES | 0 | ❌ NO | Quantity to reorder |
| max_stock | integer | YES | null | ❌ NO | Maximum stock capacity |
| unit_of_measure | character varying(20) | YES | 'pcs' | ❌ NO | 'pcs', 'kg', 'm', 'box', etc. |
| location | character varying(255) | YES | null | ❌ NO | Storage location/warehouse |
| status | character varying(20) | YES | 'active' | ❌ NO | 'active', 'inactive', 'out_of_stock', 'discontinued' |
| last_sold_date | date | YES | null | ❌ NO | Date of last sale |
| total_sold | integer | YES | 0 | ❌ NO | Total quantity sold (lifetime) |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |

**Foreign Keys:**
- `product_id` → `products(id)` (CASCADE DELETE - deleting product deletes all variants)

**Important Notes:**
- `current_stock <= reorder_level` indicates low stock products
- `custom_attributes` uses JSONB for flexible variant attributes
- `unit_of_measure` is used for quantity conversion (e.g., pieces vs boxes)

---

### 10. Purchase Orders Table

**Purpose:** Store purchase order headers

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | gen_random_uuid() | ✅ YES | Primary key |
| po_number | character varying(100) | NO | null | ❌ NO | Unique purchase order number |
| supplier_id | uuid | NO | null | ❌ NO | Supplier reference (foreign key) |
| order_date | date | YES | CURRENT_DATE | ❌ NO | Order date |
| expected_delivery_date | date | YES | null | ❌ NO | Expected delivery date |
| status | character varying(50) | YES | 'draft' | ❌ NO | 'draft', 'pending', 'partially_received', 'completed', 'cancelled' |
| subtotal | numeric(10,2) | YES | 0.00 | ❌ NO | Subtotal before tax |
| tax_amount | numeric(10,2) | YES | 0.00 | ❌ NO | Tax amount |
| discount_amount | numeric(10,2) | YES | 0.00 | ❌ NO | Discount amount |
| total_amount | numeric(10,2) | YES | 0.00 | ❌ NO | Final total amount |
| currency | character varying(3) | YES | 'MYR' | ❌ NO | Currency code (default: MYR) |
| notes | text | YES | null | ❌ NO | PO notes/comments |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |
| created_by | uuid | YES | null | ❌ NO | User who created the PO |
| approved_by | uuid | YES | null | ❌ NO | User who approved the PO |
| approved_at | timestamp with time zone | YES | null | ❌ NO | Approval timestamp |

**Foreign Keys:**
- `supplier_id` → `supplier(id)`
- `created_by` → `auth.users(id)`
- `approved_by` → `auth.users(id)`

**Status Values:**
- `'draft'` - PO is being created, can be deleted
- `'pending'` - PO sent to supplier, awaiting delivery
- `'partially_received'` - Some items received, more pending
- `'completed'` - All items received
- `'cancelled'` - PO cancelled

**Important Notes:**
- `expected_delivery_date` is calculated as: `order_date + supplier.lead_time_days`
- PO totals are automatically calculated via triggers when items change
- Only `'draft'` status POs can be deleted

---

### 11. Purchase Order Items Table

**Purpose:** Store purchase order line items

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| id | uuid | NO | gen_random_uuid() | ✅ YES | Primary key |
| purchase_order_id | uuid | NO | null | ❌ NO | Purchase order reference (foreign key, CASCADE) |
| product_variant_id | uuid | NO | null | ❌ NO | Product variant reference (foreign key) |
| quantity_ordered | integer | NO | null | ❌ NO | Quantity ordered (CHECK > 0) |
| quantity_received | integer | YES | 0 | ❌ NO | Quantity received so far (CHECK <= quantity_ordered) |
| unit_cost | numeric(10,2) | NO | null | ❌ NO | Cost per unit |
| discount_percentage | numeric(5,2) | YES | 0.00 | ❌ NO | Discount percentage (0-100) |
| line_total | numeric(10,2) | NO | null | ❌ NO | Line total (auto-calculated) |
| notes | text | YES | null | ❌ NO | Item-specific notes |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |

**Foreign Keys:**
- `purchase_order_id` → `purchase_orders(id)` (CASCADE DELETE)
- `product_variant_id` → `product_variants(id)`

**Triggers:**
- `calculate_po_item_line_total` - Auto-calculates `line_total = (quantity_ordered × unit_cost) × (1 - discount_percentage / 100)`
- `update_po_totals_on_item_change` - Updates PO totals when items are inserted/updated/deleted
- `validate_po_item_quantity` - Validates `quantity_received <= quantity_ordered`

**Important Notes:**
- `line_total` is automatically calculated, don't set manually
- `quantity_received` tracks partial deliveries
- PO totals are automatically updated via triggers

---

### 12. Developer Table

**Purpose:** Store developer accounts

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| *Run Query #2 from view-all-tables-columns.sql to get full schema* | | | | | |

---

### 13. Password Resets Table

**Purpose:** Store password reset tokens

| Column Name | Data Type | Nullable | Default | Primary Key | Notes |
|------------|-----------|----------|---------|-------------|-------|
| *Run Query #2 from view-all-tables-columns.sql to get full schema* | | | | | |

**Note:** This table is marked as UNRESTRICTED in Supabase UI.

---

## Database Statistics (from CSV)

**Data Type Distribution:**
- character varying: 73 columns
- uuid: 29 columns
- numeric: 27 columns
- timestamp with time zone: 17 columns
- text: 16 columns
- integer: 15 columns
- timestamp without time zone: 11 columns
- boolean: 7 columns
- date: 4 columns
- ARRAY: 2 columns
- jsonb: 1 column

---

## Change Log

| Date | Change | Author | Notes |
|------|--------|--------|-------|
| 2024-12-19 | Initial schema documentation | AI Assistant | Created from database inspection results |
| 2024-12-19 | Added transactions and transaction_items tables | AI Assistant | Added sales data tables for statistic page |
| 2024-12-20 | Added categories, products, product_variants tables | AI Assistant | Added product management tables |
| 2024-12-20 | Added purchase_orders and purchase_order_items tables | AI Assistant | Added purchase order functionality tables |
| 2024-12-20 | Updated supplier table with PO-related fields | AI Assistant | Added lead_time_days, payment_terms, credit_limit, currency, tax_id, rating, address fields |
| 2024-12-20 | Added database statistics from CSV | AI Assistant | Included data type distribution summary |
