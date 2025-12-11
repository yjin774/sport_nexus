# Supabase Database Schema Reference

> **Last Updated:** 2024-12-19
> 
> This document serves as a reference for the current state of the Supabase database schema.
> Update this file whenever the database structure changes.

---

## Overview

This document contains the current schema structure for all tables in the Supabase database, including column names, data types, and constraints.

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
| company_name | character varying | YES | null | ❌ NO | **Display name for supplier** |
| contact_person | character varying | YES | null | ❌ NO | Contact person name |
| phone | character varying | YES | null | ❌ NO | Contact phone |
| address | text | YES | null | ❌ NO | Business address |
| status | character varying | YES | 'active' | ❌ NO | Supplier status |
| user_code | text | YES | null | ❌ NO | User code (e.g., SUP123456) |
| created_at | timestamp with time zone | YES | now() | ❌ NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | now() | ❌ NO | Update timestamp |

**Key Fields for Current User Display:**
- ⚠️ **NO `username` field** - Supplier table does not have username
- ✅ **`company_name`** - Primary field for displaying supplier name
- ✅ `email` - Fallback option (uses prefix before @)
- ✅ `contact_person` - Alternative display option

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

## Change Log

| Date | Change | Author | Notes |
|------|--------|--------|-------|
| 2024-12-19 | Initial schema documentation | AI Assistant | Created from database inspection results |
| 2024-12-19 | Added transactions and transaction_items tables | AI Assistant | Added sales data tables for statistic page |
