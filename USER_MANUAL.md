# Sport Nexus User Manual

## Table of Contents
1. [System Overview](#61-system-overview)
2. [User Roles](#612-user-roles)
3. [Module 1 – User & Membership Management](#613-module-1--user--membership-management)
4. [Module 2 – Product, Supplier & Procurement Management](#614-module-2--product-supplier--procurement-management)
5. [Module 3 – Inventory Management & Reporting](#615-module-3--inventory-management--reporting)
6. [Module 4 – POS System, Returns & Counter Operations](#616-module-4--pos-system-returns--counter-operations)
7. [Supplier Portal Usage](#617-supplier-portal-usage)
8. [Troubleshooting](#11-troubleshooting)

---

## 6.1 System Overview

### 6.1.1 System Architecture

The Sport Nexus system consists of three main interfaces:

#### **POS Application (Flutter App)**
- **Used by**: Cashier staff
- **Purpose**: Perform sales, returns, and counter operations
- **Platform**: Mobile/Tablet application (Flutter)
- **Note**: This is a separate application from the web portal. Screenshots and detailed instructions for the POS app should be documented separately.

#### **Manager Web Portal**
- **Used by**: Managers and staff
- **Purpose**: Manage products, inventory, procurement, reports, and system settings
- **Platform**: Web browser (Chrome, Firefox, Safari, Edge)
- **Access**: Available through web browser at the Sport Nexus URL

#### **Supplier Web Portal**
- **Used by**: Suppliers
- **Purpose**: Respond to purchase orders, negotiate prices, upload delivery orders, and track payment status
- **Platform**: Web browser
- **Access**: Available through web browser with supplier credentials

#### **Centralized Database**
All system components are connected to a centralized **Supabase PostgreSQL database** to ensure:
- Data consistency across all interfaces
- Real-time updates
- Secure data storage
- Synchronized inventory across POS and web portals

**Screenshot Required**: 
- **File**: System architecture diagram (if available) or login page showing role selection
- **File**: `index.html`
- **Section**: Lines 1-122 - Complete login page
- **Description**: "System login page showing role selection (STAFF/SUPPLIER)"

---

## 6.1.2 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Cashier** | Performs sales, returns, and daily counter operations | POS Application only |
| **Staff** | Assists with stock receiving and stock counting | Manager Web Portal (limited access) |
| **Manager** | Manages inventory, procurement, approvals, reports, and system settings | Manager Web Portal (full access) |
| **Supplier** | Responds to purchase orders and uploads delivery documents | Supplier Web Portal |

### Role Permissions Summary

**Cashier (POS App)**
- Process sales transactions
- Handle returns and refunds
- Close counter (with manager approval if early)
- View product catalog
- Apply discounts
- Generate receipts

**Staff (Web Portal)**
- View products and inventory
- Assist with stock receiving
- Perform stock counting
- View purchase orders (read-only)
- **Limited access to reports**: Staff can view reports (KPI cards, sales graphs, and data tables) but may have restrictions on:
  - **Report Export**: May not be able to export reports as CSV or PDF files (export buttons may be disabled or hidden)
  - **Detailed Breakdowns**: May not have access to detailed sales breakdown views showing individual transactions
  - **Sensitive Data**: May not see certain sensitive financial metrics (e.g., cost, gross profit) depending on system configuration
  - **Date Range**: May have restrictions on date range selection for reports
  
  **Note**: The specific restrictions for Staff role reports depend on your system's role-based access control (RBAC) configuration. Please verify with your system administrator what exact limitations are in place for Staff users.

**Manager (Web Portal)**
- Full access to all features
- Product and variant management
- Purchase order creation and management
- User management (Staff, Supplier, Member)
- System settings configuration
- Report generation and export
- Approval workflows
- Inventory management

**Supplier (Web Portal)**
- View incoming purchase orders
- Propose prices
- Accept/reject orders
- Generate delivery orders
- Upload delivery documents
- Track payment status
- View order history
- Manage return goods

---

## 6.1.3 Module 1 – User & Membership Management

This module covers user authentication, staff management, supplier management, and membership operations including points handling.

### 6.1.3.1 Staff Login

#### Accessing the System
1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Navigate to the Sport Nexus application URL
3. You will be directed to the login page

**Screenshot Required**: 
- **File**: `index.html`
- **Section**: Lines 1-122 - Complete login page
- **Description**: "Login page showing Sport Nexus logo, email and password fields, role selection buttons"

#### Step 1: Select Role
1. On the login page, you will see two role buttons: **STAFF** and **SUPPLIER**
2. Click on **STAFF** button (default selection)
3. The selected role will be highlighted

**Screenshot Required**:
- **File**: `index.html`
- **Section**: Lines 67-73 - Role toggle buttons
- **Description**: "Role selection buttons with STAFF selected"

#### Step 2: Enter Credentials
1. Enter your registered **email address** in the EMAIL field
2. Enter your **password** in the PASSWORD field
3. Click the eye icon to toggle password visibility if needed

**Screenshot Required**:
- **File**: `index.html`
- **Section**: Lines 25-65 - Email and password input fields
- **Description**: "Login form with email and password fields"

#### Step 3: Submit Login
1. Click the **LOGIN** button
2. If credentials are correct, you will be redirected to the Manager Web Portal dashboard
3. If incorrect, an error message will be displayed below the respective field

**Screenshot Required**:
- **File**: `index.html`
- **Section**: Line 83 - LOGIN button
- **Description**: "LOGIN button at bottom of form"

**Note**: For POS Application login, refer to the separate POS Application user manual.

---

### 6.1.3.2 User Management

#### Accessing User Management
1. After logging in as Manager, click **USER** in the top navigation menu
2. A dropdown menu will appear with three options:
   - **MEMBER**: Manage customer members
   - **STAFF**: Manage staff accounts
   - **SUPPLIER**: Manage supplier accounts

**Screenshot Required**:
- **File**: `manage-product-page.html` (or any dashboard page)
- **Section**: Lines 23-38 - USER dropdown menu
- **Description**: "USER menu expanded showing Member, Staff, Supplier options"

---

### 6.1.3.3 Staff Management

#### Viewing Staff List
1. Click **USER** > **STAFF** from the navigation menu
2. Staff management page displays with:
   - Search box for finding staff
   - Filters: Position, Status, Date, Action
   - Staff table showing: Code, Username, Email, Phone No, Position, Status, Joined Date, Actions

**Screenshot Required**:
- **File**: `user-staff.html`
- **Section**: Lines 72-236 - Complete staff management page
- **Description**: "Staff management page with filters and staff table"

#### Adding New Staff
1. Click **ACTION** dropdown button
2. Select **ADD USER**
3. Fill in the Add Staff form:
   - **CODE**: Click **GENERATE** to auto-generate a code, or enter manually
   - **USERNAME**: Enter username (3-30 characters, alphanumeric and underscore only)
   - **EMAIL**: Enter email address (must be unique)
   - **PHONE**: Enter phone number (Malaysian format: e.g., 0123456789)
   - **POSITION**: Select from dropdown (e.g., Manager, Staff, Cashier)
   - **STATUS**: Select Active or Inactive
4. Click **SAVE CHANGES**

**Screenshot Required**:
- **File**: `user-staff.html`
- **Section**: Lines 320-381 - Add Staff popup
- **Description**: "Add Staff form with all input fields"

#### Editing Staff Information
1. Find the staff member in the table
2. Click the **Edit** icon in the Actions column
3. Or click **ACTION** > **EDIT USER** and select the staff member
4. Modify information in the Edit User popup:
   - Username (editable)
   - Email (read-only)
   - Phone (editable)
   - Position (editable)
   - Status (editable)
5. Click **SAVE CHANGES**

**Screenshot Required**:
- **File**: `user-staff.html`
- **Section**: Lines 270-318 - Edit User popup
- **Description**: "Edit Staff form dialog"

#### Managing Staff Positions
1. Click the **POSITION** filter button
2. Scroll to bottom of position list
3. Click **EDIT POSITION** button
4. In the Edit Position popup:
   - View all existing positions
   - Click **ADD** to create a new position
   - Click **REMOVE** to delete a selected position
   - Click **EDIT** to modify a position name
5. Click **SAVE CHANGES** to apply modifications

**Screenshot Required**:
- **File**: `user-staff.html`
- **Section**: Lines 240-268 - Edit Position popup
- **Description**: "Position management dialog with ADD, REMOVE, EDIT buttons"

---

### 6.1.3.4 Supplier Management

#### Viewing Supplier List
1. Click **USER** > **SUPPLIER** from the navigation menu
2. Supplier management page displays with:
   - Search box
   - Filters: Status, Date, Action
   - Supplier table showing: Code, Company Name, Email, Contact Person, Phone No, Status, Joined Date, Actions

**Screenshot Required**:
- **File**: `user-supplier.html`
- **Section**: Lines 70-208 - Complete supplier management page
- **Description**: "Supplier management page with filters and supplier table"

#### Adding New Supplier
1. Click **ACTION** > **ADD USER**
2. Fill in the Add Supplier form:
   - **CODE**: Generate or enter manually
   - **COMPANY NAME**: Enter company name (required)
   - **EMAIL**: Enter email address (required, must be unique)
   - **PHONE**: Enter phone number (optional)
   - **STATUS**: Select Active or Inactive
3. Click **SAVE CHANGES**

**Screenshot Required**:
- **File**: `user-supplier.html`
- **Section**: Lines 260-319 - Add Supplier popup
- **Description**: "Add Supplier form dialog"

#### Editing Supplier Information
1. Find supplier in table
2. Click **Edit** icon in Actions column
3. Modify information in Edit User popup
4. Click **SAVE CHANGES**

**Screenshot Required**:
- **File**: `user-supplier.html`
- **Section**: Lines 211-258 - Edit User popup for supplier
- **Description**: "Edit Supplier form"

---

### 6.1.3.5 Membership Registration

#### Adding New Member
1. Navigate to **USER** > **MEMBER** from the navigation menu
2. Click **ACTION** > **ADD USER**
3. Fill in the Add Member form:
   - **CODE**: Click **GENERATE** or enter manually
   - **USERNAME**: Enter username (3-30 characters)
   - **EMAIL**: Enter email address (required, must be unique)
   - **PHONE**: Enter phone number (optional)
   - **MEMBER POINTS**: Enter initial points (default: 0)
   - **STATUS**: Select Active or Inactive
4. Click **SAVE CHANGES**

**Screenshot Required**:
- **File**: `user-member.html`
- **Section**: Lines 255-316 - Add Member popup
- **Description**: "Add Member form with member points field"

#### Viewing Member List
1. Click **USER** > **MEMBER**
2. Member management page displays with:
   - Search box
   - Filters: Status, Date, Action
   - Member table showing: Code, Username, Email, Phone No, Member Points, Status, Joined Date, Actions

**Screenshot Required**:
- **File**: `user-member.html`
- **Section**: Lines 70-208 - Complete member management page
- **Description**: "Member management page with filters and member table"

#### Editing Member Information
1. Find member in table
2. Click **Edit** icon in Actions column
3. Modify information in Edit User popup
4. Click **SAVE CHANGES**

**Screenshot Required**:
- **File**: `user-member.html`
- **Section**: Lines 211-253 - Edit User popup for member
- **Description**: "Edit Member form"

---

### 6.1.3.6 Membership Points Handling

#### How Points Are Awarded
1. Points are **automatically awarded** after a completed sale in the POS application
2. Points calculation is based on the **Bill Ratio for Points Eligibility** configured in General Settings
3. Example: If ratio is 20%, a RM100 purchase = 20 points
4. Points are stored as transaction records in the database
5. Each point batch has an expiration date based on **Points Duration** setting

#### Viewing Member Points
1. Navigate to **USER** > **MEMBER**
2. Find the member in the table
3. Click on the **Member Points** value or the Actions icon
4. Member Points popup opens showing:
   - **Total Points Available**: Sum of all non-expired points
   - **Points Breakdown**: List of point batches with:
     - Points amount per batch
     - Date earned
     - Expiration date
     - Status (Active/Expired)

**Screenshot Required**:
- **File**: `user-member.html`
- **Section**: Lines 384-418 - Member Points popup
- **Description**: "Member points dialog showing total points and points breakdown by batch"

#### Points Configuration (Manager Only)
Managers can configure point rules in **General Settings** > **Member Policy Settings**:
- **Bill Ratio for Points Eligibility (%)**: Percentage of bill that becomes points
- **Minimum Purchase Amount for Points (RM)**: Minimum purchase required to earn points
- **Points to Ringgit Malaysia Ratio**: How many points equal RM 1.00
- **Points Duration**: How long points remain valid (days or months)
- **Maximum Redemption Ratio (%)**: Maximum percentage of bill that can be paid with points

**Screenshot Required**:
- **File**: `general-settings.html`
- **Section**: Lines 167-239 - Member Policy Settings card
- **Description**: "Member Policy Settings showing all points configuration options"

#### Points Redemption
- Points can be redeemed during checkout in the POS application
- Maximum redemption is limited by the **Maximum Redemption Ratio** setting
- Example: If ratio is 20%, on a RM100 bill, maximum RM20 can be paid with points
- Points are deducted from oldest batch first (FIFO - First In First Out)

**Note**: Detailed points redemption process is documented in the POS Application user manual.

---

## 6.1.4 Module 2 – Product, Supplier & Procurement Management

This module covers product management, variant configuration, purchase order creation, and supplier price negotiation.

### 6.1.4.1 Product and Variant Management

#### Accessing Product Management
1. Log in to the Manager Web Portal
2. Click **MANAGE PRODUCT** in the navigation menu
3. Product management page displays

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 71-72 - Page title "MANAGE PRODUCT"
- **Description**: "Product management page header"

#### Viewing Products
The product management page shows:
- **AVAILABLE PRODUCT** section with product cards displaying product images and basic info
- Category filter dropdown
- Product action buttons: ADD PRODUCT, REMOVE PRODUCT, MANAGE CATEGORY, EDIT PRODUCT
- Product table with detailed information

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 74-117 - Product display section
- **Description**: "Product display section with category filter and action buttons"

#### Adding a New Product

##### Step 1: Open Add Product Dialog
1. Click the **ADD PRODUCT** button
2. Add Product popup opens

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 100-103 - ADD PRODUCT button
- **Description**: "Add Product button location"

##### Step 2: Fill Product Information
1. **Upload Product Image**: Click the image upload area to select a product image (JPG, PNG format)
2. **Product Code**: Click **GENERATE** to auto-generate a code, or enter manually
3. **Product Name**: Enter the product name (required, max 200 characters)
4. **Brand**: Enter the brand name (optional, max 50 characters)
5. **Category**: Select from dropdown (required - categories must exist)
6. **Description**: Enter product description (optional, max 1000 characters)
7. **Quantity**: Enter initial stock quantity (required, must be ≥ 0)
8. **Status**: Select Active or Inactive

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 278-355 - Add Product popup
- **Description**: "Add Product form with all input fields"

##### Step 3: Configure Variant Attributes
1. Click **CONFIGURE VARIANT ATTRIBUTES** button
2. Variant Attributes Configuration popup opens
3. Configure variant attributes:
   - **SIZE** (required): Enter sizes separated by commas (e.g., "S, M, L, XL")
   - **COLOR** (required): Enter colors separated by commas (e.g., "Red, Blue, Black")
   - **WEIGHT** (optional): Enter weight options (e.g., "100g, 200g") or leave empty to disable
   - **GRIP** (optional): Enter grip options (e.g., "Standard, Pro") or leave empty to disable
   - **MATERIAL** (optional): Enter material options (e.g., "Leather, Canvas") or leave empty to disable
4. Click **SAVE CONFIGURATION**

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 506-593 - Variant Attributes Configuration popup
- **Description**: "Variant attributes configuration dialog showing Size, Color, Weight, Grip, Material fields"

##### Step 4: Save Product
1. Review all entered information
2. Click **SAVE CHANGES** button
3. Product will be added to the system
4. System will automatically create variants based on configured attributes (e.g., if Size has 4 options and Color has 3 options, 12 variants will be created)

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Line 354 - SAVE CHANGES button
- **Description**: "Save Changes button in Add Product form"

#### Editing a Product

##### Step 1: Open Edit Dialog
1. Find the product in the product table
2. Click the **Edit** icon in the Actions column
3. Or click **EDIT PRODUCT** button and select a product

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 112-115 - EDIT PRODUCT button
- **Description**: "Edit Product button"

##### Step 2: Edit Product Details
1. Edit Product popup opens with two tabs: **GENERAL** and **VARIANTS**
2. In the **GENERAL** tab:
   - Update product image if needed
   - Modify product name, brand, category, description
   - Change status
   - Reconfigure variant attributes (this will affect existing variants)
3. In the **VARIANTS** tab:
   - View all product variants with their SKU codes
   - Add new variants using **+ ADD VARIANT** button
   - Edit existing variants (price, quantity, status)
   - Remove variants (if no active purchase orders reference them)

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 358-444 - Edit Product popup
- **Description**: "Edit Product dialog with GENERAL and VARIANTS tabs"

##### Step 3: Save Changes
1. Review all modifications
2. Click **SAVE CHANGES**
3. Changes will be applied to the product and its variants

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Line 442 - SAVE CHANGES button
- **Description**: "Save Changes button in Edit Product form"

#### Managing Categories

##### Step 1: Open Category Management
1. Click **MANAGE CATEGORY** button
2. Category management popup opens

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 108-111 - MANAGE CATEGORY button
- **Description**: "Manage Category button"

##### Step 2: Add/Remove/Edit Categories
1. In the popup, you will see a scrollable list of existing categories
2. Click **ADD** to create a new category
   - Enter category name in the input field
   - Category will be added to the list
3. Click **REMOVE** to delete a selected category
   - Warning: Categories with associated products cannot be removed
4. Click **EDIT** to modify a category name
   - Select category and enter new name
5. Click **SAVE CHANGES** to apply all modifications

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 248-276 - Category management popup
- **Description**: "Category management dialog with category list and ADD, REMOVE, EDIT buttons"

#### Removing Products
1. Click **REMOVE PRODUCT** button
2. Select the product(s) to remove from the table
3. Confirm the removal action
4. **Note**: Staff authentication may be required for this action
5. Products with active purchase orders or sales history may have restrictions

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 104-107 - REMOVE PRODUCT button
- **Description**: "Remove Product button"

#### Filtering Products
- **Search**: Type product name, code, or brand in search box
- **Category Filter**: Click category dropdown to filter by category
- **Status Filter**: Filter by Active or Inactive status
- **Date Filter**: Filter by creation date range

**Screenshot Required**:
- **File**: `manage-product-page.html`
- **Section**: Lines 120-197 - Filter bar with search, category, status, and date filters
- **Description**: "Product filter options"

---

### 6.1.4.2 Purchase Order Creation

#### Accessing Purchase Order Management
1. Navigate to **INVENTORY PURCHASE** in the navigation menu
2. Purchase Order management page displays

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 72-74 - Page title "MANAGE PURCHASE ORDER"
- **Description**: "Purchase Order management page header"

#### Viewing Available Products for Purchase
The page displays:
- **AVAILABLE PRODUCT** section showing products available for purchase
- Category filter to filter products
- **LOW STOCK** filter button to show only low stock items
- Product cards with product image, name, and current stock quantity

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 84-112 - Available products section
- **Description**: "Available products section with category filter and low stock button"

#### Creating a Purchase Order

##### Step 1: Select Product
1. Browse available products in the product cards section
2. Click on a product card to select it for purchase
3. The "Add to Purchase Order" popup opens automatically

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 109-111 - Product cards container
- **Description**: "Product cards showing available products for purchase"

##### Step 2: Enter Purchase Order Details
1. The popup shows:
   - **CHOSEN PRODUCT** section (left): Product image, name, current stock quantity, category
   - **PURCHASE ORDER DETAILS** section (right): Order form
2. Fill in the order details:
   - **Amount**: Enter quantity
     - Toggle between **PIECES** and **BOX** units (1 box = 12 pieces)
     - Enter numeric value
   - **Supplier**: Select a supplier from the dropdown (required)
   - **Product Variants**: If product has variants, select required variants (required)
     - Check boxes for each variant needed
     - Enter quantity per variant
   - **Remarks**: Enter optional notes or comments (max 1000 characters)

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 309-388 - Add to Purchase Order popup
- **Description**: "Add to Purchase Order dialog with chosen product and order details form"

##### Step 3: Add to Draft
1. Review all entered information
2. Click **ADD TO DRAFT** button
3. The purchase order will be saved as a draft
4. You can add more products to the same draft or create multiple drafts

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Line 383 - ADD TO DRAFT button
- **Description**: "Add to Draft button"

#### Managing Draft Purchase Orders

##### Step 1: Access Draft Management
1. Click **MANAGE PURCHASE ORDER** button in the filter bar
2. Or click the **CART** icon (if items are in draft - shows badge with count)
3. The Manage Purchase Order popup opens

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 219-222 - MANAGE PURCHASE ORDER button
- **Description**: "Manage Purchase Order button with pending badge"

##### Step 2: Review Draft Orders
1. The popup has three tabs: **DRAFT**, **FINALIZED**, **REJECTED**
2. In the **DRAFT** tab:
   - View all draft purchase orders grouped by supplier
   - See summary of total items and amounts
   - Edit quantities or remove items from drafts
   - Combine items from different suppliers into separate drafts
3. Review each draft:
   - Check supplier
   - Verify items and quantities
   - Review total amount

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 390-436 - Manage Purchase Order popup
- **Description**: "Purchase order management popup with DRAFT, FINALIZED, REJECTED tabs"

##### Step 3: Finalize Purchase Order
1. Review all draft items carefully
2. Click **SAVE CHANGES** to finalize the purchase order
3. The PO will be sent to the supplier with status "Pending"
4. Supplier will receive notification and can view the order in their portal

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 430-433 - Draft actions with SAVE CHANGES button
- **Description**: "Draft purchase order action buttons"

#### Viewing Purchase Orders

##### Purchase Order Table
The table displays all purchase orders with:
- **PO Number**: Unique purchase order identifier
- **Supplier**: Supplier company name
- **Date**: Order creation date
- **Total Amount**: Total order value
- **Status**: Current status (Draft, Pending, Payment Pending, Price Proposed, Processing, Partially Received, Arrived, Completed, Cancelled)
- **Expected Delivery**: Expected delivery date
- **PIC**: Person in Charge (staff who created the order)

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 234-288 - Purchase order table
- **Description**: "Purchase order table showing all order information columns"

##### Filtering Purchase Orders
1. **SEARCH**: Type PO number or supplier name
2. **SUPPLIER**: Filter by specific supplier
3. **STATUS**: Filter by order status (All Status, Draft, Pending, Payment Pending, etc.)
4. **DATE**: Filter by date range using calendar picker

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 115-232 - Filter bar
- **Description**: "Purchase order filter bar with all filter options"

##### Viewing Purchase Order Details
1. Click on a purchase order row in the table
2. Purchase Order Details popup opens showing:
   - Complete order information
   - List of items with quantities, unit prices, and totals
   - Status history and timeline
   - Available actions based on current status
   - Export PDF option

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 453-471 - Purchase Order Details popup
- **Description**: "Purchase order details view with complete order information"

---

### 6.1.4.3 Supplier Price Negotiation

#### How Price Negotiation Works
1. Manager creates a purchase order and sends it to supplier (status: "Pending")
2. Supplier logs into Supplier Portal and views the incoming order
3. Supplier can:
   - **Accept Price**: Accept the proposed price and proceed
   - **Reject Order**: Reject the entire order
   - **Propose New Price**: Suggest different prices for items
4. Manager reviews the proposal and can:
   - **Approve**: Accept supplier's proposed prices
   - **Reject**: Reject the proposal and cancel or renegotiate

**Note**: Detailed supplier price negotiation process is documented in Section 6.1.7 Supplier Portal Usage.

---

## 6.1.5 Module 3 – Inventory Management & Reporting

This module covers stock receiving, stock counting, low stock alerts, and report generation.

### 6.1.5.1 Stock Receiving

#### Process Overview
1. Manager marks purchase order as "Delivered" when goods arrive
2. Staff verifies received items against the purchase order
3. System records received quantity
4. Inventory is updated only after staff confirmation

#### Step 1: Mark Purchase Order as Delivered
1. Navigate to **INVENTORY PURCHASE**
2. Find the purchase order with status "Processing" or "Shipped"
3. Click on the purchase order to view details
4. Click **MARK AS DELIVERED** or similar action button
5. Purchase order status changes to "Arrived" or "Partially Received"

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 453-471 - Purchase Order Details popup
- **Description**: "Purchase order details showing delivery status"

#### Step 2: Verify Received Items
1. When PO status is "Arrived" or "Partially Received", click to view details
2. Click **VERIFY RECEIVED ITEMS** button
3. Item Verification popup opens showing:
   - List of all ordered items
   - Ordered quantity for each item
   - Checkboxes to mark items as received correctly
   - Input fields to enter received quantity for missing or incorrect items

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 473-496 - Item Verification popup
- **Description**: "Item verification dialog for received goods"

#### Step 3: Confirm Receipt
1. For items that arrived correctly:
   - Tick the checkbox next to the item
   - Received quantity will match ordered quantity automatically
2. For missing or incorrect items:
   - Enter the actual received quantity in the input field
   - System will flag any discrepancies
3. Click **SAVE VERIFICATION**
4. System updates:
   - Purchase order status
   - Inventory quantities for each item
   - Stock records

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Line 492 - SAVE VERIFICATION button
- **Description**: "Save Verification button in item verification dialog"

#### Handling Return Goods
If received quantity exceeds ordered amount:
1. Click **RETURN GOODS** button in PO details
2. Return Goods popup opens
3. Enter quantity to return for each item
4. Click **SAVE VERIFICATION**
5. System records the return and adjusts inventory

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 498-521 - Return Goods popup
- **Description**: "Return goods dialog for excess items"

---

### 6.1.5.2 Stock Count Process

#### Overview
Stock counting allows staff to verify physical inventory against system records. The process helps identify discrepancies and maintain accurate inventory levels.

#### Step 1: Manager Sends Stock Count Request
1. Manager logs into Manager Web Portal
2. Navigate to **GENERAL** > **GENERAL SETTINGS**
3. Scroll to **STAFF SETTINGS** card
4. Click **SEND REQUEST** button
5. Stock count request is sent to all staff members
6. Status will show "Stock count request sent"

**Screenshot Required**:
- **File**: `general-settings.html`
- **Section**: Lines 145-164 - Staff Settings card
- **Description**: "Staff Settings showing stock count request section"

#### Step 2: Staff Performs Stock Count
1. Staff receives notification about stock count request
2. Staff navigates to Stock Count section (in POS app or web portal)
3. For each product:
   - Scan barcode or search for product
   - Enter physical stock quantity counted
   - Submit count for that product
4. Continue until all products are counted

**Note**: Detailed stock count process in POS app is documented in the POS Application user manual.

#### Step 3: System Compares and Flags Variances
1. System automatically compares physical count with system quantity
2. If quantities match: No action needed
3. If quantities differ: Variance is flagged
4. Manager can view variance report

#### Step 4: View Stock Count History
1. Manager navigates to **GENERAL** > **GENERAL SETTINGS** > **STAFF SETTINGS**
2. Click **VIEW HISTORY** button
3. Stock Count History popup opens showing:
   - List of all stock count requests
   - Date and time of each request
   - Status of each count
   - Variance reports

**Screenshot Required**:
- **File**: `general-settings.html`
- **Section**: Lines 426-439 - Stock Count History popup
- **Description**: "Stock count history dialog"

---

### 6.1.5.3 Low Stock Alert

#### How Low Stock Detection Works
1. System automatically monitors inventory levels
2. When product quantity falls below a threshold, low stock alert is triggered
3. Alerts are displayed on the manager dashboard
4. Managers can initiate procurement directly from the alert

#### Viewing Low Stock Alerts
1. Navigate to **INVENTORY PURCHASE**
2. Click **LOW STOCK** filter button
3. Only products with low stock are displayed
4. Product cards show current stock quantity in red or highlighted

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 104-106 - LOW STOCK filter button
- **Description**: "Low Stock filter button"

#### Creating Purchase Order from Low Stock Alert
1. View low stock products
2. Click on a low stock product card
3. Add to Purchase Order popup opens automatically
4. Follow standard purchase order creation process
5. This helps quickly restock items that are running low

**Screenshot Required**:
- **File**: `new-po-page.html`
- **Section**: Lines 84-112 - Available products section with low stock items highlighted
- **Description**: "Low stock products displayed with alert indicators"

---

### 6.1.5.4 Reports

#### Accessing Reports
1. Navigate to **STATISTIC** in the navigation menu
2. Statistics page displays with KPI cards and sales graph

**Screenshot Required**:
- **File**: `statistic-page.html`
- **Section**: Lines 71-72 - Page title "STATISTIC"
- **Description**: "Statistics page header"

#### Viewing Key Performance Indicators (KPIs)
The KPI cards display real-time business metrics:
- **GROSS SALE**: Total sales amount
- **REFUNDS**: Total refunds amount
- **DISCOUNTS**: Total discounts given
- **NET SALES**: Gross sale minus refunds and discounts
- **COST**: Total cost of goods
- **GROSS PROFIT**: Net sales minus cost

**Screenshot Required**:
- **File**: `statistic-page.html`
- **Section**: Lines 74-128 - KPI cards grid
- **Description**: "KPI cards showing all business metrics"

#### Viewing Sales Graph
1. The sales graph displays sales trends over time
2. Use **Histogram** button to change chart type:
   - **Histogram**: Line chart showing trends
   - **Bar**: Bar chart for comparisons
   - **Pie Chart**: Pie chart for distribution
3. Graph shows comparison between current month and last month
4. Legend indicates different data series

**Screenshot Required**:
- **File**: `statistic-page.html`
- **Section**: Lines 130-151 - Sales graph section
- **Description**: "Sales graph with chart type selector and legend"

#### Generating Reports

##### Step 1: Select Date Range
1. Click the date range button (shows current selected range)
2. Date picker opens
3. Enter **Start Date** and **End Date** (DD/MM/YYYY format)
4. Or use calendar picker to select dates
5. Click **Apply**

**Screenshot Required**:
- **File**: `statistic-page.html`
- **Section**: Lines 154-208 - Date range picker
- **Description**: "Date range selector for report generation"

##### Step 2: Select Report Type
1. Choose report format:
   - **CSV**: Export as CSV file (for Excel analysis)
   - **PDF**: Export as PDF file (for printing/sharing)
2. Click the respective button
3. Report will be generated and downloaded automatically

**Screenshot Required**:
- **File**: `statistic-page.html`
- **Section**: Lines 209-214 - Report generation buttons
- **Description**: "CSV and PDF report generation buttons"

#### Report Types Available
- **Sales Report**: Daily/weekly/monthly sales breakdown
- **Inventory Report**: Current stock levels and movements
- **Stock Variance Report**: Differences between physical and system counts
- **Purchase Order Report**: PO history and status
- **Supplier Report**: Supplier performance and payment status

#### Viewing Sales Data Table
The sales table displays daily breakdown:
- **Date**: Transaction date
- **Gross Sale**: Total sales for the day
- **Refunds**: Total refunds for the day
- **Discounts**: Total discounts given
- **Net Sales**: Gross sale minus refunds and discounts
- **Cost**: Cost of goods sold

**Screenshot Required**:
- **File**: `statistic-page.html`
- **Section**: Lines 217-247 - Sales data table
- **Description**: "Sales data table with daily breakdown"

#### Viewing Sales Breakdown
1. Click on a date in the sales table
2. Sales Breakdown popup opens showing:
   - Detailed transaction information for that day
   - Product-wise sales breakdown
   - Payment method breakdown
   - Customer information (if applicable)
3. Click **EXPORT PDF** to generate detailed report

**Screenshot Required**:
- **File**: `statistic-page.html`
- **Section**: Lines 273-289 - Sales Breakdown popup
- **Description**: "Sales breakdown detail view with export option"

---

## 6.1.6 Module 4 – POS System, Returns & Counter Operations

**Note**: This module primarily covers the POS Application (Flutter App). Detailed screenshots and step-by-step instructions for the POS app should be documented separately. This section provides an overview and integration points with the web portal.

### 6.1.6.1 Processing a Sale

#### Overview
The POS application is used by cashiers to process sales transactions at the counter. The process involves scanning products, applying discounts, processing payments, and generating receipts.

#### Step-by-Step Process (POS App)
1. **Cashier Login**:
   - Cashier logs into POS application using staff ID/username and password
   - System grants access based on Cashier role

2. **Product Selection**:
   - Scan product barcode using barcode scanner
   - Or search for product manually by name/code
   - Product appears in cart

3. **Quantity Adjustment**:
   - Adjust quantity if needed (increase/decrease)
   - View subtotal for each item

4. **Apply Discounts** (if applicable):
   - Apply percentage discount
   - Apply fixed amount discount
   - Apply member points discount (if customer is member)

5. **Select Payment Method**:
   - Cash
   - Card (Credit/Debit)
   - Digital payment (if configured)

6. **Complete Transaction**:
   - Review total amount
   - Process payment
   - Receipt is generated automatically
   - Transaction is recorded in system

7. **Inventory Update**:
   - System automatically deducts sold quantities from inventory
   - Real-time inventory sync with web portal

8. **Points Award** (if member):
   - If customer is a member, points are automatically calculated and awarded
   - Points are stored as transaction records
   - Member can view points in their account

**Screenshot Required**: 
- **Note**: POS app screenshots should be taken from the Flutter application
- **Sections to capture**:
  - POS login screen
  - Product scanning/search interface
  - Cart with items
  - Payment method selection
  - Receipt generation
  - Transaction confirmation

---

### 6.1.6.2 Return and Refund

#### Overview
Returns and refunds are processed through the POS application. The system automatically restores inventory when items are returned.

#### Step-by-Step Process (POS App)
1. **Navigate to Return Goods**:
   - Cashier selects "Return" or "Refund" option in POS app
   - Return interface opens

2. **Select Original Transaction**:
   - Search for original transaction by:
     - Receipt number
     - Date and time
     - Customer information (if member)
   - Original transaction details display

3. **Select Items to Return**:
   - View list of items from original transaction
   - Select items to return
   - Enter return quantity for each item
   - System validates return quantity (cannot exceed original quantity)

4. **Confirm Refund**:
   - Review return summary
   - Select refund method (same as original payment or cash)
   - Confirm refund
   - System processes refund

5. **Inventory Restoration**:
   - System automatically restores returned quantities to inventory
   - Inventory updates in real-time across all interfaces
   - Return transaction is logged

6. **Receipt Generation**:
   - Return receipt is generated
   - Receipt shows returned items and refund amount

**Screenshot Required**:
- **Note**: POS app screenshots should be taken from the Flutter application
- **Sections to capture**:
  - Return/Refund interface
  - Transaction search
  - Item selection for return
  - Refund confirmation
  - Return receipt

---

### 6.1.6.3 Counter Closing

#### Overview
Counter closing is performed at the end of each business day. The process ensures all transactions are properly recorded and cash is reconciled.

#### Step-by-Step Process (POS App)

##### Normal Closing (Within Closing Time)
1. **Cashier Initiates Closing**:
   - Cashier selects "Close Counter" option in POS app
   - System checks if current time is within allowed closing time window

2. **If Within Closing Time**:
   - Counter closes immediately
   - Closing record is created
   - Summary report is generated showing:
     - Total sales
     - Total refunds
     - Cash in drawer
     - Card payments
     - Transaction count

3. **Closing Confirmation**:
   - Cashier reviews closing summary
   - Confirms closing
   - System logs closing record

##### Early Closing (Outside Closing Time)
1. **Cashier Requests Early Closing**:
   - Cashier selects "Close Counter"
   - System detects time is outside normal closing window
   - Approval request is sent to manager

2. **Manager Receives Request**:
   - Manager receives notification in web portal
   - Manager can view:
     - Requesting cashier
     - Request time
     - Reason for early closing (if provided)

3. **Manager Approval/Rejection**:
   - Manager can **Approve** early closing request
     - Counter closes immediately
     - Closing record is logged with "Early Closing" flag
   - Manager can **Reject** early closing request
     - Cashier receives rejection notification
     - Counter remains open
     - Cashier must wait for normal closing time or provide valid reason

4. **Closing Record**:
   - All closing records are logged in the system
   - Records include:
     - Date and time
     - Cashier information
     - Closing type (Normal/Early)
     - Approval information (if early closing)
     - Summary totals

**Screenshot Required**:
- **Note**: POS app screenshots should be taken from the Flutter application
- **Sections to capture**:
  - Close Counter option
  - Closing summary screen
  - Early closing request dialog
  - Manager approval interface (web portal)
  - Closing confirmation

**Web Portal Integration**:
- Managers can view closing history in the web portal
- Closing records are accessible in reports section
- Early closing requests appear in manager notifications

---

## 6.1.7 Supplier Portal Usage

This section covers all supplier-related operations in the Supplier Web Portal.

### 6.1.7.1 Supplier Login

#### Accessing Supplier Portal
1. Open web browser
2. Navigate to Sport Nexus application URL
3. Login page displays

#### Step 1: Select Supplier Role
1. On login page, click **SUPPLIER** role button
2. Supplier role is selected (button highlighted)

**Screenshot Required**:
- **File**: `index.html`
- **Section**: Lines 67-73 - Role selection buttons
- **Description**: "Role selection with SUPPLIER selected"

#### Step 2: Enter Credentials
1. Enter supplier email address
2. Enter password
3. Click **LOGIN**

**Screenshot Required**:
- **File**: `index.html`
- **Section**: Lines 25-65 - Login form
- **Description**: "Supplier login form"

#### Step 3: Access Supplier Portal
1. After successful login, supplier is redirected to Supplier Portal
2. Navigation menu shows: **INCOMING ORDER**, **HISTORY**, **PAYMENT HISTORY**, **RETURN GOODS**

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 12-52 - Supplier portal navigation
- **Description**: "Supplier portal navigation bar"

---

### 6.1.7.2 View Incoming Orders

#### Accessing Incoming Orders
1. Click **INCOMING ORDER** in navigation (default view)
2. Incoming Orders table displays

#### Order Information Displayed
The table shows:
- **DATE**: Order creation date
- **PO NUMBER**: Purchase order number
- **ITEMS**: Number of different items in order
- **TOTAL QTY**: Total quantity of all items
- **AMOUNT**: Total order value
- **STATUS**: Current order status
- **EXPECTED DELIVERY**: Expected delivery date

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 154-173 - Incoming orders table
- **Description**: "Incoming orders table with all columns"

#### Filtering Orders
1. **SEARCH**: Type PO number to search
2. **STATUS**: Filter by status (All Status, Pending, Payment Pending, Price Proposed, Processing, Shipped, Completed)
3. **DATE**: Filter by date range

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 60-143 - Filter bar
- **Description**: "Incoming orders filter options"

#### Viewing Order Details
1. Click on an order row in the table
2. Purchase Order Details popup opens showing:
   - Complete order information
   - List of items with quantities
   - Unit prices (if proposed)
   - Total amounts
   - Available actions based on status

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 392-406 - Supplier PO Details popup
- **Description**: "Purchase order details view for supplier"

---

### 6.1.7.3 Supplier Price Negotiation

#### Process Overview
When a purchase order is received with status "Pending", supplier can:
1. **Accept Price**: Accept manager's proposed prices
2. **Reject Order**: Reject the entire order
3. **Propose New Price**: Suggest different prices for items

#### Step 1: View Pending Order
1. Navigate to **INCOMING ORDER**
2. Find order with status "Pending"
3. Click to view order details

#### Step 2: Propose Prices
1. Click **PROPOSE PRICES** button in order details
2. Propose Prices popup opens showing:
   - List of all items in the order
   - Current proposed unit cost (from manager)
   - Input field for new unit cost
   - Notes field for each item (optional)

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 443-456 - Propose Prices popup
- **Description**: "Propose Prices dialog with price input fields"

#### Step 3: Enter Proposed Prices
1. For each item, enter **Unit Cost (RM)** in the input field
2. Add optional notes explaining price change (if needed)
3. Review all prices
4. Click **SUBMIT PRICES** or **SAVE PRICES**

#### Step 4: Manager Reviews Proposal
1. Manager receives notification of price proposal
2. Manager reviews proposed prices in web portal
3. Manager can:
   - **Approve**: Accept supplier's prices → Order status changes to "Price Proposed" → "Processing"
   - **Reject**: Reject proposal → Order status remains "Pending" → Supplier can propose again

#### Editing Individual Prices
1. In order details, click **EDIT PRICE** for a specific item
2. Edit Price popup opens showing:
   - Product Name
   - Variant information
   - SKU
   - Current Unit Cost
   - Input field for new Unit Cost
   - Notes field
3. Enter new price and click **SAVE PRICE**

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 408-441 - Edit Price popup
- **Description**: "Edit individual price dialog"

---

### 6.1.7.4 Upload Delivery Order (DO)

#### Process Overview
After shipping goods, supplier uploads Delivery Order document. The system links DO to purchase order, and manager can view DO from web portal.

#### Step 1: Access Delivery Order Generation
1. For orders with status "Processing", click to view details
2. Click **GENERATE DELIVERY ORDER** button
3. Generate DO popup opens

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 458-531 - Generate Delivery Order popup
- **Description**: "Generate Delivery Order dialog"

#### Step 2: Enter Delivery Information
1. **PO Number**: Displayed (read-only)
2. **Tracking Number**: Enter shipping tracking number (optional)
3. **Carrier/Shipping Company**: Enter carrier name (optional, e.g., "DHL", "FedEx")
4. **Delivery Notes**: Add any delivery notes (optional)
5. Click **GENERATE DELIVERY ORDER**

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 469-486 - Delivery order form
- **Description**: "Delivery order generation form with tracking and carrier fields"

#### Step 3: View Generated DO
1. After generation, DO document is displayed
2. DO shows:
   - Delivery Order number
   - PO reference
   - Items being delivered
   - Quantities
   - Delivery address
   - Tracking information
3. Click **DOWNLOAD DELIVERY ORDER** to save PDF

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 488-496 - Generated DO view
- **Description**: "Generated Delivery Order document view"

#### Step 4: Update Delivery Status
1. After generating DO, update delivery status:
   - **Days in Transit**: Enter number of days (if still shipping)
   - **Out for Delivery**: Select when items are shipped
   - **Cancel**: Cancel delivery (requires reason)
2. If delivery exceeds expected date:
   - System prompts for delay remarks
   - Enter reason for delay (required)
3. Click **UPDATE STATUS**

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 498-527 - Delivery status update section
- **Description**: "Delivery status update form with delay remarks"

#### Manager View of DO
1. Manager can view DO in web portal
2. Navigate to Purchase Order details
3. DO document is linked and accessible
4. Manager can download DO PDF

---

### 6.1.7.5 Payment Tracking

#### Viewing Payment Status
1. Click **PAYMENT HISTORY** in navigation
2. Payment History table displays:
   - **DATE**: Payment date
   - **PO NUMBER**: Purchase order number
   - **AMOUNT (RM)**: Payment amount
   - **PAYMENT METHOD**: How payment was made
   - **PAYMENT STATUS**: Paid, Pending, Failed
   - **PAYMENT DATE**: Actual payment date

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 175-271 - Payment History view
- **Description**: "Payment History table"

#### Filtering Payment History
1. **SEARCH**: Search by PO number
2. **DATE**: Filter by date range

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 179-242 - Payment History filter bar
- **Description**: "Payment History filter options"

#### Viewing Payment Invoice
1. Click on a payment record
2. Payment Invoice popup opens showing:
   - Complete invoice details
   - Payment information
   - Order reference
   - Payment method details

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 533-546 - Payment Invoice popup
- **Description**: "Payment invoice detail view"

#### Payment Status Indicators
- **Unpaid Orders**: Highlighted in red or with warning icon
- **Payment Pending**: Shows pending status
- **Paid**: Shows payment date and method
- **Automatic Cancellation**: Orders are automatically cancelled if payment deadline (30 days) expires

---

### 6.1.7.6 Viewing Purchase Order History

#### Accessing History
1. Click **HISTORY** in navigation
2. Purchase Order History table displays:
   - **DATE**: Order date
   - **NAME**: Customer/Company name
   - **ORDER ITEM**: Number of items
   - **AMOUNT**: Order total
   - **PO ID**: Purchase order identifier
   - **PURCHASE ORDER STATUS**: Final status

**Screenshot Required**:
- **File**: `supplier-po-management.html`
- **Section**: Lines 273-369 - Purchase Order History view
- **Description**: "Purchase Order History table"

#### Filtering History
1. **SEARCH**: Search by PO number or customer name
2. **DATE**: Filter by date range

---

### 6.1.7.7 Managing Return Goods

#### Accessing Return Goods
1. Click **RETURN GOODS** in navigation
2. Return Goods page displays cards for each return request

**Screenshot Required**:
- **File**: `supplier-return-goods.html`
- **Section**: Lines 56-137 - Return Goods page
- **Description**: "Return Goods page with return request cards"

#### Viewing Return Goods Details
1. Click on a return goods card
2. Return Goods Details popup opens showing:
   - Return request information
   - Original PO reference
   - Items to be returned
   - Quantities and reasons
   - Export PDF option

**Screenshot Required**:
- **File**: `supplier-return-goods.html`
- **Section**: Lines 158-174 - Return Goods Details popup
- **Description**: "Return Goods details view"

#### Processing Return Goods
1. Review return request details
2. Confirm items and quantities
3. System records return acceptance
4. Return goods process is completed

---

## 11. Troubleshooting

### 11.1 Common Issues

#### Login Issues
- **Problem**: Cannot login with correct credentials
- **Solution**: 
  1. Verify you selected the correct role (STAFF or SUPPLIER)
  2. Check if email and password are correct
  3. Try "Forgot Password" to reset password
  4. Clear browser cache and cookies
  5. Contact system administrator if issue persists

#### Product Not Appearing
- **Problem**: Added product not showing in list
- **Solution**:
  1. Check if product status is set to "Active"
  2. Verify category filter is not hiding the product
  3. Clear all filters and search again
  4. Refresh the page
  5. Check if product was saved successfully

#### Purchase Order Not Updating
- **Problem**: PO status not updating after action
- **Solution**:
  1. Refresh the page
  2. Check if you have proper permissions
  3. Verify all required fields are filled
  4. Check browser console for error messages
  5. Ensure internet connection is stable

#### Payment Processing Issues
- **Problem**: Payment not processing
- **Solution**:
  1. Check internet connection
  2. Verify payment gateway is accessible
  3. Try different payment method
  4. Check if payment deadline has expired
  5. Contact support if payment fails

#### Inventory Sync Issues
- **Problem**: Inventory not syncing between POS and web portal
- **Solution**:
  1. Check database connection
  2. Refresh both POS app and web portal
  3. Verify real-time sync is enabled
  4. Check for pending transactions
  5. Contact technical support

### 11.2 Browser Compatibility
- **Recommended browsers**: Chrome (latest), Firefox (latest), Safari (latest), Edge (latest)
- **Clear browser cache** if experiencing display issues
- **Enable JavaScript** in browser settings
- **Disable browser extensions** that might interfere
- **Use incognito/private mode** to test if issues persist

### 11.3 Getting Help
- **Contact system administrator** for account issues
- **Check log book** in General Settings for action history
- **Review error messages** displayed in the system
- **Contact technical support** for system errors
- **Refer to POS Application manual** for POS-specific issues

### 11.4 System Requirements
- **Web Browser**: Modern browser with JavaScript enabled
- **Internet Connection**: Stable connection required
- **Screen Resolution**: Minimum 1280x720 recommended
- **POS App**: Flutter app on mobile/tablet device
- **Database**: Supabase PostgreSQL (managed by system)

---

## Document Information

- **Version**: 2.0
- **Last Updated**: [Current Date]
- **Prepared For**: Sport Nexus System
- **Section**: 6.1 User Manual
- **Modules**: 4 (User & Membership, Product & Procurement, Inventory & Reporting, POS & Counter Operations)

---

**End of User Manual**
