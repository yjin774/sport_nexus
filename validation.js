/* ============================================
   VALIDATION UTILITY FUNCTIONS
   Centralized validation for all input fields
   ============================================ */

// Validation patterns and rules
const ValidationRules = {
  // Email validation
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  
  // Phone number (Malaysian format: 10-11 digits, may start with +60 or 0)
  phone: {
    pattern: /^(\+?60|0)?[1-9]\d{8,9}$/,
    message: 'Please enter a valid phone number (e.g., 0123456789 or +60123456789)'
  },
  
  // Password: minimum 6 characters, at least one letter and one number
  password: {
    pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
    message: 'Password must be at least 6 characters and contain at least one letter and one number'
  },
  
  // Username: 3-30 characters, alphanumeric and underscore only
  username: {
    pattern: /^[a-zA-Z0-9_]{3,30}$/,
    message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
  },
  
  // SSM Registration Number (Malaysian format)
  ssm: {
    pattern: /^[A-Z]{1,3}\d{6,10}[A-Z]?$/,
    message: 'Please enter a valid SSM registration number'
  },
  
  // Product code: alphanumeric, 5-20 characters
  productCode: {
    pattern: /^[A-Z0-9]{5,20}$/,
    message: 'Product code must be 5-20 uppercase alphanumeric characters'
  },
  
  // SKU: alphanumeric, dashes, underscores, 3-50 characters
  sku: {
    pattern: /^[A-Z0-9_-]{3,50}$/,
    message: 'SKU must be 3-50 characters (uppercase letters, numbers, dashes, underscores)'
  },
  
  // Barcode: numeric, 8-13 digits (EAN/UPC format)
  barcode: {
    pattern: /^\d{8,13}$/,
    message: 'Barcode must be 8-13 digits'
  },
  
  // Price: positive number with up to 2 decimal places
  price: {
    pattern: /^\d+(\.\d{1,2})?$/,
    message: 'Price must be a positive number with up to 2 decimal places'
  },
  
  // Quantity/Stock: positive integer
  quantity: {
    pattern: /^\d+$/,
    message: 'Quantity must be a positive whole number'
  },
  
  // OTP: 4-6 digits
  otp: {
    pattern: /^\d{4,6}$/,
    message: 'OTP must be 4-6 digits'
  },
  
  // Business name: 2-100 characters, letters, numbers, spaces, and common punctuation
  businessName: {
    pattern: /^[a-zA-Z0-9\s&.,'-]{2,100}$/,
    message: 'Business name must be 2-100 characters'
  },
  
  // Product name: 1-200 characters
  productName: {
    pattern: /^.{1,200}$/,
    message: 'Product name must be 1-200 characters'
  },
  
  // Brand name: 1-50 characters
  brand: {
    pattern: /^.{1,50}$/,
    message: 'Brand name must be 1-50 characters'
  },
  
  // Description: 0-1000 characters (optional)
  description: {
    pattern: /^.{0,1000}$/,
    message: 'Description must not exceed 1000 characters'
  },
  
  // Address: 5-200 characters
  address: {
    pattern: /^.{5,200}$/,
    message: 'Address must be 5-200 characters'
  },
  
  // Time format (HH:MM)
  time: {
    pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
    message: 'Time must be in HH:MM format (24-hour)'
  },
  
  // Date format (DD/MM/YYYY)
  date: {
    pattern: /^(\d{2})\/(\d{2})\/(\d{4})$/,
    message: 'Date must be in DD/MM/YYYY format'
  },
  
  // Percentage: 0-100 with up to 2 decimal places
  percentage: {
    pattern: /^(100(\.00?)?|[0-9]{1,2}(\.[0-9]{1,2})?)$/,
    message: 'Percentage must be between 0 and 100'
  },
  
  // Tax rate: 0-100 with up to 2 decimal places
  taxRate: {
    pattern: /^(100(\.00?)?|[0-9]{1,2}(\.[0-9]{1,2})?)$/,
    message: 'Tax rate must be between 0 and 100'
  }
};

/* ============================================
   VALIDATION FUNCTIONS
   ============================================ */

/**
 * Validate email address
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return ValidationRules.email.pattern.test(email.trim());
}

/**
 * Validate phone number
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return ValidationRules.phone.pattern.test(cleaned);
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return ValidationRules.password.pattern.test(password);
}

/**
 * Validate username
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  return ValidationRules.username.pattern.test(username.trim());
}

/**
 * Validate SSM registration number
 */
function validateSSM(ssm) {
  if (!ssm || typeof ssm !== 'string') return false;
  return ValidationRules.ssm.pattern.test(ssm.trim().toUpperCase());
}

/**
 * Validate product code
 */
function validateProductCode(code) {
  if (!code || typeof code !== 'string') return false;
  return ValidationRules.productCode.pattern.test(code.trim().toUpperCase());
}

/**
 * Validate SKU
 */
function validateSKU(sku) {
  if (!sku || typeof sku !== 'string') return false;
  return ValidationRules.sku.pattern.test(sku.trim().toUpperCase());
}

/**
 * Validate barcode
 */
function validateBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') return false;
  return ValidationRules.barcode.pattern.test(barcode.trim());
}

