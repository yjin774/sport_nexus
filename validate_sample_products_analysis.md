# Validation Analysis for insert_sample_products_and_variants.sql

## System Validation Rules

Based on the codebase analysis, the following validation rules apply:

### 1. Active Variant Attributes Consistency
- **Rule**: If a product has active variant attributes (non-null in `active_variant_attributes`), ALL variants for that product MUST have values for those active attributes
- **Rule**: If an attribute is inactive (null in `active_variant_attributes`), ALL variants MUST have NULL for that attribute
- **Rule**: Size and Color are ALWAYS required (must always be active)

### 2. SKU Uniqueness
- **Rule**: SKU must be unique globally across ALL products and variants
- **Rule**: SKU is required for all variants

### 3. Barcode Uniqueness
- **Rule**: Barcode must be unique globally (if provided)
- **Rule**: Barcode is optional (can be NULL)

### 4. Composite Attribute Uniqueness
- **Rule**: The combination of active attributes (size + color + weight + grip + material) must be unique per product
- **Rule**: Only active attributes are compared (null values are ignored)

### 5. Variant Name Uniqueness
- **Rule**: Variant name must be unique per product (excluding 'N/A')

## Issues Found in SQL Script

### Issue 1: Missing NULL for Inactive Attributes
**Problem**: Some variants may not explicitly set inactive attributes to NULL in the INSERT statement.

**Example**: 
- Product with `active_variant_attributes: {"size": "Size", "color": "Color", "weight": null, "grip": null, "material": null}`
- Variants should have: `size` and `color` with values, `weight`, `grip`, `material` should be NULL
- Current SQL: May not explicitly set weight/grip/material to NULL

**Fix Required**: Ensure all inactive attributes are explicitly set to NULL in INSERT statements.

### Issue 2: SKU Uniqueness Check
**Status**: All SKUs appear to be unique (using product code + variant identifier pattern)
- Pattern: `{PRODUCT_CODE}-{VARIANT_IDENTIFIER}`
- Example: `SHIRT001-BLK-M`, `SHIRT001-WHT-L`, `SHIRT001-RED-M`
- ✓ All SKUs are unique

### Issue 3: Composite Uniqueness Check
**Status**: Need to verify that no two variants of the same product have identical active attribute combinations.

**Example Check**:
- RACKET001 variants:
  - G4, Black, 3U (88g) ✓
  - G5, Black, 4U (83g) ✓
  - G4, Red, 3U (88g) ✓
- All combinations are unique ✓

### Issue 4: Variant Name Validation
**Status**: All variant names appear unique per product ✓

## Recommendations

1. **Explicitly set inactive attributes to NULL** in all INSERT statements
2. **Verify all products have Size and Color as active** (required)
3. **Ensure consistent attribute usage** across all variants of the same product
4. **Add barcode values** if needed (currently all NULL, which is valid)
