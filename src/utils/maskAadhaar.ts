/**
 * Masks an Aadhaar number to show only last 4 digits
 * @param aadhaar - 12 digit Aadhaar number
 * @returns Masked Aadhaar (XXXX-XXXX-1234)
 */
export const maskAadhaar = (aadhaar?: string): string => {
  if (!aadhaar || aadhaar.length !== 12) {
    return 'Not Available';
  }
  
  const lastFour = aadhaar.slice(-4);
  return `XXXX-XXXX-${lastFour}`;
};

/**
 * Formats Aadhaar number with hyphens
 * @param aadhaar - 12 digit Aadhaar number
 * @returns Formatted Aadhaar (1234-5678-9012)
 */
export const formatAadhaar = (aadhaar: string): string => {
  if (aadhaar.length !== 12) {
    return aadhaar;
  }
  
  return `${aadhaar.slice(0, 4)}-${aadhaar.slice(4, 8)}-${aadhaar.slice(8, 12)}`;
};

/**
 * Validates Aadhaar number format
 * @param aadhaar - Aadhaar number to validate
 * @returns true if valid, false otherwise
 */
export const validateAadhaar = (aadhaar: string): boolean => {
  return /^\d{12}$/.test(aadhaar);
};

/**
 * Validates APAAR ID format
 * @param apaarId - APAAR ID to validate
 * @returns true if valid, false otherwise
 */
export const validateApaarId = (apaarId: string): boolean => {
  return /^[A-Z0-9]{12}$/.test(apaarId);
};