/**
 * Validate price (positive number with up to 2 decimals)
 */
function validatePrice(price) {
  if (price === null || price === undefined || price === '') return false;
  const num = parseFloat(price);
  if (isNaN(num) || num < 0) return false;
  return ValidationRules.price.pattern.test(price.toString());
}

/**
 * Validate quantity (positive integer)
 */
function validateQuantity(quantity) {
  if (quantity === null || quantity === undefined || quantity === '') return false;
  const num = parseInt(quantity, 10);
  if (isNaN(num) || num < 0) return false;
  return ValidationRules.quantity.pattern.test(quantity.toString());
}

/**
 * Validate OTP code
 */
function validateOTP(otp) {
  if (!otp || typeof otp !== 'string') return false;
  return ValidationRules.otp.pattern.test(otp.trim());
}

/**
 * Validate business name
 */
function validateBusinessName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100 && ValidationRules.businessName.pattern.test(trimmed);
}

/**
 * Validate product name
 */
function validateProductName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 200;
}

/**
 * Validate brand name
 */
function validateBrand(brand) {
  if (!brand || typeof brand !== 'string') return false;
  const trimmed = brand.trim();
  return trimmed.length >= 1 && trimmed.length <= 50;
}

/**
 * Validate description
 */
function validateDescription(description) {
  if (!description) return true; // Optional field
  if (typeof description !== 'string') return false;
  return description.length <= 1000;
}

/**
 * Validate address
 */
function validateAddress(address) {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  return trimmed.length >= 5 && trimmed.length <= 200;
}

/**
 * Validate time format (HH:MM)
 */
function validateTime(time) {
  if (!time || typeof time !== 'string') return false;
  return ValidationRules.time.pattern.test(time.trim());
}

/**
 * Validate date format (DD/MM/YYYY)
 */
function validateDate(date) {
  if (!date || typeof date !== 'string') return false;
  if (!ValidationRules.date.pattern.test(date.trim())) return false;
  
  // Additional validation: check if date is valid
  const parts = date.trim().split('/');
  if (parts.length !== 3) return false;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Check if date is valid (e.g., Feb 30 doesn't exist)
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getDate() === day && dateObj.getMonth() === month - 1 && dateObj.getFullYear() === year;
}

/**
 * Validate percentage (0-100)
 */
function validatePercentage(percentage) {
  if (percentage === null || percentage === undefined || percentage === '') return false;
  const num = parseFloat(percentage);
  if (isNaN(num) || num < 0 || num > 100) return false;
  return ValidationRules.percentage.pattern.test(percentage.toString());
}

/**
 * Validate tax rate (0-100)
 */
function validateTaxRate(taxRate) {
  return validatePercentage(taxRate);
}

/**
 * Generic validation function
 */
function validateField(value, fieldType, options = {}) {
  const {
    required = false,
    minLength = null,
    maxLength = null,
    min = null,
    max = null,
    customPattern = null,
    customMessage = null
  } = options;
  
  // Check required
  if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { valid: false, message: customMessage || 'This field is required' };
  }
  
  // If not required and empty, it's valid
  if (!required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { valid: true, message: '' };
  }
  
  // Check length
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (minLength !== null && trimmed.length < minLength) {
      return { valid: false, message: customMessage || `Must be at least ${minLength} characters` };
    }
    if (maxLength !== null && trimmed.length > maxLength) {
      return { valid: false, message: customMessage || `Must not exceed ${maxLength} characters` };
    }
  }
  
  // Check numeric range
  if (typeof value === 'number' || !isNaN(value)) {
    const num = parseFloat(value);
    if (min !== null && num < min) {
      return { valid: false, message: customMessage || `Must be at least ${min}` };
    }
    if (max !== null && num > max) {
      return { valid: false, message: customMessage || `Must not exceed ${max}` };
    }
  }
  
  // Check custom pattern
  if (customPattern && typeof value === 'string') {
    if (!customPattern.test(value.trim())) {
      return { valid: false, message: customMessage || 'Invalid format' };
    }
  }
  
  // Field type specific validation
  switch (fieldType) {
    case 'email':
      return validateEmail(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.email.message };
    case 'phone':
      return validatePhone(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.phone.message };
    case 'password':
      return validatePassword(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.password.message };
    case 'username':
      return validateUsername(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.username.message };
    case 'ssm':
      return validateSSM(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.ssm.message };
    case 'productCode':
      return validateProductCode(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.productCode.message };
    case 'sku':
      return validateSKU(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.sku.message };
    case 'barcode':
      return validateBarcode(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.barcode.message };
    case 'price':
      return validatePrice(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.price.message };
    case 'quantity':
      return validateQuantity(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.quantity.message };
    case 'otp':
      return validateOTP(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.otp.message };
    case 'businessName':
      return validateBusinessName(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.businessName.message };
    case 'productName':
      return validateProductName(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.productName.message };
    case 'brand':
      return validateBrand(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.brand.message };
    case 'description':
      return validateDescription(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.description.message };
    case 'address':
      return validateAddress(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.address.message };
    case 'time':
      return validateTime(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.time.message };
    case 'date':
      return validateDate(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.date.message };
    case 'percentage':
      return validatePercentage(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.percentage.message };
    case 'taxRate':
      return validateTaxRate(value) ? { valid: true, message: '' } : { valid: false, message: ValidationRules.taxRate.message };
    default:
      return { valid: true, message: '' };
  }
}

