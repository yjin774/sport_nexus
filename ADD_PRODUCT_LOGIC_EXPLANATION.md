# Add Product Logic Explanation

This document explains how the "Add Product" functionality works in the Sport Nexus application, based on the code in `dashboard.js` and the database structure shown in your CSV files.

## Overview

When a user adds a new product, the system creates:
1. **One record** in the `products` table
2. **One default variant** in the `product_variants` table (automatically created)

## Step-by-Step Process

### Step 1: User Opens Add Product Popup
- Function: `showAddProductPopup()` (line 6441)
- Resets the form and displays the add product dialog
- User fills in product details

### Step 2: Generate Product Code
- Function: `generateProductCode()` (line 6545)
- **How it works:**
  - Gets the selected category from the dropdown
  - Extracts the category code (first 4 characters of category ID or category code)
  - Generates a random 6-character alphanumeric suffix
  - Formats: `{CATEGORY_CODE}{RANDOM_6_CHARS}`
  - Example: `OUTDOOR0D0B002`, `WINTERB2FB003`, `FITNESS7D8F001`
- **Important:** Product code must be generated before saving (validated in save function)

### Step 3: User Clicks "Save" Button
- Function: `saveNewProduct()` (line 6683)
- **Requires staff authentication** before proceeding
- Calls `saveNewProductInternal()` after authentication

### Step 4: Validation (saveNewProductInternal)
- Function: `saveNewProductInternal()` (line 6702)
- **Validates:**
  1. Product code exists and is not "-"
  2. Product name is provided
  3. Quantity is valid (must be at least 1)
- If validation fails, shows alert and stops

### Step 5: Image Upload (Optional)
- Function: `uploadProductImageToSupabase()` (line 6916)
- **Process:**
  1. Creates unique filename: `{PRODUCT_CODE}_{TIMESTAMP}.{EXTENSION}`
  2. Example: `OUTDOOR0D0B002_1766240026801.webp`
  3. Uploads to Supabase Storage bucket: `product-images`
  4. Returns public URL
- **Note:** If image upload fails, user can choose to continue without image

### Step 6: Insert Product into Database
- **Table:** `products`
- **Data inserted:**
  ```javascript
  {
    product_code: "OUTDOOR0D0B002",        // Generated code
    product_name: "Head Radical 160",     // User input
    brand: "Head",                        // User input (optional)
    category_id: "227940a6-...",          // Selected category UUID
    description: "A classic...",          // User input (optional)
    image_url: "https://...",             // Uploaded image URL (optional)
    status: "active"                      // Default: "active"
  }
  ```
- **Database operation:** `INSERT INTO products (...) VALUES (...)`
- Returns the newly created product with its `id` (UUID)

### Step 7: Create Default Product Variant
- **Table:** `product_variants`
- **Why:** Every product MUST have at least one variant (for inventory management)
- **Default variant created automatically:**
  ```javascript
  {
    product_id: "18d32117-...",           // UUID from Step 6
    sku: "OUTDOOR0D0B002-DEFAULT-1766240026801-GGFFHY",  // Auto-generated
    barcode: null,                         // NULL (to avoid unique constraint)
    variant_name: "N/A",
    size: "N/A",
    color: "N/A",
    weight: "N/A",
    grip: "N/A",
    material: "N/A",
    cost_price: 0.00,                     // Default: 0
    selling_price: 0.00,                   // Default: 0
    discount_price: null,
    min_selling_price: null,
    current_stock: 1,                     // From quantity input (default: 0)
    reorder_level: 0,
    reorder_quantity: 0,
    max_stock: null,
    unit_of_measure: "pcs",                // Default: "pcs"
    location: "N/A",
    status: "active",
    last_sold_date: null,
    total_sold: 0
  }
  ```

### Step 8: SKU Generation for Default Variant
- **Format:** `{PRODUCT_CODE}-DEFAULT-{TIMESTAMP}-{RANDOM_6_CHARS}`
- **Example:** `OUTDOOR0D0B002-DEFAULT-1766240026801-GGFFHY`
- **Purpose:** Ensures uniqueness (timestamp + random suffix)

### Step 9: Success Handling
- Button changes to "SAVED!" (green)
- Reloads product list from database
- Closes the popup
- Resets the form

## Database Structure (Based on Your CSV Files)

### `products` Table Fields:
- `id` - UUID (auto-generated)
- `product_code` - Unique code (e.g., "OUTDOOR0D0B002")
- `product_name` - Product name (e.g., "Head Radical 160")
- `brand` - Brand name (e.g., "Head", "Nike")
- `category_id` - Foreign key to categories table
- `description` - Product description
- `image_url` - URL to product image
- `image_urls` - Array of image URLs (currently empty in your data)
- `status` - "active" or "inactive"
- `is_taxable` - Boolean (default: true)
- `tax_rate` - Decimal (e.g., 6.00)
- `tags` - JSON array (e.g., ["outdoor_sports", "adidas", "premium"])
- `created_at` - Timestamp
- `updated_at` - Timestamp
- `created_by` - User ID (currently null in your data)

