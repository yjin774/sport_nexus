# Input Field Validation Guide

This document outlines all the validations that have been added to the Sport Nexus website and how to use them.

## Overview

A centralized validation system has been implemented using `validation.js` which provides:
- HTML5 validation attributes
- JavaScript validation functions
- Real-time error display
- Consistent error messaging

## Validation Utility (`validation.js`)

The validation utility provides the following functions:

### Available Validation Functions

1. **Email**: `validateEmail(email)` - Validates email format
2. **Phone**: `validatePhone(phone)` - Validates Malaysian phone numbers (10-11 digits)
3. **Password**: `validatePassword(password)` - Minimum 6 chars, at least one letter and one number
4. **Username**: `validateUsername(username)` - 3-30 chars, alphanumeric and underscore only
5. **SSM**: `validateSSM(ssm)` - Malaysian SSM registration number format
6. **Product Code**: `validateProductCode(code)` - 5-20 uppercase alphanumeric
7. **SKU**: `validateSKU(sku)` - 3-50 chars, uppercase alphanumeric with dashes/underscores
8. **Barcode**: `validateBarcode(barcode)` - 8-13 digits (EAN/UPC format)
9. **Price**: `validatePrice(price)` - Positive number with up to 2 decimals
10. **Quantity**: `validateQuantity(quantity)` - Positive integer
11. **OTP**: `validateOTP(otp)` - 4-6 digits
12. **Business Name**: `validateBusinessName(name)` - 2-100 characters
13. **Product Name**: `validateProductName(name)` - 1-200 characters
14. **Brand**: `validateBrand(brand)` - 1-50 characters
15. **Description**: `validateDescription(desc)` - 0-1000 characters (optional)
16. **Address**: `validateAddress(address)` - 5-200 characters
17. **Time**: `validateTime(time)` - HH:MM format (24-hour)
18. **Date**: `validateDate(date)` - DD/MM/YYYY format
19. **Percentage**: `validatePercentage(percentage)` - 0-100 with up to 2 decimals
20. **Tax Rate**: `validateTaxRate(taxRate)` - 0-100 with up to 2 decimals

### UI Helper Functions

- `showFieldError(fieldId, message)` - Display error message for a field
- `clearFieldError(fieldId)` - Clear error message for a field
- `clearAllErrors()` - Clear all error messages
- `validateAndShowError(fieldId, fieldType, options)` - Validate and show error
- `setupFieldValidation(fieldId, fieldType, options)` - Setup real-time validation

## Pages Updated

### 1. **index.html** (Login Page)
- ✅ Email: HTML5 email type, pattern, maxlength 255
- ✅ Password: minlength 6, maxlength 128

### 2. **sign-up.html** (Registration Page)
- ✅ Username: minlength 3, maxlength 30, pattern [a-zA-Z0-9_]{3,30}
- ✅ Business Name: minlength 2, maxlength 100
- ✅ Business Email: HTML5 email type, pattern, maxlength 255
- ✅ Business Contact: tel type, maxlength 15, pattern for Malaysian phone
- ✅ Password: minlength 6, maxlength 128
- ✅ Confirm Password: minlength 6, maxlength 128
- ✅ SSM Registration: maxlength 20, pattern [A-Z]{1,3}\d{6,10}[A-Z]?

### 3. **forgot-password.html** (Password Reset)
- ✅ Email: HTML5 email type, pattern, maxlength 255
- ✅ OTP: maxlength 6, pattern \d{4,6}
- ✅ New Password: minlength 6, maxlength 128
- ✅ Confirm Password: minlength 6, maxlength 128

### 4. **manage-product-page.html** (Product Management)
- ✅ Product Name: required, maxlength 200
- ✅ Brand: maxlength 50
- ✅ Description: maxlength 1000
- ✅ Quantity: min 0, max 999999, required

## Validation Rules by Field Type

### Email Fields
```html
<input type="email" 
       maxlength="255" 
       pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
       autocomplete="email" />
```

### Phone Fields
```html
<input type="tel" 
       maxlength="15" 
       pattern="(\+?60|0)?[1-9]\d{8,9}"
       autocomplete="tel" />
```

### Password Fields
```html
<input type="password" 
       minlength="6" 
       maxlength="128"
       autocomplete="new-password" />
```

### Username Fields
```html
<input type="text" 
       minlength="3" 
       maxlength="30"
       pattern="[a-zA-Z0-9_]{3,30}"
       autocomplete="username" />
```

