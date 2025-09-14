/**
 * Validation and error handling utilities for form field components
 */
import { FieldError } from 'react-hook-form';

import { FieldValidation, MapEntry } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Determines if a field has an error
 */
export function hasFieldError(error: FieldError | undefined): boolean {
  return !!error;
}

/**
 * Gets appropriate error message from field error
 */
export function getErrorMessage(error: FieldError | undefined): string | undefined {
  if (!error) return undefined;

  return error.message || 'This field is invalid';
}

/**
 * Formats validation error messages for display
 */
export function formatValidationError(
  error: FieldError | undefined,
  fieldName?: string
): string | undefined {
  if (!error) return undefined;

  const defaultMessage = fieldName ? `${fieldName} is invalid` : 'This field is invalid';

  return error.message || defaultMessage;
}

/**
 * Generates common CSS classes for field validation states
 */
export function getValidationStateClasses(
  error: FieldError | undefined,
  touched?: boolean
): string {
  if (error) {
    return 'border-destructive focus:border-destructive focus:ring-destructive/30';
  }

  if (touched) {
    return 'border-success focus:border-success focus:ring-success/30';
  }

  return '';
}

/**
 * Helper for handling form validation errors with React Hook Form
 */
export function handleValidationError(
  error: FieldError | undefined,
  id: string
): {
  errorId: string;
  errorMessage: string | undefined;
  hasError: boolean;
  validationClasses: string;
} {
  const hasError = hasFieldError(error);
  const errorMessage = getErrorMessage(error);
  const errorId = `${id}-error`;
  const validationClasses = getValidationStateClasses(error);

  return {
    errorId,
    errorMessage,
    hasError,
    validationClasses,
  };
}

/**
 * Creates a validation result object for field components
 */
export function createValidationResult(
  id: string,
  error: FieldError | undefined,
  touched?: boolean
): {
  hasError: boolean;
  errorMessage: string | undefined;
  errorId: string;
  validationClasses: string;
  'aria-invalid': boolean;
  'aria-errormessage'?: string;
} {
  const hasError = hasFieldError(error);
  const errorMessage = getErrorMessage(error);
  const errorId = `${id}-error`;
  const validationClasses = getValidationStateClasses(error, touched);

  return {
    hasError,
    errorMessage,
    errorId,
    validationClasses,
    'aria-invalid': hasError,
    'aria-errormessage': hasError ? errorId : undefined,
  };
}

/**
 * Generic field validation function that can be used to validate any field type
 * based on common validation criteria
 */
export function validateField(value: unknown, validation?: FieldValidation): string | boolean {
  // Return true if no validation rules are provided
  if (!validation) return true;

  // Check if required but empty
  if (validation.required && (value === undefined || value === null || value === '')) {
    return typeof validation.required === 'boolean'
      ? 'This field is required'
      : 'This field is required'; // Always return the standard message for required fields
  }

  // Skip other validations if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return true;
  }

  // Validate string length
  if (typeof value === 'string') {
    if (validation.minLength && value.length < validation.minLength) {
      return `Minimum length is ${validation.minLength} characters`;
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      return `Maximum length is ${validation.maxLength} characters`;
    }

    // Validate pattern
    if (validation.pattern) {
      const pattern =
        typeof validation.pattern === 'string'
          ? new RegExp(validation.pattern)
          : validation.pattern;

      if (!pattern.test(value)) {
        return 'Value does not match the required pattern';
      }
    }
  }

  // Validate number range
  if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
    const numValue = typeof value === 'number' ? value : Number(value);

    if (validation.min !== undefined && numValue < validation.min) {
      return `Minimum value is ${validation.min}`;
    }

    if (validation.max !== undefined && numValue > validation.max) {
      return `Maximum value is ${validation.max}`;
    }
  }

  // Check field conditions if defined
  if (validation.conditions && validation.conditions.length > 0) {
    // Note: This would need the current form values to evaluate conditions
    // This is intended to be used with React Hook Form's validation context
    // Implementation would depend on how conditions are evaluated in the form context
  }

  // If all validations pass
  return true;
}

/**
 * Map validation utilities
 */

/**
 * Checks if a map entry at the given index has a duplicate key
 * @param entries - Array of map entries
 * @param currentIndex - Index of the entry to check
 * @returns true if the key at currentIndex is duplicated elsewhere in the array
 */
export function isDuplicateMapKey(entries: MapEntry[], currentIndex: number): boolean {
  if (!Array.isArray(entries) || entries.length <= 1) {
    return false;
  }

  const currentKeyValue = entries[currentIndex]?.key;

  // Don't consider empty keys as duplicates
  if (!currentKeyValue || currentKeyValue === '') {
    return false;
  }

  // Prefer strict equality to avoid cross-type false positives (e.g., 123 vs "123")
  // Treat empty string as non-duplicate as above.
  return entries.some((entry: MapEntry, i: number) => {
    if (i === currentIndex) return false;
    const key = entry?.key;
    if (key === '') return false;
    // If both are strings, compare strings
    if (typeof key === 'string' && typeof currentKeyValue === 'string') {
      return key === currentKeyValue;
    }
    // If both are numbers, compare numbers
    if (typeof key === 'number' && typeof currentKeyValue === 'number') {
      return Number.isNaN(key) ? Number.isNaN(currentKeyValue) : key === currentKeyValue;
    }
    // If both are booleans
    if (typeof key === 'boolean' && typeof currentKeyValue === 'boolean') {
      return key === currentKeyValue;
    }
    // For objects (including dates) fall back to reference equality
    if (
      typeof key === 'object' &&
      key !== null &&
      typeof currentKeyValue === 'object' &&
      currentKeyValue !== null
    ) {
      return key === currentKeyValue;
    }
    // Otherwise, consider different types as different keys
    return false;
  });
}

/**
 * Validates an array of map entries for duplicate keys
 * @param entries - Array of map entries to validate
 * @returns Validation error message if duplicates found, otherwise undefined
 */
export function validateMapEntries(entries: MapEntry[]): string | undefined {
  if (!Array.isArray(entries) || entries.length <= 1) {
    return undefined;
  }

  const keys = entries
    .map((entry) => entry?.key)
    .filter((key) => key !== undefined && key !== null && key !== '');

  const keyStrings = keys.map((key) => String(key));
  const uniqueKeyStrings = new Set(keyStrings);

  if (keyStrings.length !== uniqueKeyStrings.size) {
    return 'Duplicate keys are not allowed';
  }

  return undefined;
}
