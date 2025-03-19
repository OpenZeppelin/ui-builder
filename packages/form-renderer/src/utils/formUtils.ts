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

import { ContractAdapter, FieldTransforms, FieldType, FieldValue } from '../types/FormTypes';

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

/**
 * Form utility functions for the form renderer
 */

/**
 * Creates a transform for address fields
 *
 * @param adapter The blockchain adapter to use for validation
 * @returns Transform functions for address fields
 */
export function createAddressTransform(adapter: ContractAdapter): FieldTransforms<string> {
  return {
    input: (value: unknown): string => {
      if (value === null || value === undefined) return '';
      return String(value);
    },
    output: (value: unknown): string => {
      const address = String(value || '');
      if (adapter.isValidAddress?.(address)) {
        return address;
      }
      return '';
    },
  };
}

/**
 * Creates a transform for number fields
 *
 * @returns Transform functions for number fields
 */
export function createNumberTransform(): FieldTransforms<number> {
  return {
    input: (value: unknown): string => {
      if (value === undefined || value === null) return '';
      return String(value);
    },
    output: (value: unknown): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    },
  };
}

/**
 * Creates a transform for boolean fields
 *
 * @returns Transform functions for boolean fields
 */
export function createBooleanTransform(): FieldTransforms<boolean> {
  return {
    input: (value: unknown): boolean => {
      return Boolean(value);
    },
    output: (value: unknown): boolean => {
      return Boolean(value);
    },
  };
}

/**
 * Creates a transform for text fields
 *
 * @returns Transform functions for text fields
 */
export function createTextTransform(): FieldTransforms<string> {
  return {
    input: (value: unknown): string => {
      if (value === null || value === undefined) return '';
      return String(value);
    },
    output: (value: unknown): string => {
      return String(value || '');
    },
  };
}

/**
 * Creates a transform for the given field type
 *
 * @param fieldType The type of field to create a transform for
 * @param adapter The adapter to use for validation (required for address fields)
 * @returns Transform functions for the field type
 */
export function createTransformForFieldType<T extends FieldType>(
  fieldType: T,
  adapter: ContractAdapter
): FieldTransforms<FieldValue<T>> {
  // We need to use type assertion to handle the complex conditional types
  switch (fieldType) {
    case 'address':
      // For 'address', we know FieldValue<'address'> is string
      return createAddressTransform(adapter) as unknown as FieldTransforms<FieldValue<T>>;
    case 'number':
    case 'amount':
      // For 'number'/'amount', we know FieldValue<'number'|'amount'> is number
      return createNumberTransform() as unknown as FieldTransforms<FieldValue<T>>;
    case 'checkbox':
      // For 'checkbox', we know FieldValue<'checkbox'> is boolean
      return createBooleanTransform() as unknown as FieldTransforms<FieldValue<T>>;
    case 'text':
    case 'textarea':
    case 'email':
    case 'password':
    case 'select':
    case 'radio':
      // For text-based fields, we know FieldValue is string
      return createTextTransform() as unknown as FieldTransforms<FieldValue<T>>;
    default:
      // For other types, return an empty transform
      return {} as FieldTransforms<FieldValue<T>>;
  }
}

/**
 * Composes multiple transforms into a single transform
 *
 * @param transforms The transforms to compose
 * @returns A single transform that applies all transforms in sequence
 */
export function composeTransforms<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...transforms: Array<FieldTransforms<any>>
): FieldTransforms<T> {
  return {
    input: (value: T): unknown => {
      return transforms.reduce((result, transform) => {
        return transform.input ? transform.input(result) : result;
      }, value as unknown);
    },
    output: (value: unknown): T => {
      return transforms.reduceRight((result, transform) => {
        return transform.output ? transform.output(result) : result;
      }, value) as T;
    },
  };
}

/**
 * Creates a custom transform with the given input and output functions
 *
 * @param input Function to transform data from blockchain format to UI format
 * @param output Function to transform data from UI format to blockchain format
 * @returns A custom transform with the given functions
 */
export function createCustomTransform<T>(
  input?: (value: T) => unknown,
  output?: (value: unknown) => T
): FieldTransforms<T> {
  return {
    input,
    output,
  };
}
