# Validation Issues Found in insert_sample_products_and_variants.sql

## Critical Issues Fixed

### Issue 1: Size and Color Must Always Be Active
**Problem**: Some products had `"size": null` in `active_variant_attributes`, which violates the system rule that Size and Color are ALWAYS required.

**Affected Products**:
- FITNESS001 (had `"size": null`)
- FITNESS002 (had `"size": null`)
- WATER001 (had `"size": null`)
- ACCESSORIES001 (had `"size": null`)
- ACCESSORIES002 (had `"size": null`)
- MARTIAL003 (had `"size": null`)

**Fix Applied**: Changed all `"size": null` to `"size": "Size"` and added size values to variants (using "One Size" for products that don't have traditional sizes).

### Issue 2: Inactive Attributes Not Explicitly Set to NULL
**Problem**: In the original SQL, inactive attributes (weight, grip, material) were not explicitly included in INSERT statements, relying on database defaults.

**Fix Applied**: All variant INSERT statements now explicitly include ALL attribute columns (size, color, weight, grip, material) and set inactive ones to NULL.

## Validation Rules Verified

### ✓ Rule 1: Active Attributes Consistency
- All variants of the same product use the same set of active attributes
- Inactive attributes are consistently NULL across all variants

### ✓ Rule 2: Size and Color Always Required
- All products now have Size and Color as active attributes
- All variants have values for Size and Color

### ✓ Rule 3: SKU Uniqueness
- All SKUs follow pattern: `{PRODUCT_CODE}-{VARIANT_IDENTIFIER}`
- All SKUs are unique globally

### ✓ Rule 4: Composite Uniqueness
- All variant combinations of active attributes are unique per product
- No duplicate attribute combinations found

### ✓ Rule 5: Variant Name Uniqueness
- All variant names are unique per product

## Products by Active Attributes Configuration

### Products with 2 Active Attributes (Size, Color):
- SHIRT001, SHIRT002, SHIRT003
- BALLS001, BALLS002, BALLS003
- SHOE001, SHOE002, SHOE003
- WINTER001, WINTER002
- MARTIAL002
- ACCESSORIES003

### Products with 3 Active Attributes (Size, Color, Weight):
- RACKET001, RACKET002, RACKET003

### Products with 3 Active Attributes (Size, Color, Weight):
- FITNESS001, FITNESS002

### Products with 4 Active Attributes (Size, Color, Weight, Material):
- FITNESS003
- OUTDOOR002

### Products with 3 Active Attributes (Size, Color, Material):
- OUTDOOR001
- WATER002, WATER003
- WINTER003
- MARTIAL001

### Products with 2 Active Attributes (Size, Color) - Fixed:
- WATER001 (was color-only, now has size)
- ACCESSORIES001 (was color-only, now has size)
- ACCESSORIES002 (was color-only, now has size)
- MARTIAL003 (was color-only, now has size)

## Summary

The **insert_sample_products_and_variants_FIXED.sql** file contains all corrections:
1. All products have Size and Color as active (required)
2. All inactive attributes are explicitly set to NULL
3. All variants consistently use the same active attributes per product
4. All validation rules are satisfied

**Use the FIXED version for production!**
