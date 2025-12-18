# Supabase Database Structure Documentation

**Generated Date:** December 16, 2025  
**Database:** giksmtowehwmgqyymevp.supabase.co  
**Schema:** public

---

## Database Tables Overview

| Table Name | Description | Primary Key | Row Count |
|------------|-------------|-------------|-----------|
| categories | Product categories with hierarchical support | id | - |
| developer | Developer user accounts | id | - |
| member | Customer membership information | id | - |
| password_resets | OTP codes for password reset | id | - |
| po_price_proposals | Price proposals for purchase orders | id | - |
| positions | Staff positions | id | - |
| product_variants | Product variants (size, color, etc.) | id | - |
| products | Product master data | id | - |
| purchase_order_items | Line items in purchase orders | id | - |
| purchase_orders | Purchase order headers | id | - |
| staff | Staff user accounts | id | - |
| supplier | Supplier user accounts | id | - |
| transaction_items | Line items in sales transactions | id | - |
| transactions | Sales transaction headers | id | - |

**Total Tables:** 14

---

## Detailed Table Structure

### categories

**Description:** Product categories with hierarchical support (parent-child relationships)

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| category_code | character varying(50) | NO | null | UNIQUE | Category code |
| category_name | character varying(255) | NO | null | | Category name |
| parent_category_id | uuid | YES | null | FOREIGN KEY | Parent category reference |
| description | text | YES | null | | Category description |
| image_url | text | YES | null | | Category image URL |
| display_order | integer | YES | 0 | | Display order for sorting |
| is_active | boolean | YES | true | | Active status |
| created_at | timestamp without time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp without time zone | YES | now() | | Last update timestamp |

**Primary Keys:**
- `id`

**Foreign Keys:**
- `parent_category_id` → `categories.id` (self-referencing)

**Unique Constraints:**
- `category_code`

---

### developer

**Description:** Developer user accounts

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| email | character varying(255) | NO | null | UNIQUE | Email address |
| role | character varying(50) | YES | 'developer' | | User role |
| first_name | character varying(100) | YES | null | | First name |
| last_name | character varying(100) | YES | null | | Last name |
| phone | character varying(20) | YES | null | | Phone number |
| department | character varying(100) | YES | null | | Department |
| position | character varying(100) | YES | null | | Position |
| company_name | character varying(255) | YES | null | | Company name |
| contact_person | character varying(100) | YES | null | | Contact person |
| address | text | YES | null | | Address |
| created_at | timestamp with time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | | Last update timestamp |

**Primary Keys:**
- `id`

**Unique Constraints:**
- `email`

---

### member

**Description:** Customer membership information and loyalty program data

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Unique identifier |
| email | character varying(255) | YES | null | UNIQUE | Email address |
| created_at | timestamp with time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | | Last update timestamp |
| member_code | character varying(50) | YES | null | UNIQUE | Member identification code |
| username | character varying(255) | YES | null | | Username |
| first_name | character varying(100) | YES | null | | First name |
| last_name | character varying(100) | YES | null | | Last name |
| phone | character varying(20) | YES | null | | Phone number |
| member_points | integer | YES | 0 | | Loyalty points balance |
| date_of_birth | date | YES | null | | Date of birth |
| address | text | YES | null | | Physical address |
| city | character varying(100) | YES | null | | City |
| state | character varying(100) | YES | null | | State/Province |
| postal_code | character varying(20) | YES | null | | Postal/ZIP code |
| country | character varying(100) | YES | null | | Country |
| membership_type | character varying(50) | YES | null | | Membership tier |
| membership_status | character varying(20) | YES | 'active' | | Membership status |
| notes | text | YES | null | | Additional notes |
| user_code | text | YES | null | | User code |

**Primary Keys:**
- `id`

**Unique Constraints:**
- `email`
- `member_code`

---

### password_resets

**Description:** OTP codes for password reset functionality

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| email | text | NO | null | | Email address for reset |
| otp_code | text | NO | null | | OTP code (6 digits) |
| expires_at | timestamp with time zone | NO | null | | Expiration timestamp |
| used | boolean | YES | false | | Whether OTP has been used |
| created_at | timestamp with time zone | YES | now() | | Creation timestamp |

