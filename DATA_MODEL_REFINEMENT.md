# SportNexus POS System - Data Model Refinement

## Overview
This document identifies and refines all data fields required for a complete POS (Point of Sale) system based on the system analysis documentation. Each entity's data fields are organized by purpose and enhanced for completeness.

---

## 1. User Management & Security

### 1.1 Users Table (D1 Users)
**Purpose**: Store all user accounts (Admin, Manager, Cashier, Staff, Developer)

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login credential) |
| password_hash | TEXT | NOT NULL | Encrypted password (handled by Supabase Auth) |
| role | VARCHAR(50) | NOT NULL, CHECK | User role: 'admin', 'manager', 'cashier', 'staff', 'developer', 'supplier' |
| first_name | VARCHAR(100) | | User's first name |
| last_name | VARCHAR(100) | | User's last name |
| phone | VARCHAR(20) | | Contact phone number |
| employee_id | VARCHAR(50) | UNIQUE | Employee identification number |
| department | VARCHAR(100) | | Department/division |
| position | VARCHAR(100) | | Job position/title |
| is_active | BOOLEAN | DEFAULT true | Account active status |
| last_login | TIMESTAMP | | Last successful login timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| created_by | UUID | FOREIGN KEY | User who created this account |
| notes | TEXT | | Additional notes about the user |

**Refinements Added**:
- `employee_id`: For tracking employees separately from auth
- `is_active`: To enable/disable accounts without deletion
- `last_login`: For security monitoring
- `created_by`: Audit trail for account creation
- `notes`: For additional user information

---

### 1.2 Roles Table (D2 Roles)
**Purpose**: Define access rights and permissions for each role

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique role identifier |
| role_name | VARCHAR(50) | UNIQUE, NOT NULL | Role name: 'admin', 'manager', 'cashier', 'staff', 'developer' |
| description | TEXT | | Role description |
| can_manage_users | BOOLEAN | DEFAULT false | Permission to manage user accounts |
| can_manage_products | BOOLEAN | DEFAULT false | Permission to manage products |
| can_manage_inventory | BOOLEAN | DEFAULT false | Permission to manage inventory |
| can_process_sales | BOOLEAN | DEFAULT false | Permission to process sales |
| can_process_returns | BOOLEAN | DEFAULT false | Permission to process returns |
| can_view_reports | BOOLEAN | DEFAULT false | Permission to view reports |
| can_manage_suppliers | BOOLEAN | DEFAULT false | Permission to manage suppliers |
| can_create_purchase_orders | BOOLEAN | DEFAULT false | Permission to create POs |
| can_adjust_stock | BOOLEAN | DEFAULT false | Permission to adjust stock |
| can_view_activity_logs | BOOLEAN | DEFAULT false | Permission to view activity logs |
| created_at | TIMESTAMP | DEFAULT NOW() | Role creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Refinements Added**:
- Granular permission flags for fine-grained access control
- Description field for documentation

---

### 1.3 Activity Logs Table (D3 ActivityLogs)
**Purpose**: Record all sensitive system operations for audit and accountability

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique log entry identifier |
| user_id | UUID | FOREIGN KEY, NOT NULL | User who performed the action |
| activity_type | VARCHAR(50) | NOT NULL | Type: 'login', 'logout', 'account_created', 'account_updated', 'price_change', 'stock_adjustment', 'return', 'refund', 'po_created', 'po_updated' |
| entity_type | VARCHAR(50) | | Entity affected: 'user', 'product', 'stock', 'transaction', 'purchase_order' |
| entity_id | UUID | | ID of the affected entity |
| action_description | TEXT | NOT NULL | Human-readable description of the action |
| old_value | JSONB | | Previous state (for updates) |
| new_value | JSONB | | New state (for updates) |
| ip_address | VARCHAR(45) | | IP address of the user |
| device_info | VARCHAR(255) | | Device/browser information |
| machine_id | VARCHAR(100) | | POS machine identifier |
| session_id | UUID | FOREIGN KEY | Related device session |
| timestamp | TIMESTAMP | DEFAULT NOW() | When the action occurred |
| status | VARCHAR(20) | DEFAULT 'success' | 'success', 'failed', 'error' |
| error_message | TEXT | | Error details if status is 'failed' or 'error' |

