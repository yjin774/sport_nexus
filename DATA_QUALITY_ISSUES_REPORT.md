# Data Quality Issues Report

Based on analysis of `products_rows (6).csv` and `product_variants_rows (7).csv`, here are the identified bugs and problems:

## 🔴 CRITICAL ISSUES

### 1. **Negative Stock Levels** ⚠️
**Location:** `product_variants` table
- **Row 63:** `current_stock = -1` (SKU: `SHOE1E0F002-BLK-M`)
- **Row 91:** `current_stock = -4` (SKU: `BALLS3F50002-apo-std`)

**Problem:** Negative stock is physically impossible and indicates:
- Data entry errors
- Missing validation in the application
- Potential inventory tracking issues

**Impact:** 
- Can cause incorrect inventory reports
- May allow sales when stock is negative
- Breaks business logic assumptions

**Recommendation:** 
- Add validation: `current_stock >= 0`
- Fix existing negative values to 0
- Investigate how these became negative

---

### 2. **Pricing Logic Error** ⚠️
**Location:** `product_variants` table, Row 123
- **SKU:** `RACKETS2279003-ORG-s`
- **Cost Price:** `250.39`
- **Selling Price:** `109.00`

**Problem:** Selling price is LESS than cost price (selling at a loss)

**Impact:**
- Business is losing money on this item
- May indicate data entry error
- Breaks expected business logic (selling_price should be >= cost_price)

**Recommendation:**
- Add validation: `selling_price >= cost_price`
- Review and correct this specific variant
- Consider adding `min_selling_price` validation

---

### 3. **Product Code vs Image URL Mismatch** ⚠️
**Location:** `products` table

**Issue 1 - Row 5:**
- **Product Code:** `WATER9D3D003`
- **Image URL:** Contains `WINTERB2FB002` in filename
- **Product Name:** "Adidas Thermal Pro Winter Gear"
- **Category:** Winter category (b2fb6fc4...)

**Issue 2 - Row 19:**
- **Product Code:** `OUTDOOR0D0B004`
- **Image URL:** Contains `ACCESSORIESACCB001` in filename

**Problem:** Image filenames don't match product codes, suggesting:
- Wrong images uploaded
- Images copied from other products
- Data migration issues

**Impact:**
- Users see wrong product images
- Confusion in product identification
- Poor user experience

**Recommendation:**
- Verify image URLs match product codes
- Re-upload correct images
- Add validation to ensure image filename contains product_code

---

### 4. **Product Code vs Category Mismatch** ⚠️
**Location:** `products` table, Row 5
- **Product Code:** `WATER9D3D003` (suggests "WATER" category)
- **Product Name:** "Adidas Thermal Pro Winter Gear"
- **Category ID:** `b2fb6fc4-d3fb-43e6-9aba-db93b13f97fd` (Winter category)
- **Tags:** `["water_sports","puma","training"]` (water_sports tag)

**Problem:** Product code prefix doesn't match actual category

**Impact:**
- Confusing product organization
- Difficult to identify products by code
- Inconsistent data structure

**Recommendation:**
- Update product code to match category (e.g., `WINTERB2FB003`)
- Or update category to match code
- Ensure product code generation uses correct category prefix

---

## 🟡 MODERATE ISSUES

### 5. **Brand Mismatch** 
**Location:** `products` table, Row 14
- **Product Name:** "Puma Moisture-Wicking Shirt"
- **Brand:** "Wilson"
- **Tags:** `["fitness_equipment","wilson","competition"]`

**Problem:** Product name says "Puma" but brand is "Wilson"

**Impact:**
- Confusion for users
- Incorrect product identification
- Search/filter issues

**Recommendation:**
- Correct brand to "Puma" OR
- Correct product name to "Wilson Moisture-Wicking Shirt"

---

### 6. **Missing Category Assignment**
**Location:** `products` table, Row 13
- **Product:** "Yonex Premium PU Super Grip"
- **Category ID:** Empty (null)

