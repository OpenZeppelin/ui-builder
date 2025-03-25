/**
 * Form Utilities
 *
 * Utilities for form field transformations, validation, and more.
 * These functions handle converting between UI and blockchain data formats.
 */

import { ContractAdapter, FieldTransforms, FieldType, FieldValue } from '../types/FormTypes';

/**
 * Parameter constraints for validation and default value generation
 */
export interface ParameterConstraints {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Generate a unique ID for form fields
 */
export function generateId(): string {
  return `field-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate a field value against validation rules
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
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    },
    output: (value: unknown): boolean => {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    },
  };
}

/**
 * Creates a transform for complex type fields (arrays, objects, etc.)
 *
 * @returns Transform functions for complex fields
 */
export function createComplexTypeTransform(): FieldTransforms<unknown> {
  return {
    input: (value: unknown): string => {
      if (value === undefined || value === null) return '';
      if (typeof value === 'string') return value;

      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '';
      }
    },
    output: (value: unknown): unknown => {
      if (typeof value !== 'string' || !value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    },
  };
}

/**
 * Creates a transform for text fields
 *
 * @returns Transform functions for text-based fields
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
 * Creates a transform for a specific field type
 *
 * @param fieldType The type of field
 * @param _blockchainType The blockchain parameter type (e.g., 'uint256', 'address', 'bool[]')
 *                        Used for specialized transforms based on blockchain type information
 * @param adapter The blockchain adapter
 * @returns Transform functions for the field type
 */
export function createTransformForFieldType<T extends FieldType>(
  fieldType: T,
  _blockchainType: string,
  adapter: ContractAdapter
): FieldTransforms<FieldValue<T>> {
  // Implementation with a type-safe approach using run-time checking
  switch (fieldType) {
    case 'address':
      return createAddressTransform(adapter) as unknown as FieldTransforms<FieldValue<T>>;
    case 'number':
    case 'amount':
      return createNumberTransform() as unknown as FieldTransforms<FieldValue<T>>;
    case 'checkbox':
      return createBooleanTransform() as unknown as FieldTransforms<FieldValue<T>>;
    case 'textarea':
      return createComplexTypeTransform() as unknown as FieldTransforms<FieldValue<T>>;
    case 'text':
    case 'select':
    case 'radio':
    case 'email':
    case 'password':
    default:
      return createTextTransform() as unknown as FieldTransforms<FieldValue<T>>;
  }
}

/**
 * Composes multiple transforms into a single transform
 *
 * @param transforms Array of transforms to compose
 * @returns A composed transform
 */
export function composeTransforms<T>(
  // Transforms can have different generic types, but we use unknown as a more type-safe alternative to any
  ...transforms: Array<FieldTransforms<unknown>>
): FieldTransforms<T> {
  return {
    input: (value: T): unknown => {
      let result: unknown = value;
      // Apply transforms in order for input (UI display)
      for (const transform of transforms) {
        if (transform.input) {
          // We need to cast to unknown here because transforms can be of different types
          result = transform.input(result);
        }
      }
      return result;
    },
    output: (value: unknown): T => {
      let result = value;
      // Apply transforms in reverse order for output (blockchain submission)
      for (const transform of [...transforms].reverse()) {
        if (transform.output) {
          result = transform.output(result);

          // Special handling for NaN values
          if (typeof result === 'number' && isNaN(result)) {
            return 0 as unknown as T;
          }
        }
      }
      return result as T;
    },
  };
}

/**
 * Creates a custom transform with specific input and output functions
 *
 * @param inputFn Function to transform from blockchain to UI
 * @param outputFn Function to transform from UI to blockchain
 * @returns A custom transform
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

/**
 * Generate a default value for a given field type based on parameter constraints
 */
export function generateDefaultValue(
  parameterType: string,
  constraints: Partial<ParameterConstraints> = {}
): unknown {
  const type = parameterType.toLowerCase();

  // Basic default values based on type
  if (type.includes('bool')) {
    return false;
  } else if (type.includes('int') || type.includes('number')) {
    return constraints.min !== undefined ? constraints.min : 0;
  } else if (type.includes('string') || type.includes('address')) {
    return '';
  } else if (type.includes('array') || type.includes('[]')) {
    return [];
  } else {
    return null;
  }
}