**Refinements Added**:
- `old_value` and `new_value`: For tracking changes in detail
- `ip_address` and `device_info`: For security tracking
- `machine_id`: For multi-device POS tracking
- `status` and `error_message`: For failed operation tracking

---

### 1.4 Members Table (D4 Members)
**Purpose**: Store customer membership information

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique member identifier |
| member_code | VARCHAR(50) | UNIQUE, NOT NULL | Member identification code |
| first_name | VARCHAR(100) | NOT NULL | Member's first name |
| last_name | VARCHAR(100) | NOT NULL | Member's last name |
| email | VARCHAR(255) | UNIQUE | Member email |
| phone | VARCHAR(20) | | Contact phone number |
| date_of_birth | DATE | | Date of birth |
| address | TEXT | | Physical address |
| city | VARCHAR(100) | | City |
| state | VARCHAR(100) | | State/Province |
| postal_code | VARCHAR(20) | | Postal/ZIP code |
| country | VARCHAR(100) | | Country |
| membership_type | VARCHAR(50) | | 'regular', 'premium', 'vip' |
| membership_status | VARCHAR(20) | DEFAULT 'active' | 'active', 'inactive', 'suspended', 'expired' |
| join_date | DATE | DEFAULT CURRENT_DATE | Membership start date |
| expiry_date | DATE | | Membership expiry date |
| total_points | INTEGER | DEFAULT 0 | Loyalty points accumulated |
| total_spent | DECIMAL(10,2) | DEFAULT 0.00 | Total amount spent |
| last_purchase_date | DATE | | Date of last purchase |
| notes | TEXT | | Additional member notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Membership creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| created_by | UUID | FOREIGN KEY | Staff who registered the member |

**Refinements Added**:
- Complete address fields for delivery/marketing
- `membership_type` and `membership_status`: For tiered memberships
- `total_points` and `total_spent`: For loyalty program
- `last_purchase_date`: For customer analytics

---

### 1.5 Device Sessions Table (D5 DeviceSessions)
**Purpose**: Track POS device sessions for authenticated users

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique session identifier |
| user_id | UUID | FOREIGN KEY, NOT NULL | User who started the session |
| device_id | VARCHAR(100) | NOT NULL | Unique device identifier |
| device_name | VARCHAR(255) | | Device name/description |
| device_type | VARCHAR(50) | | 'mobile', 'tablet', 'desktop', 'pos_terminal' |
| ip_address | VARCHAR(45) | | Device IP address |
| session_start | TIMESTAMP | DEFAULT NOW() | Session start time |
| session_end | TIMESTAMP | | Session end time (NULL if active) |
| last_activity | TIMESTAMP | DEFAULT NOW() | Last activity timestamp |
| is_active | BOOLEAN | DEFAULT true | Whether session is currently active |
| auto_logout_time | INTEGER | DEFAULT 30 | Auto-logout time in minutes of inactivity |
| location | VARCHAR(255) | | Physical location/branch |
| notes | TEXT | | Session notes |

**Refinements Added**:
- `device_type`: For device-specific handling
- `last_activity`: For auto-logout functionality
- `auto_logout_time`: Configurable timeout
- `location`: For multi-branch tracking

---

## 2. Product & Supplier Management

### 2.1 Products Table (D5 Products)
**Purpose**: Store parent-level product information

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique product identifier |
| product_code | VARCHAR(100) | UNIQUE, NOT NULL | Product code/SKU prefix |
| product_name | VARCHAR(255) | NOT NULL | Product name |
| brand | VARCHAR(100) | | Brand name |
| category_id | UUID | FOREIGN KEY | Product category |
| description | TEXT | | Product description |
| image_url | TEXT | | Product image URL |
| image_urls | TEXT[] | | Multiple product images |
| status | VARCHAR(20) | DEFAULT 'active' | 'active', 'inactive', 'discontinued' |
| is_taxable | BOOLEAN | DEFAULT true | Whether product is taxable |
| tax_rate | DECIMAL(5,2) | DEFAULT 0.00 | Tax rate percentage |
| tags | VARCHAR(100)[] | | Product tags for search |
| created_at | TIMESTAMP | DEFAULT NOW() | Product creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| created_by | UUID | FOREIGN KEY | User who created the product |