/* ============================================
   UI HELPER FUNCTIONS
   ============================================ */

/**
 * Show error message for a field
 */
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (field) {
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
  }
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

/**
 * Clear error message for a field
 */
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (field) {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
  }
  
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

/**
 * Clear all errors
 */
function clearAllErrors() {
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
  
  const errorFields = document.querySelectorAll('.error');
  errorFields.forEach(field => {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
  });
}

/**
 * Validate a field and show/clear error
 */
function validateAndShowError(fieldId, fieldType, options = {}) {
  const field = document.getElementById(fieldId);
  if (!field) return false;
  
  const value = field.value;
  const result = validateField(value, fieldType, options);
  
  if (result.valid) {
    clearFieldError(fieldId);
    return true;
  } else {
    showFieldError(fieldId, result.message);
    return false;
  }
}

/**
 * Setup real-time validation for a field
 */
function setupFieldValidation(fieldId, fieldType, options = {}) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  // Validate on blur (when user leaves the field)
  field.addEventListener('blur', () => {
    validateAndShowError(fieldId, fieldType, options);
  });
  
  // Clear error on input (optional - for better UX)
  field.addEventListener('input', () => {
    if (field.classList.contains('error')) {
      const result = validateField(field.value, fieldType, options);
      if (result.valid) {
        clearFieldError(fieldId);
      }
    }
  });
}

/* ============================================
   EXPORT FOR USE IN OTHER FILES
   ============================================ */

// Make functions available globally
if (typeof window !== 'undefined') {
  window.validateEmail = validateEmail;
  window.validatePhone = validatePhone;
  window.validatePassword = validatePassword;
  window.validateUsername = validateUsername;
  window.validateSSM = validateSSM;
  window.validateProductCode = validateProductCode;
  window.validateSKU = validateSKU;
  window.validateBarcode = validateBarcode;
  window.validatePrice = validatePrice;
  window.validateQuantity = validateQuantity;
  window.validateOTP = validateOTP;
  window.validateBusinessName = validateBusinessName;
  window.validateProductName = validateProductName;
  window.validateBrand = validateBrand;
  window.validateDescription = validateDescription;
  window.validateAddress = validateAddress;
  window.validateTime = validateTime;
  window.validateDate = validateDate;
  window.validatePercentage = validatePercentage;
  window.validateTaxRate = validateTaxRate;
  window.validateField = validateField;
  window.showFieldError = showFieldError;
  window.clearFieldError = clearFieldError;
  window.clearAllErrors = clearAllErrors;
  window.validateAndShowError = validateAndShowError;
  window.setupFieldValidation = setupFieldValidation;
}
