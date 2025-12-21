# Variant Field Validation Guide

## Overview

This document explains which variant input fields can have duplicate values and which fields must be unique, along with the validation rules applied.

---

## Fields That MUST Be Unique

### 1. **SKU (Stock Keeping Unit)**
- **Uniqueness Scope:** Globally unique across ALL products and variants
- **Required:** Yes (cannot be empty)
- **Validation:**
  - Must be unique across the entire `product_variants` table
  - Case-insensitive comparison (e.g., "ABC123" and "abc123" are considered duplicates)
  - Auto-generated if not provided for new variants
  - Error message: "This SKU already exists. SKU must be unique across all products."

### 2. **Barcode**
- **Uniqueness Scope:** Globally unique across ALL products and variants
- **Required:** No (optional field, can be empty/null)
- **Validation:**
  - Must be unique across the entire `product_variants` table (only if provided)
  - Exact match comparison (case-sensitive)
  - Validation only runs if barcode is not empty
  - Error message: "This barcode already exists. Barcode must be unique across all products."

### 3. **Variant Name**
- **Uniqueness Scope:** Unique per product (same variant name can exist for different products)
- **Required:** No (defaults to "N/A" if empty)
- **Validation:**
  - Must be unique within the same product only
  - Case-insensitive comparison
  - "N/A" values are excluded from validation (default variants)
  - Error message: "This variant name already exists for this product. Please use a different name."

---

## Composite Uniqueness: Attribute Combination

### Size + Color + Weight + Grip + Material Combination
- **Uniqueness Scope:** Unique per product (same combination cannot exist twice for the same product)
- **Required:** No (individual fields can be empty, defaulting to "N/A")
- **Validation:**
  - The **combination** of Size, Color, Weight, Grip, and Material must be unique per product
  - Individual fields can be duplicated, but the complete combination cannot
  - Case-insensitive comparison
  - "N/A" values are treated as actual values (so two variants with all "N/A" would be duplicates)
  - Error message: "A variant with the same combination of Size, Color, Weight, Grip, and Material already exists for this product."
  - All affected fields (Size, Color, Weight, Grip, Material) are highlighted in red when validation fails

**Example:**
- ✅ Valid: Size="Medium", Color="Black" vs Size="Medium", Color="Red" (different colors)
- ✅ Valid: Size="Small", Color="Black" vs Size="Large", Color="Black" (different sizes)
- ❌ Invalid: Size="Medium", Color="Black", Weight="200g", Grip="Standard", Material="Cotton" appears twice for the same product

## Fields That CAN Be Duplicated (Individually)

The following fields can have the same value across different variants **as long as the complete attribute combination is different**:

### Physical Attributes
- **Size** - Can be duplicated (e.g., "Medium" for different color/weight/grip/material combinations)
- **Color** - Can be duplicated (e.g., "Black" for different size/weight/grip/material combinations)
- **Weight** - Can be duplicated (e.g., "200g" for different size/color/grip/material combinations)
- **Grip** - Can be duplicated (e.g., "Standard" for different size/color/weight/material combinations)
- **Material** - Can be duplicated (e.g., "Cotton" for different size/color/weight/grip combinations)
- **Location** - Multiple variants can be stored in the same location (no uniqueness constraint)

### Pricing Fields
- **Cost Price** - Can be the same across variants
- **Selling Price** - Can be the same across variants
- **Discount Price** - Can be the same across variants
- **Min Selling Price** - Can be the same across variants

### Inventory Fields
- **Current Stock** - Can be the same across variants
- **Reorder Level** - Can be the same across variants
- **Reorder Quantity** - Can be the same across variants
- **Max Stock** - Can be the same across variants
- **Unit of Measure** - Can be the same across variants (e.g., "pcs", "kg")

### Status Fields
- **Status** - Can be the same across variants (e.g., "active", "inactive", "out_of_stock", "discontinued")

---

## Validation Implementation Details

### When Validation Runs
- Validation occurs when saving variants (clicking "SAVE" button)
- All validations run before any database operations
- If any validation fails, the save operation is prevented

### Error Display
- Error messages appear below the input field in red text
- Input field border turns red when validation fails
- Focus is automatically set to the first field with an error

### Real-Time Error Clearing
- Error messages automatically clear when the user starts typing in the field
- Red border is removed when validation passes
- Errors are cleared when variants are loaded/reloaded

### Batch Validation
- When saving multiple variants at once, the system checks for duplicates:
  1. Against existing variants in the database
  2. Against other variants being saved in the same batch
- This prevents creating duplicates within a single save operation

---

## Database Constraints

The following database constraints exist in Supabase:

| Field | Constraint | Notes |
|-------|-----------|-------|
| `sku` | UNIQUE, NOT NULL | Globally unique across all variants |
| `barcode` | UNIQUE | Globally unique (nullable, so multiple NULLs are allowed) |
| `variant_name` | No unique constraint | Uniqueness enforced at application level per product |

