/**
 * Form Validation Utilities
 * Centralized validation functions for consistent form validation across the app
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate required fields
 */
export const validateRequired = (value: any, fieldName: string): ValidationError | null => {
  if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
    return {
      field: fieldName,
      message: `${fieldName} is required`
    };
  }
  return null;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string, fieldName: string = 'Email'): ValidationError | null => {
  if (!email) return null; // Skip if empty (use validateRequired separately)
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid email address`
    };
  }
  return null;
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string, fieldName: string = 'Phone'): ValidationError | null => {
  if (!phone) return null;
  
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid phone number (at least 10 digits)`
    };
  }
  return null;
};

/**
 * Validate Aadhaar number (12 digits)
 */
export const validateAadhaar = (aadhaar: string): ValidationError | null => {
  if (!aadhaar || aadhaar.trim() === '') return null;
  
  const aadhaarRegex = /^\d{12}$/;
  if (!aadhaarRegex.test(aadhaar.replace(/\s/g, ''))) {
    return {
      field: 'Aadhaar Number',
      message: 'Aadhaar number must be exactly 12 digits'
    };
  }
  return null;
};

/**
 * Validate APAAR ID (12 alphanumeric characters)
 */
export const validateApaarId = (apaarId: string): ValidationError | null => {
  if (!apaarId || apaarId.trim() === '') return null;
  
  const apaarRegex = /^[A-Z0-9]{12}$/;
  if (!apaarRegex.test(apaarId)) {
    return {
      field: 'APAAR ID',
      message: 'APAAR ID must be exactly 12 uppercase alphanumeric characters'
    };
  }
  return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string, fieldName: string = 'Password'): ValidationError | null => {
  if (!password) return null;
  
  if (password.length < 8) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least 8 characters long`
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return {
      field: fieldName,
      message: `${fieldName} must contain at least one uppercase letter`
    };
  }
  
  if (!/[a-z]/.test(password)) {
    return {
      field: fieldName,
      message: `${fieldName} must contain at least one lowercase letter`
    };
  }
  
  if (!/[0-9]/.test(password)) {
    return {
      field: fieldName,
      message: `${fieldName} must contain at least one number`
    };
  }
  
  if (!/[@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      field: fieldName,
      message: `${fieldName} must contain at least one special character`
    };
  }
  
  return null;
};

/**
 * Validate number range
 */
export const validateNumberRange = (
  value: number | undefined,
  fieldName: string,
  min?: number,
  max?: number
): ValidationError | null => {
  if (value === undefined || value === null) return null;
  
  if (min !== undefined && value < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min}`
    };
  }
  
  if (max !== undefined && value > max) {
    return {
      field: fieldName,
      message: `${fieldName} must not exceed ${max}`
    };
  }
  
  return null;
};

/**
 * Validate date format and range
 */
export const validateDate = (
  date: string,
  fieldName: string,
  minDate?: Date,
  maxDate?: Date
): ValidationError | null => {
  if (!date) return null;
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid date`
    };
  }
  
  if (minDate && parsedDate < minDate) {
    return {
      field: fieldName,
      message: `${fieldName} must be on or after ${minDate.toLocaleDateString()}`
    };
  }
  
  if (maxDate && parsedDate > maxDate) {
    return {
      field: fieldName,
      message: `${fieldName} must be on or before ${maxDate.toLocaleDateString()}`
    };
  }
  
  return null;
};

/**
 * Validate string length
 */
export const validateLength = (
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationError | null => {
  if (!value) return null;
  
  if (minLength !== undefined && value.length < minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${minLength} characters`
    };
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must not exceed ${maxLength} characters`
    };
  }
  
  return null;
};

/**
 * Extract error message from API error response
 */
export const extractErrorMessage = (error: any): string => {
  // Check for validation errors
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (Array.isArray(errors)) {
      return errors.map((e: any) => e.message || e.defaultMessage || 'Validation error').join(', ');
    }
  }
  
  // Check for standard error message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Check for error string
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Check for Spring Boot validation errors
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') {
      return data;
    }
  }
  
  // Generic error message
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  
  return errors.map((e, i) => `${i + 1}. ${e.message}`).join('\n');
};

/**
 * Check if form has errors
 */
export const hasErrors = (errors: ValidationError[]): boolean => {
  return errors.length > 0;
};

/**
 * Get error for specific field
 */
export const getFieldError = (errors: ValidationError[], fieldName: string): string | null => {
  const error = errors.find(e => e.field === fieldName);
  return error ? error.message : null;
};