**Refinements Added**:
- `product_code`: For SKU generation
- `image_urls`: Multiple images support
- `status`: For product lifecycle management
- `is_taxable` and `tax_rate`: For tax calculation
- `tags`: For enhanced search functionality

---

### 2.2 Product Variants Table (D6 ProductVariants)
**Purpose**: Store detailed product variants (size, color, weight, grip, etc.)

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique variant identifier |
| product_id | UUID | FOREIGN KEY, NOT NULL | Parent product reference |
| sku | VARCHAR(100) | UNIQUE, NOT NULL | Stock Keeping Unit |
| barcode | VARCHAR(100) | UNIQUE | Barcode (EAN, UPC, etc.) |
| variant_name | VARCHAR(255) | | Variant name/description |
| size | VARCHAR(50) | | Size variant |
| color | VARCHAR(50) | | Color variant |
| weight | VARCHAR(50) | | Weight variant |
| grip | VARCHAR(50) | | Grip variant |
| material | VARCHAR(100) | | Material variant |
| custom_attributes | JSONB | | Additional variant attributes |
| cost_price | DECIMAL(10,2) | NOT NULL | Cost price (purchase price) |
| selling_price | DECIMAL(10,2) | NOT NULL | Selling price |
| discount_price | DECIMAL(10,2) | | Discounted price (if on sale) |
| min_selling_price | DECIMAL(10,2) | | Minimum allowed selling price |
| current_stock | INTEGER | DEFAULT 0 | Current stock quantity |
| reorder_level | INTEGER | DEFAULT 0 | Reorder point threshold |
| reorder_quantity | INTEGER | DEFAULT 0 | Quantity to reorder |
| max_stock | INTEGER | | Maximum stock capacity |
| unit_of_measure | VARCHAR(20) | DEFAULT 'pcs' | 'pcs', 'kg', 'm', 'box', etc. |
| location | VARCHAR(255) | | Storage location/warehouse |
| status | VARCHAR(20) | DEFAULT 'active' | 'active', 'inactive', 'out_of_stock', 'discontinued' |
| last_sold_date | DATE | | Date of last sale |
| total_sold | INTEGER | DEFAULT 0 | Total quantity sold (lifetime) |
| created_at | TIMESTAMP | DEFAULT NOW() | Variant creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Refinements Added**:
- `custom_attributes`: JSONB for flexible variant attributes
- `discount_price` and `min_selling_price`: For pricing control
- `reorder_level` and `reorder_quantity`: For inventory management
- `max_stock`: For capacity planning
- `unit_of_measure`: For different measurement units
- `location`: For warehouse management
- `last_sold_date` and `total_sold`: For sales analytics

---

### 2.3 Categories Table
**Purpose**: Organize products into categories

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique category identifier |
| category_code | VARCHAR(50) | UNIQUE, NOT NULL | Category code |
| category_name | VARCHAR(255) | NOT NULL | Category name |
| parent_category_id | UUID | FOREIGN KEY | Parent category (for hierarchy) |
| description | TEXT | | Category description |
| image_url | TEXT | | Category image |
| display_order | INTEGER | DEFAULT 0 | Display order for sorting |
| is_active | BOOLEAN | DEFAULT true | Category active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Category creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Refinements Added**:
- `parent_category_id`: For hierarchical categories
- `display_order`: For custom sorting
- `is_active`: For category management

---