---

## Examples

### Valid Scenarios ✅

1. **Same Size, Different Colors (Different Attribute Combination):**
   - Variant 1: Size="Medium", Color="Red", Weight="200g", Grip="Standard", Material="Cotton", SKU="PROD-V1-001"
   - Variant 2: Size="Medium", Color="Blue", Weight="200g", Grip="Standard", Material="Cotton", SKU="PROD-V2-002"
   - ✅ Valid: Different colors make the combination unique

2. **Same Color, Different Sizes (Different Attribute Combination):**
   - Variant 1: Size="Small", Color="Black", Weight="200g", Grip="Standard", Material="Cotton", SKU="PROD-V1-001"
   - Variant 2: Size="Large", Color="Black", Weight="200g", Grip="Standard", Material="Cotton", SKU="PROD-V2-002"
   - ✅ Valid: Different sizes make the combination unique

3. **Same Individual Attributes, Different Combination:**
   - Variant 1: Size="Medium", Color="Black", Weight="200g", Grip="Standard", Material="Cotton", SKU="PROD-V1-001"
   - Variant 2: Size="Medium", Color="Black", Weight="250g", Grip="Standard", Material="Cotton", SKU="PROD-V2-002"
   - ✅ Valid: Different weight makes the combination unique

4. **Same Variant Name, Different Products:**
   - Product A, Variant 1: Variant Name="Standard", SKU="PROD-A-V1-001"
   - Product B, Variant 1: Variant Name="Standard", SKU="PROD-B-V1-001"
   - ✅ Valid: Same variant name allowed for different products

5. **Empty Barcode:**
   - Variant 1: SKU="PROD-V1-001", Barcode=""
   - Variant 2: SKU="PROD-V2-002", Barcode=""
   - ✅ Valid: Multiple empty barcodes are allowed (NULL values)

### Invalid Scenarios ❌

1. **Duplicate SKU:**
   - Variant 1: SKU="PROD-V1-001"
   - Variant 2: SKU="PROD-V1-001"
   - ❌ Invalid: SKU must be unique globally

2. **Duplicate Barcode (if provided):**
   - Variant 1: Barcode="1234567890123"
   - Variant 2: Barcode="1234567890123"
   - ❌ Invalid: Barcode must be unique globally (if provided)

3. **Duplicate Variant Name (Same Product):**
   - Product A, Variant 1: Variant Name="Premium"
   - Product A, Variant 2: Variant Name="Premium"
   - ❌ Invalid: Variant name must be unique per product

4. **Duplicate Attribute Combination (Same Product):**
   - Product A, Variant 1: Size="Medium", Color="Black", Weight="200g", Grip="Standard", Material="Cotton"
   - Product A, Variant 2: Size="Medium", Color="Black", Weight="200g", Grip="Standard", Material="Cotton"
   - ❌ Invalid: Complete attribute combination must be unique per product

---

## Best Practices

1. **SKU Naming:**
   - Use a consistent format (e.g., `PROD-V1-001`, `PROD-V2-002`)
   - Include product code prefix for easy identification
   - Auto-generation ensures uniqueness

2. **Barcode Management:**
   - Only provide barcode if you have a valid, unique barcode
   - Leave empty if no barcode is available
   - Ensure barcodes are unique before entering

3. **Variant Naming:**
   - Use descriptive names (e.g., "Premium Black", "Standard Red")
   - Avoid generic names like "Default" or "Standard" if multiple variants exist
   - Consider including key attributes (size, color) in the name

---

## Troubleshooting

### "SKU already exists" Error
- Check if the SKU is used by another variant (even in a different product)
- Use the auto-generated SKU if unsure
- Ensure SKU is in uppercase for consistency

### "Barcode already exists" Error
- Check if the barcode is used by another variant
- Leave barcode empty if you don't have a unique barcode
- Verify barcode format (8-13 digits)

### "Variant name already exists" Error
- Check other variants of the same product
- Use a more specific name (e.g., "Premium Black Medium" instead of "Premium")
- Case doesn't matter (e.g., "Premium" and "premium" are considered duplicates)

### "Attribute combination already exists" Error
- Check if another variant has the exact same combination of Size, Color, Weight, Grip, and Material
- Change at least one of these attributes to make the combination unique
- All five fields are compared together (case-insensitive)
- "N/A" values are treated as actual values, so ensure at least one attribute differs

---

## Related Files

- `/Users/jinnn/sportNexus/dashboard.js` - Main validation logic in `saveProductVariants()` function
- `/Users/jinnn/sportNexus/SUPABASE_SCHEMA_REFERENCE.md` - Database schema documentation
- `/Users/jinnn/sportNexus/VALIDATION_GUIDE.md` - General validation guide

---

**Last Updated:** 2024-12-20