**Problem:** Product has no category assigned

**Impact:**
- Cannot filter by category
- Product may not appear in category views
- Organization issues

**Recommendation:**
- Assign appropriate category
- Add validation: `category_id` should not be null (or make it optional with clear business rules)

---

### 7. **Inconsistent Data Formatting**
**Location:** `product_variants` table

**Case Inconsistencies:**
- Row 14: `size = "small"` (lowercase) vs others use "Small" (capitalized)
- Row 25: `sku = "RACKETS2279005-ylw-Om"` (mixed case) vs others use uppercase
- Row 25: `variant_name = "yellow medium"` (lowercase) vs others use "Yellow Medium"
- Row 97: `color = "green"` (lowercase) vs others use "Green"
- Row 122: `variant_name = "White small"` (inconsistent capitalization)
- Row 123: `variant_name = "Orange small"` (inconsistent capitalization)

**Size Format Inconsistencies:**
- Row 21: `size = "10"` (numeric) vs others use text like "Medium", "Large"
- Row 30: `size = "8"` (numeric)
- Row 72: `size = "8"` (numeric)

**Problem:** Inconsistent data formatting makes:
- Searching/filtering difficult
- Display inconsistent
- Data analysis harder

**Impact:**
- Poor user experience
- Search functionality may not work correctly
- Reports may be inaccurate

**Recommendation:**
- Standardize all text fields to proper case (Title Case)
- Decide on size format: use text ("Small", "Medium") OR numeric ("8", "10")
- Add data normalization on save
- Create data cleanup script

---

### 8. **Default Variants Not Edited**
**Location:** `product_variants` table

**Row 114:**
- **SKU:** `PRD887732-DEFAULT-1766256414231-GGFFHY`
- **Variant Name:** `N/A`
- **Size:** `N/A`
- **Color:** `N/A`
- **Cost Price:** `10.00`
- **Selling Price:** `90.51`

**Row 127:**
- **SKU:** `PRD199699-DEFAULT-1766256371911-6RCNFD`
- **Variant Name:** `N/A`
- **Size:** `N/A`
- **Color:** `N/A`
- **Cost Price:** `0.00`
- **Selling Price:** `0.00`

**Problem:** Default variants created but never properly configured

**Impact:**
- Products may not be sellable (zero prices)
- Confusing for users
- Incomplete product data

**Recommendation:**
- Require variant editing before product can be marked as "active"
- Add validation: if variant has "N/A" values, product status should be "inactive"
- Create workflow to ensure variants are properly configured

---

### 9. **Missing QR Codes**
**Location:** `product_variants` table

**Rows with empty qr_code:**
- Row 95: `aa54bf7d-6fad-46f5-a333-cc20901bc966`
- Row 114: `c3978886-b14a-45cc-a38f-d35b1d431387`
- Row 127: `e6dea7a7-2003-457f-b8c9-31caeb8eb924`

**Problem:** QR codes should be generated from variant ID (remove hyphens)

**Impact:**
- QR code scanning won't work for these variants
- Incomplete data

**Recommendation:**
- Generate QR codes for all variants (format: variant ID without hyphens)
- Add trigger or default value in database
- Update existing records

---

### 10. **SKU vs Product Code Mismatch**
**Location:** `product_variants` table, Row 5
- **SKU:** `SHOE1E0F005-WHT-OS`
- **Product ID:** `34ba3d01-83d7-4b6d-b698-6a50b2c9b8df`
- **Product Code (from products table):** `WATER9D3D003`

**Problem:** SKU prefix `SHOE1E0F005` doesn't match product code `WATER9D3D003`

**Impact:**
- Confusing SKU structure
- Difficult to trace variants to products
- Inconsistent naming

**Recommendation:**
- SKU should start with product code: `WATER9D3D003-WHT-OS`
- Update SKU generation logic
- Fix existing mismatched SKUs