### 2.4 Suppliers Table (D7 Suppliers)
**Purpose**: Store supplier information

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique supplier identifier |
| supplier_code | VARCHAR(50) | UNIQUE, NOT NULL | Supplier code |
| company_name | VARCHAR(255) | NOT NULL | Company name |
| contact_person | VARCHAR(100) | | Primary contact person |
| email | VARCHAR(255) | | Contact email |
| phone | VARCHAR(20) | | Contact phone |
| alternate_phone | VARCHAR(20) | | Alternate phone |
| address | TEXT | | Company address |
| city | VARCHAR(100) | | City |
| state | VARCHAR(100) | | State/Province |
| postal_code | VARCHAR(20) | | Postal/ZIP code |
| country | VARCHAR(100) | | Country |
| tax_id | VARCHAR(100) | | Tax identification number |
| payment_terms | VARCHAR(100) | | Payment terms (e.g., "Net 30") |
| credit_limit | DECIMAL(10,2) | | Credit limit |
| currency | VARCHAR(3) | DEFAULT 'MYR' | Currency code |
| lead_time_days | INTEGER | | Average delivery lead time in days |
| status | VARCHAR(20) | DEFAULT 'active' | 'active', 'inactive', 'blacklisted' |
| rating | INTEGER | CHECK (rating >= 1 AND rating <= 5) | Supplier rating (1-5) |
| notes | TEXT | | Additional supplier notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Supplier creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| created_by | UUID | FOREIGN KEY | User who created the supplier |

**Refinements Added**:
- Complete address fields
- `tax_id`: For tax reporting
- `payment_terms` and `credit_limit`: For financial management
- `currency`: For multi-currency support
- `lead_time_days`: For delivery planning
- `rating`: For supplier evaluation

---

### 2.5 Purchase Orders Table (D8 PurchaseOrders)
**Purpose**: Store purchase order headers

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique PO identifier |
| po_number | VARCHAR(100) | UNIQUE, NOT NULL | Purchase order number |
| supplier_id | UUID | FOREIGN KEY, NOT NULL | Supplier reference |
| order_date | DATE | DEFAULT CURRENT_DATE | Order date |
| expected_delivery_date | DATE | | Expected delivery date |
| status | VARCHAR(50) | DEFAULT 'draft' | 'draft', 'pending', 'partially_received', 'completed', 'cancelled' |
| subtotal | DECIMAL(10,2) | DEFAULT 0.00 | Subtotal before tax |
| tax_amount | DECIMAL(10,2) | DEFAULT 0.00 | Tax amount |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | Discount amount |
| total_amount | DECIMAL(10,2) | DEFAULT 0.00 | Total amount |
| currency | VARCHAR(3) | DEFAULT 'MYR' | Currency code |
| notes | TEXT | | PO notes/comments |
| created_at | TIMESTAMP | DEFAULT NOW() | PO creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| created_by | UUID | FOREIGN KEY | User who created the PO |
| approved_by | UUID | FOREIGN KEY | User who approved the PO |
| approved_at | TIMESTAMP | | Approval timestamp |

**Refinements Added**:
- `po_number`: Unique PO identifier
- `expected_delivery_date`: For delivery tracking
- Detailed status lifecycle
- Financial fields: `subtotal`, `tax_amount`, `discount_amount`, `total_amount`
- `currency`: For multi-currency support
- `approved_by` and `approved_at`: For approval workflow

---

### 2.6 Purchase Order Items Table (D9 PurchaseOrderItems)
**Purpose**: Store purchase order line items

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique PO item identifier |
| purchase_order_id | UUID | FOREIGN KEY, NOT NULL | Purchase order reference |
| product_variant_id | UUID | FOREIGN KEY, NOT NULL | Product variant reference |
| quantity_ordered | INTEGER | NOT NULL, CHECK (quantity_ordered > 0) | Quantity ordered |
| quantity_received | INTEGER | DEFAULT 0 | Quantity received so far |
| unit_cost | DECIMAL(10,2) | NOT NULL | Cost per unit |
| discount_percentage | DECIMAL(5,2) | DEFAULT 0.00 | Discount percentage |
| line_total | DECIMAL(10,2) | NOT NULL | Line total (quantity × unit_cost - discount) |
| notes | TEXT | | Item-specific notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Item creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Refinements Added**:
- `quantity_received`: For partial delivery tracking
- `discount_percentage`: For item-level discounts
- `line_total`: Calculated field for line item total

---

## 3. Inventory Management

