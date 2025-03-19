/**
 * Form Utilities
 *
 * TEMPORARY PLACEHOLDER IMPLEMENTATIONS
 * These functions are placeholders that will be replaced with:
 * 1. Imports from existing utility functions (preferred)
 * 2. Properly aligned implementations that match existing behavior
 * 3. Implementations that integrate with the application's validation system
 *
 * TODO: [CLEANUP] This file contains placeholder implementations that should be:
 * - Either replaced with imports from core utilities
 * - Or made the canonical implementation that core imports from
 * This decision should be made as part of a larger architecture review of the monorepo structure.
 */

/**
 * Generate a unique ID for form fields
 *
 * TODO: Replace with or align with the existing generateId utility in the main codebase
 * This is a simplified placeholder implementation
 */
export function generateId(): string {
  return `field-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate a field value against validation rules
 *
 * TODO: Replace with proper validation system that integrates with:
 * 1. React Hook Form validators
 * 2. The existing validation patterns in the application
 * 3. Support for all validation scenarios used in the main app
 *
 * This is a simplified placeholder implementation that does not represent
 * the full validation capabilities needed
 */
export function validateField(
  value: unknown,
  validation?: { required?: boolean; min?: number; max?: number; pattern?: string }
): string | null {
  if (validation?.required && (value === '' || value === null || value === undefined)) {
    return 'This field is required';
  }

  if (validation?.min !== undefined && typeof value === 'number' && value < validation.min) {
    return `Value must be at least ${validation.min}`;
  }

  if (validation?.max !== undefined && typeof value === 'number' && value > validation.max) {
    return `Value must be at most ${validation.max}`;
  }

  if (
    validation?.pattern !== undefined &&
    typeof value === 'string' &&
    new RegExp(validation.pattern).test(value) === false
  ) {
    return 'Value does not match the required pattern';
  }

  return null;
}