**Primary Keys:**
- `id`

---

### po_price_proposals

**Description:** Price proposals from suppliers for purchase order items

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| purchase_order_id | uuid | NO | null | FOREIGN KEY | Purchase order reference |
| purchase_order_item_id | uuid | NO | null | FOREIGN KEY | Purchase order item reference |
| original_unit_cost | numeric(10,2) | NO | null | | Original unit cost |
| proposed_unit_cost | numeric(10,2) | NO | null | | Proposed unit cost |
| original_line_total | numeric(10,2) | NO | null | | Original line total |
| proposed_line_total | numeric(10,2) | NO | null | | Proposed line total |
| proposal_number | integer | NO | 1 | | Proposal round number |
| notes | text | YES | null | | Proposal notes |
| created_at | timestamp with time zone | YES | now() | | Creation timestamp |
| created_by | uuid | YES | null | | User who created proposal |
| status | character varying(50) | YES | 'pending' | | Proposal status |
| reviewed_at | timestamp with time zone | YES | null | | Review timestamp |
| reviewed_by | uuid | YES | null | | User who reviewed |
| review_notes | text | YES | null | | Review notes |

**Primary Keys:**
- `id`

**Foreign Keys:**
- `purchase_order_id` → `purchase_orders.id`
- `purchase_order_item_id` → `purchase_order_items.id`

---

### positions

**Description:** Staff positions/job titles

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| position_name | character varying(100) | NO | null | UNIQUE | Position name |
| display_order | integer | YES | 0 | | Display order |
| is_active | boolean | YES | true | | Active status |
| created_at | timestamp with time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | | Last update timestamp |

**Primary Keys:**
- `id`

**Unique Constraints:**
- `position_name`

---

### product_variants

**Description:** Product variants (different sizes, colors, etc. for the same product)

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| product_id | uuid | NO | null | FOREIGN KEY | Product reference |
| sku | character varying(100) | NO | null | UNIQUE | Stock Keeping Unit |
| barcode | character varying(100) | YES | null | UNIQUE | Barcode |
| variant_name | character varying(255) | YES | null | | Variant name |
| size | character varying(50) | YES | null | | Size |
| color | character varying(50) | YES | null | | Color |
| weight | character varying(50) | YES | null | | Weight |
| grip | character varying(50) | YES | null | | Grip type |
| material | character varying(100) | YES | null | | Material |
| custom_attributes | jsonb | YES | null | | Custom attributes (JSON) |
| cost_price | numeric(10,2) | NO | null | | Cost price |
| selling_price | numeric(10,2) | NO | null | | Selling price |
| discount_price | numeric(10,2) | YES | null | | Discount price |
| min_selling_price | numeric(10,2) | YES | null | | Minimum selling price |
| current_stock | integer | YES | 0 | | Current stock quantity |
| reorder_level | integer | YES | 0 | | Reorder level threshold |
| reorder_quantity | integer | YES | 0 | | Reorder quantity |
| max_stock | integer | YES | null | | Maximum stock level |
| unit_of_measure | character varying(20) | YES | 'pcs' | | Unit of measure |
| location | character varying(255) | YES | null | | Storage location |
| status | character varying(20) | YES | 'active' | | Status |
| last_sold_date | date | YES | null | | Last sold date |
| total_sold | integer | YES | 0 | | Total quantity sold |
| created_at | timestamp without time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp without time zone | YES | now() | | Last update timestamp |

**Primary Keys:**
- `id`

**Foreign Keys:**
- `product_id` → `products.id`

**Unique Constraints:**
- `sku`
- `barcode`

---

### products