### 3.1 Stock Movement Table (D10 StockMovement)
**Purpose**: Record all stock movements (in, out, adjustment)

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique movement identifier |
| product_variant_id | UUID | FOREIGN KEY, NOT NULL | Product variant reference |
| movement_type | VARCHAR(50) | NOT NULL | 'stock_in', 'stock_out', 'adjustment', 'return', 'transfer', 'damaged', 'lost' |
| quantity | INTEGER | NOT NULL | Quantity moved (positive for in, negative for out) |
| previous_stock | INTEGER | NOT NULL | Stock level before movement |
| new_stock | INTEGER | NOT NULL | Stock level after movement |
| reference_type | VARCHAR(50) | | 'purchase_order', 'delivery', 'sale', 'return', 'adjustment', 'stock_count' |
| reference_id | UUID | | ID of the reference document |
| reason_code | VARCHAR(50) | | 'damaged', 'lost', 'audit_correction', 'expired', 'theft', 'other' |
| reason_description | TEXT | | Detailed reason description |
| location_from | VARCHAR(255) | | Source location |
| location_to | VARCHAR(255) | | Destination location |
| cost_per_unit | DECIMAL(10,2) | | Cost per unit at time of movement |
| total_cost | DECIMAL(10,2) | | Total cost of movement |
| user_id | UUID | FOREIGN KEY, NOT NULL | User who performed the movement |
| device_id | VARCHAR(100) | | Device/POS machine identifier |
| notes | TEXT | | Additional notes |
| movement_date | TIMESTAMP | DEFAULT NOW() | When the movement occurred |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Refinements Added**:
- `previous_stock` and `new_stock`: For stock level tracking
- `reference_type` and `reference_id`: For linking to source documents
- `reason_code` and `reason_description`: For adjustment tracking
- `location_from` and `location_to`: For transfer tracking
- `cost_per_unit` and `total_cost`: For cost tracking
- `device_id`: For multi-device tracking

---

### 3.2 Deliveries Table (D15 Deliveries)
**Purpose**: Record supplier deliveries

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique delivery identifier |
| delivery_number | VARCHAR(100) | UNIQUE, NOT NULL | Delivery note number |
| purchase_order_id | UUID | FOREIGN KEY, NOT NULL | Related purchase order |
| supplier_id | UUID | FOREIGN KEY, NOT NULL | Supplier reference |
| delivery_date | DATE | DEFAULT CURRENT_DATE | Delivery date |
| received_date | TIMESTAMP | DEFAULT NOW() | When delivery was received |
| status | VARCHAR(50) | DEFAULT 'pending' | 'pending', 'partial', 'complete', 'rejected' |
| delivery_note_number | VARCHAR(100) | | Supplier's delivery note number |
| carrier | VARCHAR(255) | | Delivery carrier/company |
| tracking_number | VARCHAR(100) | | Tracking number |
| received_by | UUID | FOREIGN KEY | User who received the delivery |
| checked_by | UUID | FOREIGN KEY | User who checked the delivery |
| notes | TEXT | | Delivery notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Delivery record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Refinements Added**:
- `delivery_number`: Unique delivery identifier
- `delivery_note_number`: Supplier's reference
- `carrier` and `tracking_number`: For logistics tracking
- `received_by` and `checked_by`: For accountability
- `status`: For delivery lifecycle

---

### 3.3 Delivery Items Table
**Purpose**: Store delivery line items

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique delivery item identifier |
| delivery_id | UUID | FOREIGN KEY, NOT NULL | Delivery reference |
| purchase_order_item_id | UUID | FOREIGN KEY, NOT NULL | Related PO item |
| product_variant_id | UUID | FOREIGN KEY, NOT NULL | Product variant reference |
| quantity_ordered | INTEGER | NOT NULL | Quantity from PO |
| quantity_received | INTEGER | NOT NULL | Quantity actually received |
| quantity_accepted | INTEGER | DEFAULT 0 | Quantity accepted (may differ from received) |
| quantity_rejected | INTEGER | DEFAULT 0 | Quantity rejected |
| unit_cost | DECIMAL(10,2) | NOT NULL | Cost per unit |
| condition | VARCHAR(50) | DEFAULT 'good' | 'good', 'damaged', 'expired', 'wrong_item' |
| expiry_date | DATE | | Product expiry date (if applicable) |
| batch_number | VARCHAR(100) | | Batch/lot number |
| notes | TEXT | | Item-specific notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Item creation timestamp |

**Refinements Added**:
- `quantity_accepted` and `quantity_rejected`: For quality control
- `condition`: For quality tracking
- `expiry_date` and `batch_number`: For inventory tracking