---

## 🟢 MINOR ISSUES

### 11. **Empty Description**
**Location:** `products` table, Row 18
- **Product:** "Everlast Nevatear Heavy Bag"
- **Description:** Empty

**Problem:** Product has no description

**Impact:**
- Poor product information
- May affect SEO/search

**Recommendation:**
- Add descriptions for all products
- Make description required OR clearly optional

---

### 12. **Zero Prices on Default Variants**
**Location:** `product_variants` table, Row 127
- **Cost Price:** `0.00`
- **Selling Price:** `0.00`

**Problem:** Product cannot be sold with zero prices

**Impact:**
- Product not sellable
- May cause errors in sales system

**Recommendation:**
- Require prices before product can be active
- Add validation: if selling_price = 0, product status should be "inactive"

---

### 13. **Inconsistent Tag Usage**
**Location:** `products` table

**Examples:**
- Row 2: Tags include "adidas" but brand is "Head"
- Row 5: Tags include "water_sports" but product is winter gear
- Row 13: Tags include "puma" but brand is "Yonex"

**Problem:** Tags don't match product attributes

**Impact:**
- Incorrect filtering
- Confusing search results

**Recommendation:**
- Review and correct tags
- Consider auto-generating tags from brand/category
- Add validation for tag consistency

---

## 📊 SUMMARY STATISTICS

### Products Table (22 products):
- ✅ 20 products have categories assigned
- ⚠️ 2 products missing categories (9%)
- ⚠️ 2 products have image URL mismatches (9%)
- ⚠️ 1 product has brand mismatch (5%)
- ⚠️ 1 product has category/code mismatch (5%)

### Product Variants Table (139 variants):
- ✅ 136 variants have valid stock (>= 0)
- 🔴 2 variants have negative stock (1.4%)
- ⚠️ 1 variant has selling_price < cost_price (0.7%)
- ⚠️ 2 variants are unedited defaults (1.4%)
- ⚠️ 3 variants missing QR codes (2.2%)
- ⚠️ Multiple variants have inconsistent formatting (case, size format)

---

## 🔧 RECOMMENDED FIXES

### Immediate Actions (Critical):
1. **Fix negative stock values:**
   ```sql
   UPDATE product_variants 
   SET current_stock = 0 
   WHERE current_stock < 0;
   ```

2. **Fix pricing error:**
   ```sql
   UPDATE product_variants 
   SET selling_price = cost_price * 1.5  -- or appropriate markup
   WHERE selling_price < cost_price AND selling_price > 0;
   ```

3. **Fix image URL mismatches:**
   - Re-upload correct images for products with mismatched URLs
   - Verify image filenames contain product codes

### Short-term Actions:
4. **Add database constraints:**
   ```sql
   ALTER TABLE product_variants 
   ADD CONSTRAINT check_stock_non_negative 
   CHECK (current_stock >= 0);
   
   ALTER TABLE product_variants 
   ADD CONSTRAINT check_selling_price_valid 
   CHECK (selling_price >= cost_price OR cost_price = 0);
   ```

5. **Standardize data formatting:**
   - Create script to normalize case (Title Case for variant names, colors, sizes)
   - Standardize size format (decide: text vs numeric)

6. **Fix SKU generation:**
   - Ensure SKUs start with product code
   - Update existing mismatched SKUs

### Long-term Actions:
7. **Add application-level validations:**
   - Stock cannot be negative
   - Selling price must be >= cost price
   - Image filename must contain product code
   - Variant names must be properly formatted
   - QR codes must be generated

8. **Data quality monitoring:**
   - Regular data quality checks
   - Automated validation reports
   - Data cleanup procedures

---

## 📝 NOTES

- Most data appears to be correctly structured
- Issues are primarily data quality rather than schema problems
- Some issues may be intentional (e.g., zero prices for inactive products)
- Consider business rules before applying all fixes
- Test fixes in development environment first