**Description:** Product master data

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| product_code | character varying(100) | NO | null | UNIQUE | Product code |
| product_name | character varying(255) | NO | null | | Product name |
| brand | character varying(100) | YES | null | | Brand name |
| category_id | uuid | YES | null | FOREIGN KEY | Category reference |
| description | text | YES | null | | Product description |
| image_url | text | YES | null | | Primary image URL |
| image_urls | ARRAY | YES | null | | Array of image URLs |
| status | character varying(20) | YES | 'active' | | Product status |
| is_taxable | boolean | YES | true | | Whether product is taxable |
| tax_rate | numeric(5,2) | YES | 0.00 | | Tax rate percentage |
| tags | ARRAY | YES | null | | Product tags array |
| created_at | timestamp without time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp without time zone | YES | now() | | Last update timestamp |
| created_by | uuid | YES | null | FOREIGN KEY | User who created product |

**Primary Keys:**
- `id`

**Foreign Keys:**
- `category_id` → `categories.id`
- `created_by` → `staff.id` (or appropriate user table)

**Unique Constraints:**
- `product_code`

---

### purchase_order_items

**Description:** Line items in purchase orders

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| purchase_order_id | uuid | NO | null | FOREIGN KEY | Purchase order reference |
| product_variant_id | uuid | NO | null | FOREIGN KEY | Product variant reference |
| quantity_ordered | integer | NO | null | | Quantity ordered |
| quantity_received | integer | YES | 0 | | Quantity received |
| unit_cost | numeric(10,2) | NO | null | | Unit cost |
| discount_percentage | numeric(5,2) | YES | 0.00 | | Discount percentage |
| line_total | numeric(10,2) | NO | null | | Line total amount |
| notes | text | YES | null | | Item notes |
| created_at | timestamp without time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp without time zone | YES | now() | | Last update timestamp |

**Primary Keys:**
- `id`

**Foreign Keys:**
- `purchase_order_id` → `purchase_orders.id`
- `product_variant_id` → `product_variants.id`

---

### purchase_orders

**Description:** Purchase order headers

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| po_number | character varying(100) | NO | null | UNIQUE | Purchase order number |
| supplier_id | uuid | NO | null | FOREIGN KEY | Supplier reference |
| order_date | date | YES | CURRENT_DATE | | Order date |
| expected_delivery_date | date | YES | null | | Expected delivery date |
| status | character varying(50) | YES | 'draft' | | Order status |
| subtotal | numeric(10,2) | YES | 0.00 | | Subtotal before tax/discount |
| tax_amount | numeric(10,2) | YES | 0.00 | | Tax amount |
| discount_amount | numeric(10,2) | YES | 0.00 | | Discount amount |
| total_amount | numeric(10,2) | YES | 0.00 | | Total amount |
| currency | character varying(3) | YES | 'MYR' | | Currency code |
| notes | text | YES | null | | PO notes |
| created_at | timestamp without time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp without time zone | YES | now() | | Last update timestamp |
| created_by | uuid | YES | null | FOREIGN KEY | User who created PO |
| approved_by | uuid | YES | null | FOREIGN KEY | User who approved PO |
| approved_at | timestamp without time zone | YES | null | | Approval timestamp |
| finalized_at | timestamp with time zone | YES | null | | Finalization timestamp |
| rejection_reason | text | YES | null | | Rejection reason |
| price_proposal_count | integer | YES | 0 | | Number of price proposals |
| last_price_proposal_at | timestamp with time zone | YES | null | | Last proposal timestamp |
| price_proposal_notes | text | YES | null | | Price proposal notes |

**Primary Keys:**
- `id`

**Foreign Keys:**
- `supplier_id` → `supplier.id`
- `created_by` → `staff.id` (or appropriate user table)
- `approved_by` → `staff.id` (or appropriate user table)

**Unique Constraints:**
- `po_number`

**Status Values:**
- `draft` - Initial draft
- `pending` - Awaiting supplier response
- `payment_pending` - Awaiting payment
- `processing` - Order being processed
- `partially_received` - Partially received
- `completed` - Fully completed
- `cancelled` - Cancelled

---

### staff