---

### 3.4 Supplier Invoices Table (D16 SupplierInvoices)
**Purpose**: Record supplier invoices for payment verification

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique invoice identifier |
| invoice_number | VARCHAR(100) | UNIQUE, NOT NULL | Supplier invoice number |
| supplier_id | UUID | FOREIGN KEY, NOT NULL | Supplier reference |
| purchase_order_id | UUID | FOREIGN KEY | Related purchase order |
| delivery_id | UUID | FOREIGN KEY | Related delivery |
| invoice_date | DATE | NOT NULL | Invoice date |
| due_date | DATE | | Payment due date |
| subtotal | DECIMAL(10,2) | NOT NULL | Subtotal before tax |
| tax_amount | DECIMAL(10,2) | DEFAULT 0.00 | Tax amount |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | Discount amount |
| total_amount | DECIMAL(10,2) | NOT NULL | Total invoice amount |
| currency | VARCHAR(3) | DEFAULT 'MYR' | Currency code |
| payment_status | VARCHAR(50) | DEFAULT 'unpaid' | 'unpaid', 'partial', 'paid', 'overdue', 'cancelled' |
| payment_date | DATE | | Date of payment |
| payment_method | VARCHAR(50) | | Payment method |
| payment_reference | VARCHAR(100) | | Payment reference number |
| notes | TEXT | | Invoice notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Invoice creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| created_by | UUID | FOREIGN KEY | User who recorded the invoice |

**Refinements Added**:
- `due_date`: For payment tracking
- Financial fields for invoice calculation
- `payment_status` and related payment fields: For payment management
- Links to PO and delivery for reconciliation

---

### 3.5 Stock Count Table
**Purpose**: Record physical stock count/audit operations

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique count identifier |
| count_number | VARCHAR(100) | UNIQUE, NOT NULL | Stock count number |
| count_date | DATE | DEFAULT CURRENT_DATE | Count date |
| location | VARCHAR(255) | | Location/warehouse being counted |
| status | VARCHAR(50) | DEFAULT 'in_progress' | 'in_progress', 'completed', 'cancelled' |
| started_by | UUID | FOREIGN KEY, NOT NULL | User who started the count |
| completed_by | UUID | FOREIGN KEY | User who completed the count |
| started_at | TIMESTAMP | DEFAULT NOW() | Count start time |
| completed_at | TIMESTAMP | | Count completion time |
| notes | TEXT | | Count notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Count creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Refinements Added**:
- `count_number`: Unique identifier
- `location`: For location-specific counts
- `status`: For count lifecycle
- User tracking for accountability

---

### 3.6 Stock Count Items Table
**Purpose**: Store individual item counts during stock audit

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique count item identifier |
| stock_count_id | UUID | FOREIGN KEY, NOT NULL | Stock count reference |
| product_variant_id | UUID | FOREIGN KEY, NOT NULL | Product variant reference |
| system_stock | INTEGER | NOT NULL | System stock level at count time |
| counted_quantity | INTEGER | | Physically counted quantity |
| variance | INTEGER | | Difference (counted - system) |
| variance_reason | VARCHAR(100) | | Reason for variance |
| counted_by | UUID | FOREIGN KEY | User who counted this item |
| counted_at | TIMESTAMP | DEFAULT NOW() | When item was counted |
| notes | TEXT | | Item-specific notes |

**Refinements Added**:
- `system_stock`: System quantity at count time
- `variance`: Calculated difference
- `variance_reason`: For variance analysis
- User tracking for accountability

---

## 4. POS Sales & Returns