### `product_variants` Table Fields:
- `id` - UUID (auto-generated)
- `product_id` - Foreign key to products table
- `sku` - Stock Keeping Unit (unique identifier)
- `barcode` - Barcode (optional, can be null)
- `variant_name` - Variant name (e.g., "Black Medium")
- `size` - Size (e.g., "Medium", "Large")
- `color` - Color (e.g., "Black", "White")
- `weight` - Weight (e.g., "230g")
- `grip` - Grip size (e.g., "4 1/8")
- `material` - Material type
- `custom_attributes` - JSON object
- `cost_price` - Cost price per unit (RM)
- `selling_price` - Selling price per unit (RM)
- `discount_price` - Discount price (optional)
- `min_selling_price` - Minimum selling price (optional)
- `current_stock` - Current inventory quantity
- `reorder_level` - Stock level to trigger reorder
- `reorder_quantity` - Quantity to order when reordering
- `max_stock` - Maximum stock level (optional)
- `unit_of_measure` - Unit (e.g., "pcs", "kg", "m")
- `location` - Storage location
- `status` - "active", "inactive", "out_of_stock", "discontinued"
- `last_sold_date` - Date of last sale
- `total_sold` - Total quantity sold
- `created_at` - Timestamp
- `updated_at` - Timestamp
- `qr_code` - QR code string (auto-generated from variant ID)
- `image_url` - Variant-specific image (optional)
- `variant_image` - Additional variant image (optional)

## Key Points

### 1. Product Code Generation
- **Format:** `{CATEGORY_PREFIX}{6_RANDOM_CHARS}`
- **Example:** Category "OUTDOOR" → Code "OUTDOOR0D0B002"
- Must be generated before saving
- Used in image filename and default SKU

### 2. Default Variant Creation
- **Automatic:** Every new product gets a default variant
- **Purpose:** Ensures product can be tracked in inventory immediately
- **Stock:** Uses the quantity entered in the form (default: 0)
- **SKU:** Auto-generated with timestamp and random suffix for uniqueness

### 3. Image Handling
- **Optional:** Product can be saved without image
- **Storage:** Supabase Storage bucket `product-images`
- **Filename:** `{PRODUCT_CODE}_{TIMESTAMP}.{EXT}`
- **URL Format:** `https://giksmtowehwmgqyymevp.supabase.co/storage/v1/object/public/product-images/{FILENAME}`

### 4. Error Handling
- **Image upload failure:** User can choose to continue without image
- **Variant creation failure:** Product is saved, but user is notified to add variant manually
- **Database errors:** Specific error messages shown to user

### 5. Authentication
- **Required:** Staff authentication before saving
- **Purpose:** Audit trail and security
- **Function:** `requireStaffAuthentication()`

## Flow Diagram

```
User clicks "Add Product"
    ↓
Form opens (showAddProductPopup)
    ↓
User fills form:
  - Selects category
  - Generates product code
  - Enters product name
  - Enters brand (optional)
  - Enters description (optional)
  - Enters quantity
  - Uploads image (optional)
    ↓
User clicks "Save"
    ↓
Staff authentication required
    ↓
Validation:
  - Product code exists?
  - Product name provided?
  - Quantity valid?
    ↓
Upload image (if provided)
    ↓
Insert into products table
    ↓
Get new product ID
    ↓
Generate default SKU
    ↓
Insert default variant into product_variants table
    ↓
Success:
  - Show "SAVED!" message
  - Reload product list
  - Close popup
```

## Example from Your Data

Looking at your CSV files:

**Product:**
- `id`: `18d32117-4507-4a82-80d1-cdab3eb60a5d`
- `product_code`: `OUTDOOR0D0B002`
- `product_name`: `Head Radical 160`
- `brand`: `Head`
- `category_id`: `227940a6-7442-470f-bc1e-d2263b32fb24`
- `image_url`: `https://giksmtowehwmgqyymevp.supabase.co/storage/v1/object/public/product-images/OUTDOOR0D0B002_1766240026801.webp`

**Default Variant:**
- `id`: `02acc23b-466b-4c12-8398-59dde9db6180`
- `product_id`: `18d32117-4507-4a82-80d1-cdab3eb60a5d` (links to product above)
- `sku`: `OUTDOOR0D0B002-BLK-M` (user later edited this)
- `variant_name`: `Black Medium`
- `size`: `Medium`
- `color`: `Black`
- `current_stock`: `1`
- `cost_price`: `200.00`
- `selling_price`: `560.00`

## Important Notes

1. **One Product = Multiple Variants:** A product can have many variants (different sizes, colors, etc.)
2. **Default Variant:** Always created automatically with "N/A" values
3. **Product Code:** Must be unique, generated from category
4. **SKU:** Unique per variant, can be edited later
5. **Barcode:** Optional, set to NULL for default variant (to avoid unique constraint)
6. **Stock Management:** Uses `current_stock` in variants table, not products table
7. **Image:** Stored in Supabase Storage, URL saved in `image_url` field

## Code Locations

- **Main function:** `saveNewProductInternal()` - Line 6702 in `dashboard.js`
- **Product code generation:** `generateProductCode()` - Line 6545
- **Image upload:** `uploadProductImageToSupabase()` - Line 6916
- **Popup management:** `showAddProductPopup()` - Line 6441
- **Form reset:** `resetAddProductForm()` - Line 6474