**Description:** Staff user accounts

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| email | character varying(255) | NO | null | UNIQUE | Email address |
| role | character varying(50) | YES | 'staff' | | User role |
| first_name | character varying(100) | YES | null | | First name |
| last_name | character varying(100) | YES | null | | Last name |
| phone | character varying(20) | YES | null | | Phone number |
| department | character varying(100) | YES | null | | Department |
| position | character varying(100) | YES | null | | Position |
| created_at | timestamp with time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | | Last update timestamp |
| username | character varying(100) | YES | null | | Username |
| business_name | character varying(255) | YES | null | | Business name |
| business_contact | character varying(20) | YES | null | | Business contact |
| business_ssm_reg_num | character varying(50) | YES | null | | SSM registration number |
| user_id | uuid | YES | null | FOREIGN KEY | Auth user reference |
| is_active | boolean | YES | true | | Active status |
| user_code | text | YES | null | | User code |

**Primary Keys:**
- `id`

**Foreign Keys:**
- `user_id` → `auth.users.id` (Supabase Auth)

**Unique Constraints:**
- `email`

---

### supplier

**Description:** Supplier user accounts and company information

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| email | character varying(255) | NO | null | UNIQUE | Email address |
| role | character varying(50) | YES | 'supplier' | | User role |
| company_name | character varying(255) | YES | null | | Company name |
| contact_person | character varying(100) | YES | null | | Contact person |
| phone | character varying(20) | YES | null | | Phone number |
| address | text | YES | null | | Address |
| created_at | timestamp with time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | | Last update timestamp |
| status | character varying(20) | YES | 'active' | | Supplier status |
| user_code | text | YES | null | | User code |
| lead_time_days | integer | YES | null | | Average lead time in days |
| payment_terms | character varying(100) | YES | null | | Payment terms |
| credit_limit | numeric(10,2) | YES | null | | Credit limit |
| currency | character varying(3) | YES | 'MYR' | | Currency code |
| tax_id | character varying(100) | YES | null | | Tax ID |
| rating | integer | YES | null | | Supplier rating (1-5) |
| city | character varying(100) | YES | null | | City |
| state | character varying(100) | YES | null | | State/Province |
| postal_code | character varying(20) | YES | null | | Postal/ZIP code |
| country | character varying(100) | YES | null | | Country |
| alternate_phone | character varying(20) | YES | null | | Alternate phone |

**Primary Keys:**
- `id`

**Unique Constraints:**
- `email`

---

### transaction_items

**Description:** Line items in sales transactions

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| transaction_id | uuid | NO | null | FOREIGN KEY | Transaction reference |
| product_variant_id | uuid | YES | null | | Product variant reference |
| product_name | character varying(255) | YES | null | | Product name (snapshot) |
| quantity | integer | NO | null | | Quantity sold |
| unit_price | numeric(10,2) | NO | null | | Unit price at time of sale |
| discount_percentage | numeric(5,2) | YES | 0.00 | | Discount percentage |
| discount_amount | numeric(10,2) | YES | 0.00 | | Discount amount |
| tax_amount | numeric(10,2) | YES | 0.00 | | Tax amount |
| line_total | numeric(10,2) | NO | null | | Line total |
| cost_price | numeric(10,2) | YES | null | | Cost price (for profit calc) |
| profit | numeric(10,2) | YES | null | | Profit for this line |
| created_at | timestamp with time zone | YES | now() | | Creation timestamp |

**Primary Keys:**
- `id`

**Foreign Keys:**
- `transaction_id` → `transactions.id`

---

### transactions

**Description:** Sales transaction headers (POS transactions)

**Columns:**

