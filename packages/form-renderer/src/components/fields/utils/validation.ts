/**
 * Validation and error handling utilities for form field components
 */
import { FieldError } from 'react-hook-form';

import { FieldValidation } from '../../../types/FormTypes';

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
