/**
 * Data transform utilities for converting between UI and blockchain data formats
 */

import { ContractAdapter } from '../../adapters';
import { FieldTransforms, FieldType, FieldValue } from '../types/FormTypes';

/**
 * Creates a transform for address fields
 *
 * @param adapter The blockchain adapter to use for validation
 * @returns Transform functions for address fields
 */
export function createAddressTransform(adapter: ContractAdapter): FieldTransforms<string> {
  return {
    input: (value: unknown) => {
      if (value === null || value === undefined) return '';
      return String(value);
    },
    output: (value: unknown) => {
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
    input: (value: unknown) => {
      if (value === undefined || value === null) return '';
      return String(value);
    },
    output: (value: unknown) => {
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
    input: (value: unknown) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    },
    output: (value: unknown) => {
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
    input: (value: unknown) => {
      if (value === undefined || value === null) return '';
      if (typeof value === 'string') return value;

      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '';
      }
    },
    output: (value: unknown) => {
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
    input: (value: unknown) => {
      if (value === null || value === undefined) return '';
      return String(value);
    },
    output: (value: unknown) => {
      return String(value || '');
    },
  };
}

/**
 * Creates a transform for a specific field type
 *
 * @param fieldType The type of field
 * @param _blockchainType The blockchain parameter type (e.g., 'uint256', 'address', 'bool[]')
 *                        Not currently used, but preserved for future enhancements to support
 *                        specialized transforms based on blockchain type information
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
  // 'any' is necessary here because transforms can have different generic types
  // and we need to chain them together regardless of their specific input/output types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...transforms: Array<FieldTransforms<any>>
): FieldTransforms<T> {
  return {
    input: (value: T) => {
      let result: unknown = value;
      // Apply transforms in order for input (UI display)
      for (const transform of transforms) {
        if (transform.input) {
          // We need to use 'any' here because transforms can be of different types
          // and we need to chain them together regardless of their specific types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result = transform.input(result as any);
        }
      }
      return result;
    },
    output: (value: unknown) => {
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
  output?: (value: unknown) => unknown
): FieldTransforms<T> {
  return {
    input,
    output: output as ((value: unknown) => T) | undefined,
  };
}