| Column Name | Data Type | Nullable | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| transaction_number | character varying(100) | NO | null | UNIQUE | Transaction/receipt number |
| transaction_date | timestamp with time zone | NO | now() | | Transaction date/time |
| user_id | uuid | YES | null | | Cashier/user ID |
| member_id | uuid | YES | null | | Member ID (if applicable) |
| device_id | character varying(100) | YES | null | | POS device identifier |
| session_id | uuid | YES | null | | Device session reference |
| transaction_type | character varying(50) | YES | 'sale' | | Transaction type |
| original_transaction_id | uuid | YES | null | FOREIGN KEY | Original transaction (for returns) |
| subtotal | numeric(10,2) | NO | 0.00 | | Subtotal before tax/discount |
| discount_amount | numeric(10,2) | YES | 0.00 | | Total discount |
| tax_amount | numeric(10,2) | YES | 0.00 | | Total tax |
| total_amount | numeric(10,2) | NO | 0.00 | | Final total |
| payment_method | character varying(50) | NO | 'cash' | | Payment method |
| cash_amount | numeric(10,2) | YES | null | | Cash amount paid |
| card_amount | numeric(10,2) | YES | null | | Card amount paid |
| change_amount | numeric(10,2) | YES | 0.00 | | Change given |
| points_earned | integer | YES | 0 | | Loyalty points earned |
| points_redeemed | integer | YES | 0 | | Loyalty points redeemed |
| status | character varying(50) | YES | 'completed' | | Transaction status |
| is_offline | boolean | YES | false | | Whether transaction was offline |
| synced_at | timestamp with time zone | YES | null | | When offline transaction synced |
| receipt_printed | boolean | YES | false | | Whether receipt was printed |
| notes | text | YES | null | | Transaction notes |
| created_at | timestamp with time zone | YES | now() | | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | | Last update timestamp |

**Primary Keys:**
- `id`

**Foreign Keys:**
- `original_transaction_id` → `transactions.id` (self-referencing for returns)

**Unique Constraints:**
- `transaction_number`

**Transaction Types:**
- `sale` - Regular sale
- `return` - Return transaction
- `exchange` - Exchange transaction
- `refund` - Refund transaction

---

## Relationships Diagram

```
categories
  ├── products (category_id)
  │     └── product_variants (product_id)
  │           ├── purchase_order_items (product_variant_id)
  │           └── transaction_items (product_variant_id)
  │
purchase_orders
  ├── purchase_order_items (purchase_order_id)
  │     └── po_price_proposals (purchase_order_item_id)
  └── po_price_proposals (purchase_order_id)
  │
supplier
  └── purchase_orders (supplier_id)
  │
staff
  ├── products (created_by)
  ├── purchase_orders (created_by, approved_by)
  └── transactions (user_id)
  │
member
  └── transactions (member_id)
  │
transactions
  ├── transaction_items (transaction_id)
  └── transactions (original_transaction_id) [self-reference for returns]
```

---

## Key Relationships

1. **Products & Variants:**
   - `products` → `product_variants` (one-to-many)
   - `products` → `categories` (many-to-one)

2. **Purchase Orders:**
   - `purchase_orders` → `purchase_order_items` (one-to-many)
   - `purchase_order_items` → `product_variants` (many-to-one)
   - `purchase_orders` → `supplier` (many-to-one)
   - `purchase_order_items` → `po_price_proposals` (one-to-many)

3. **Transactions:**
   - `transactions` → `transaction_items` (one-to-many)
   - `transaction_items` → `product_variants` (many-to-one)
   - `transactions` → `member` (many-to-one, optional)
   - `transactions` → `transactions` (self-reference for returns)

4. **User Management:**
   - `staff`, `supplier`, `developer`, `member` are separate user tables
   - `staff.user_id` → `auth.users.id` (Supabase Auth)

---

## Notes

- All tables use UUID primary keys generated with `gen_random_uuid()` or `uuid_generate_v4()`
- Timestamps use both `timestamp with time zone` and `timestamp without time zone` depending on the table
- Foreign key relationships are properly defined
- Unique constraints on email addresses and codes prevent duplicates
- The `purchase_orders.status` field supports workflow: draft → pending → payment_pending → processing → completed
- `password_resets` table stores OTP codes for password reset functionality
- `po_price_proposals` supports supplier price negotiation workflow

---

## Missing Tables (From Data Model)

Based on the DATA_MODEL_REFINEMENT.md, these tables may need to be created:
- `activity_logs` - For audit logging
- `stock_movement` - For inventory tracking
- `deliveries` - For delivery management
- `supplier_invoices` - For invoice tracking
- `settings` - For system settings (general settings, member policy)
- `stock_count_requests` - For stock take requests
- `stock_count_items` - For stock take item details

---

**Last Updated:** December 16, 2025  
**Source:** Supabase Public Schema Explorer CSV Export