### 4.1 Transactions Table
**Purpose**: Store sales transaction headers

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique transaction identifier |
| transaction_number | VARCHAR(100) | UNIQUE, NOT NULL | Transaction number/receipt number |
| transaction_date | TIMESTAMP | DEFAULT NOW() | Transaction date and time |
| user_id | UUID | FOREIGN KEY, NOT NULL | Cashier/user who processed |
| member_id | UUID | FOREIGN KEY | Member (if applicable) |
| device_id | VARCHAR(100) | NOT NULL | POS device identifier |
| session_id | UUID | FOREIGN KEY | Device session reference |
| transaction_type | VARCHAR(50) | DEFAULT 'sale' | 'sale', 'return', 'exchange', 'refund' |
| original_transaction_id | UUID | FOREIGN KEY | Original transaction (for returns) |
| subtotal | DECIMAL(10,2) | NOT NULL | Subtotal before tax and discount |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | Total discount amount |
| tax_amount | DECIMAL(10,2) | DEFAULT 0.00 | Total tax amount |
| total_amount | DECIMAL(10,2) | NOT NULL | Final total amount |
| payment_method | VARCHAR(50) | NOT NULL | 'cash', 'card', 'mobile_payment', 'mixed' |
| cash_amount | DECIMAL(10,2) | | Cash amount paid |
| card_amount | DECIMAL(10,2) | | Card amount paid |
| change_amount | DECIMAL(10,2) | DEFAULT 0.00 | Change given |
| points_earned | INTEGER | DEFAULT 0 | Loyalty points earned |
| points_redeemed | INTEGER | DEFAULT 0 | Loyalty points redeemed |
| status | VARCHAR(50) | DEFAULT 'completed' | 'completed', 'pending', 'cancelled', 'refunded' |
| is_offline | BOOLEAN | DEFAULT false | Whether transaction was offline |
| synced_at | TIMESTAMP | | When offline transaction was synced |
| receipt_printed | BOOLEAN | DEFAULT false | Whether receipt was printed |
| notes | TEXT | | Transaction notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Transaction creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Refinements Added**:
- `transaction_number`: Unique receipt number
- `member_id`: For member transactions
- `transaction_type` and `original_transaction_id`: For returns/exchanges
- Detailed payment fields: `cash_amount`, `card_amount`, `change_amount`
- `points_earned` and `points_redeemed`: For loyalty program
- `is_offline` and `synced_at`: For offline capability
- `receipt_printed`: For receipt tracking

---

### 4.2 Transaction Items Table
**Purpose**: Store transaction line items

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique transaction item identifier |
| transaction_id | UUID | FOREIGN KEY, NOT NULL | Transaction reference |
| product_variant_id | UUID | FOREIGN KEY, NOT NULL | Product variant reference |
| quantity | INTEGER | NOT NULL, CHECK (quantity > 0) | Quantity sold |
| unit_price | DECIMAL(10,2) | NOT NULL | Price per unit at time of sale |
| discount_percentage | DECIMAL(5,2) | DEFAULT 0.00 | Discount percentage |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | Discount amount |
| tax_amount | DECIMAL(10,2) | DEFAULT 0.00 | Tax amount for this item |
| line_total | DECIMAL(10,2) | NOT NULL | Line total (quantity × unit_price - discount + tax) |
| cost_price | DECIMAL(10,2) | | Cost price at time of sale (for profit calculation) |
| profit | DECIMAL(10,2) | | Profit for this line item |
| created_at | TIMESTAMP | DEFAULT NOW() | Item creation timestamp |

**Refinements Added**:
- `unit_price`: Price at time of sale (for price history)
- `discount_percentage` and `discount_amount`: For item-level discounts
- `tax_amount`: For item-level tax
- `cost_price` and `profit`: For profit analysis

---

### 4.3 Offline Transactions Table (Transaction Local)
**Purpose**: Queue transactions when network is unavailable

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique offline transaction identifier |
| local_transaction_id | VARCHAR(100) | UNIQUE, NOT NULL | Local transaction ID |
| transaction_data | JSONB | NOT NULL | Complete transaction data (JSON) |
| device_id | VARCHAR(100) | NOT NULL | Device identifier |
| user_id | UUID | NOT NULL | User who created the transaction |
| created_at | TIMESTAMP | DEFAULT NOW() | When transaction was created offline |
| synced_at | TIMESTAMP | | When transaction was synced to server |
| sync_status | VARCHAR(50) | DEFAULT 'pending' | 'pending', 'syncing', 'synced', 'failed' |
| sync_attempts | INTEGER | DEFAULT 0 | Number of sync attempts |
| error_message | TEXT | | Error message if sync failed |
| retry_at | TIMESTAMP | | Next retry timestamp |