### Product Name Fields
```html
<input type="text" 
       required 
       maxlength="200" />
```

### Brand Fields
```html
<input type="text" 
       maxlength="50" />
```

### Description Fields
```html
<textarea maxlength="1000"></textarea>
```

### Quantity/Stock Fields
```html
<input type="number" 
       min="0" 
       max="999999" 
       step="1" 
       required />
```

### Price Fields
```html
<input type="number" 
       min="0" 
       step="0.01" 
       required />
```

### OTP Fields
```html
<input type="text" 
       inputmode="numeric" 
       maxlength="6" 
       pattern="\d{4,6}" />
```

## How to Add Validation to Other Pages

### Step 1: Include validation.js
Add the script before your main JavaScript file:
```html
<script src="validation.js"></script>
<script src="your-main-script.js"></script>
```

### Step 2: Add HTML5 Validation Attributes
Add appropriate attributes to your input fields:
```html
<input type="text" 
       id="field-name" 
       required 
       minlength="3" 
       maxlength="50" 
       pattern="[a-zA-Z0-9_]+" />
```

### Step 3: Add Error Message Element
Add an error message span after each input:
```html
<input type="text" id="field-name" />
<span id="field-name-error" class="error-message" style="display: none;"></span>
```

### Step 4: Setup Real-time Validation (Optional)
In your JavaScript, setup real-time validation:
```javascript
setupFieldValidation('field-name', 'username', { required: true });
```

### Step 5: Validate on Form Submit
```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Clear previous errors
  clearAllErrors();
  
  // Validate each field
  let isValid = true;
  
  isValid = validateAndShowError('field-name', 'username', { required: true }) && isValid;
  isValid = validateAndShowError('email-field', 'email', { required: true }) && isValid;
  
  if (!isValid) {
    return; // Stop submission
  }
  
  // Proceed with form submission
});
```

## Pages That Still Need Validation

The following pages should have validations added:

1. **user-staff.html** - Staff management forms
2. **user-member.html** - Member management forms
3. **user-supplier.html** - Supplier management forms
4. **new-po-page.html** - Purchase order forms
5. **general-settings.html** - Settings forms
6. **supplier-po-management.html** - Supplier PO forms
7. **supplier-return-goods.html** - Return goods forms
8. **stock-take-details.html** - Stock take forms

## Common Validation Patterns

### Malaysian Phone Number
- Pattern: `(\+?60|0)?[1-9]\d{8,9}`
- Examples: `0123456789`, `+60123456789`, `60123456789`

### SSM Registration Number
- Pattern: `[A-Z]{1,3}\d{6,10}[A-Z]?`
- Examples: `SSM123456789`, `PLT123456`

### Product Code
- Pattern: `[A-Z0-9]{5,20}`
- Examples: `PROD001`, `ABC123XYZ`

### SKU
- Pattern: `[A-Z0-9_-]{3,50}`
- Examples: `SKU-001`, `PROD_VAR_001`

### Barcode
- Pattern: `\d{8,13}`
- Examples: `1234567890123` (EAN-13), `12345678` (EAN-8)

## Best Practices

1. **Always validate on both client and server side** - Client-side validation improves UX, but server-side validation is essential for security.

2. **Provide clear error messages** - Tell users exactly what's wrong and how to fix it.

3. **Validate on blur** - Check fields when users leave them (better UX than on every keystroke).

4. **Clear errors on input** - Remove error state when user starts typing (if validation passes).

5. **Use appropriate input types** - Use `type="email"`, `type="tel"`, `type="number"` etc. for better mobile keyboard support.

6. **Set reasonable limits** - Use `maxlength` to prevent extremely long inputs.

7. **Use patterns for format validation** - HTML5 `pattern` attribute provides instant feedback.

8. **Accessibility** - Use `aria-invalid` attribute for screen readers.

## Testing Checklist

When adding validation to a new page, test:

- [ ] Required fields show error when empty
- [ ] Invalid formats show appropriate error messages
- [ ] Valid inputs clear error messages
- [ ] Form doesn't submit with invalid data
- [ ] Error messages are clear and helpful
- [ ] Mobile keyboard types are correct (email, tel, numeric)
- [ ] Maxlength prevents excessive input
- [ ] Min/max values work for number inputs
- [ ] Pattern validation works correctly

## Notes

- All validation functions are available globally via `window` object
- Error styling is already defined in `style.css`
- The validation utility is framework-agnostic and works with vanilla JavaScript
- For complex validations (like password strength), consider adding visual indicators
