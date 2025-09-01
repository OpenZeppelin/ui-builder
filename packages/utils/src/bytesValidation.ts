import validator from 'validator';

/**
 * Options for bytes validation
 */
export interface BytesValidationOptions {
  /**
   * Whether to accept hex, base64, or both formats
   */
  acceptedFormats?: 'hex' | 'base64' | 'both';

  /**
   * Maximum length in bytes (not characters)
   */
  maxBytes?: number;

  /**
   * Whether to allow 0x prefix for hex values
   */
  allowHexPrefix?: boolean;
}

/**
 * Result of bytes validation
 */
export interface BytesValidationResult {
  /**
   * Whether the input is valid
   */
  isValid: boolean;

  /**
   * Error message if validation failed
   */
  error?: string;

  /**
   * Detected format of the input
   */
  detectedFormat?: 'hex' | 'base64';

  /**
   * Cleaned value (whitespace removed, prefix handled)
   */
  cleanedValue?: string;

  /**
   * Size in bytes
   */
  byteSize?: number;
}

/**
 * Validates bytes input using the established validator.js library.
 *
 * This function provides comprehensive validation for blockchain bytes data including:
 * - Hex encoding validation (with optional 0x prefix)
 * - Base64 encoding validation
 * - Byte length validation
 * - Format detection
 *
 * @param value - The input string to validate
 * @param options - Validation options
 * @returns Validation result with details
 *
 * @example
 * ```typescript
 * validateBytes('48656c6c6f') // → { isValid: true, detectedFormat: 'hex', byteSize: 5 }
 * validateBytes('SGVsbG8=') // → { isValid: true, detectedFormat: 'base64', byteSize: 5 }
 * validateBytes('invalid') // → { isValid: false, error: '...' }
 * ```
 */
export function validateBytes(
  value: string,
  options: BytesValidationOptions = {}
): BytesValidationResult {
  const { acceptedFormats = 'both', maxBytes, allowHexPrefix = true } = options;

  // Handle empty values
  if (!value || value.trim() === '') {
    return {
      isValid: true, // Let required validation handle empty values
      cleanedValue: '',
      byteSize: 0,
    };
  }

  // Clean the value (remove whitespace)
  const cleanValue = value.trim().replace(/\s+/g, '');

  // Handle hex prefix
  const hasHexPrefix = cleanValue.startsWith('0x');
  const withoutPrefix = hasHexPrefix ? cleanValue.slice(2) : cleanValue;

  if (withoutPrefix === '') {
    return {
      isValid: false,
      error: 'Bytes value cannot be empty',
      cleanedValue: cleanValue,
    };
  }

  // Detect format using validator.js
  let detectedFormat: 'hex' | 'base64' | null = null;
  let byteSize = 0;

  // Try hex validation first (more specific)
  if (validator.isHexadecimal(withoutPrefix)) {
    detectedFormat = 'hex';
    byteSize = withoutPrefix.length / 2;

    // Ensure even length for hex
    if (withoutPrefix.length % 2 !== 0) {
      return {
        isValid: false,
        error: 'Hex string must have even number of characters',
        cleanedValue: cleanValue,
        detectedFormat,
      };
    }
  }
  // Try base64 validation
  else if (validator.isBase64(withoutPrefix)) {
    detectedFormat = 'base64';

    try {
      // Calculate byte size by decoding using Web API
      const decoded = atob(withoutPrefix);
      byteSize = decoded.length;
    } catch {
      return {
        isValid: false,
        error: 'Invalid base64 encoding',
        cleanedValue: cleanValue,
      };
    }
  }

  // No format detected
  if (!detectedFormat) {
    return {
      isValid: false,
      error: 'Invalid format. Expected hex or base64 encoding',
      cleanedValue: cleanValue,
    };
  }

  // Check if detected format is accepted
  if (acceptedFormats !== 'both') {
    if (acceptedFormats === 'hex' && detectedFormat !== 'hex') {
      return {
        isValid: false,
        error: 'Only hex format is accepted for this field',
        cleanedValue: cleanValue,
        detectedFormat,
      };
    }
    if (acceptedFormats === 'base64' && detectedFormat !== 'base64') {
      return {
        isValid: false,
        error: 'Only base64 format is accepted for this field',
        cleanedValue: cleanValue,
        detectedFormat,
      };
    }
  }

  // Check hex prefix policy
  if (detectedFormat === 'hex' && hasHexPrefix && !allowHexPrefix) {
    return {
      isValid: false,
      error: '0x prefix not allowed for this field',
      cleanedValue: cleanValue,
      detectedFormat,
    };
  }

  // Check byte length limits
  if (maxBytes && byteSize > maxBytes) {
    const formatInfo =
      detectedFormat === 'hex' ? `${maxBytes * 2} hex characters` : `${maxBytes} bytes`;

    return {
      isValid: false,
      error: `Maximum ${maxBytes} bytes allowed (${formatInfo})`,
      cleanedValue: cleanValue,
      detectedFormat,
      byteSize,
    };
  }

  return {
    isValid: true,
    cleanedValue: cleanValue,
    detectedFormat,
    byteSize,
  };
}

/**
 * Simple validation function that returns boolean or error string
 * (for compatibility with existing React Hook Form validation)
 *
 * @param value - The input string to validate
 * @param options - Validation options
 * @returns true if valid, error string if invalid
 */
export function validateBytesSimple(
  value: string,
  options: BytesValidationOptions = {}
): boolean | string {
  const result = validateBytes(value, options);
  return result.isValid ? true : result.error || 'Invalid bytes format';
}