**Refinements Added**:
- `transaction_data`: JSONB for flexible storage
- `sync_status` and `sync_attempts`: For sync management
- `retry_at`: For automatic retry logic

---

## 5. Reporting & Analytics

### 5.1 Sales Summary Table (Optional - for performance)
**Purpose**: Pre-calculated sales summaries for fast reporting

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique summary identifier |
| summary_date | DATE | NOT NULL | Date of summary |
| total_transactions | INTEGER | DEFAULT 0 | Total number of transactions |
| total_sales | DECIMAL(10,2) | DEFAULT 0.00 | Total sales amount |
| total_cost | DECIMAL(10,2) | DEFAULT 0.00 | Total cost |
| total_profit | DECIMAL(10,2) | DEFAULT 0.00 | Total profit |
| total_tax | DECIMAL(10,2) | DEFAULT 0.00 | Total tax collected |
| total_discount | DECIMAL(10,2) | DEFAULT 0.00 | Total discounts given |
| cash_sales | DECIMAL(10,2) | DEFAULT 0.00 | Cash sales amount |
| card_sales | DECIMAL(10,2) | DEFAULT 0.00 | Card sales amount |
| created_at | TIMESTAMP | DEFAULT NOW() | Summary creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Refinements Added**:
- Pre-aggregated data for fast reporting
- Daily summaries for dashboard performance

---

## 6. Additional Refinements

### 6.1 Settings/Configuration Table
**Purpose**: Store system-wide settings

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique setting identifier |
| setting_key | VARCHAR(100) | UNIQUE, NOT NULL | Setting key |
| setting_value | TEXT | | Setting value (JSON if complex) |
| setting_type | VARCHAR(50) | | 'string', 'number', 'boolean', 'json' |
| description | TEXT | | Setting description |
| category | VARCHAR(50) | | 'general', 'pos', 'inventory', 'reporting', 'security' |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| updated_by | UUID | FOREIGN KEY | User who updated the setting |

---

### 6.2 Notifications Table
**Purpose**: Store system notifications and alerts

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique notification identifier |
| user_id | UUID | FOREIGN KEY | Target user (NULL for broadcast) |
| notification_type | VARCHAR(50) | NOT NULL | 'low_stock', 'po_received', 'system_alert', 'reminder' |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| is_read | BOOLEAN | DEFAULT false | Read status |
| priority | VARCHAR(20) | DEFAULT 'normal' | 'low', 'normal', 'high', 'urgent' |
| action_url | TEXT | | URL to related action |
| created_at | TIMESTAMP | DEFAULT NOW() | Notification creation timestamp |
| read_at | TIMESTAMP | | When notification was read |

---

## Summary of Key Refinements

### Security & Audit
- Enhanced activity logging with old/new values
- IP address and device tracking
- User accountability fields throughout

### Inventory Management
- Location tracking for multi-warehouse support
- Batch/lot number tracking
- Expiry date management
- Cost tracking at movement level

### Financial Management
- Multi-currency support
- Detailed payment tracking
- Profit calculation fields
- Credit limit management for suppliers

### Offline Capability
- Offline transaction queue
- Sync status tracking
- Automatic retry mechanism

### Reporting & Analytics
- Pre-aggregated summary tables
- Sales analytics fields
- Slow-moving stock tracking
- Customer analytics (points, spending)

### Scalability
- JSONB fields for flexible attributes
- Indexed fields for performance
- Proper foreign key relationships
- Timestamp tracking for all records

---

## Recommended Indexes

```sql
-- Performance indexes
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_stock_movement_variant ON stock_movement(product_variant_id);
CREATE INDEX idx_stock_movement_date ON stock_movement(movement_date);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_members_code ON members(member_code);
```

---

## Next Steps

1. **Create all tables** in Supabase using the refined schema
2. **Set up Row Level Security (RLS)** policies for each table
3. **Create indexes** for performance optimization
4. **Implement triggers** for automatic calculations (stock updates, totals, etc.)
5. **Set up foreign key constraints** for data integrity
6. **Create views** for common queries (e.g., current stock levels, sales summaries)

This refined data model provides a complete foundation for a robust POS system with all necessary fields for inventory management, sales processing, reporting, and security.

