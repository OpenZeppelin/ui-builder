/**
 * Form Utilities
 *
 * Utilities for form field transformations, validation, and more.
 * These functions handle converting between UI and blockchain data formats.
 */
import type { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';
import {
  FieldTransforms,
  FieldType,
  FormFieldType,
  FormValues,
} from '@openzeppelin/contracts-ui-builder-types';

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
 * Creates a transform function based on field type
 *
 * @param fieldType The type of field to create transforms for
 * @param adapter Optional adapter for address validation
 * @returns Transform functions for the field type
 */
// TODO: Refine the return type of this function using conditional types
// to provide more specific FieldTransforms<T> based on the fieldType.
// For example, createTransformForFieldType('text') should ideally return FieldTransforms<string>.
// Currently, it returns FieldTransforms<unknown>, which is type-safe but loses specificity.
export function createTransformForFieldType(
  fieldType: FieldType,
  adapter?: ContractAdapter
): FieldTransforms<unknown> {
  switch (fieldType) {
    case 'blockchain-address':
      if (!adapter) {
        throw new Error(
          `createTransformForFieldType: Adapter is required for 'blockchain-address' field type but was not provided.`
        );
      }
      return createAddressTransform(adapter) as FieldTransforms<unknown>;
    case 'number':
    case 'amount':
      return createNumberTransform() as FieldTransforms<unknown>;
    case 'checkbox':
      return createBooleanTransform() as FieldTransforms<unknown>;
    case 'text':
    case 'email':
    case 'password':
    case 'textarea':
      return createTextTransform() as FieldTransforms<unknown>;
    case 'array':
      return createArrayTransform() as FieldTransforms<unknown>;
    case 'object':
      return createObjectTransform() as FieldTransforms<unknown>;
    case 'array-object':
      return createArrayObjectTransform() as FieldTransforms<unknown>;
    default:
      // For unhandled field types, log a warning and fallback to complex type (JSON) transform.
      // Ideally, all common ABI types should be mapped by the adapter to specific FieldTypes.
      console.warn(
        `createTransformForFieldType: No specific transform for fieldType "${fieldType as string}". Falling back to createComplexTypeTransform. Ensure adapter maps all expected ABI types to specific FieldTypes.`
      );
      return createComplexTypeTransform();
  }
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

/**
 * Returns the appropriate default value based on field type
 */
export function getDefaultValueByFieldType(fieldType: FieldType): string | boolean | number {
  switch (fieldType) {
    case 'checkbox':
      return false;
    case 'number':
      return '';
    default:
      return '';
  }
}

/**
 * Creates a complete default values object for form initialization
 * Ensures all fields have appropriate default values to avoid React controlled/uncontrolled input warnings
 *
 * @param fields The form field definitions
 * @param existingDefaults Any existing default values to preserve
 * @returns A complete form values object with no undefined values
 */
export function createDefaultFormValues(
  fields: FormFieldType[] | undefined,
  existingDefaults: Record<string, unknown> = {}
): FormValues {
  const defaults: FormValues = { ...existingDefaults };

  if (!fields) {
    return defaults;
  }

  fields.forEach((field) => {
    // Only set default if not already set
    if (defaults[field.name] === undefined) {
      defaults[field.name] = getDefaultValueByFieldType(field.type);
    }
  });

  return defaults;
}

/**
 * Creates a transform for array fields
 *
 * @returns Transform functions for array fields
 */
export function createArrayTransform(): FieldTransforms<unknown[]> {
  return {
    input: (value: unknown[]): string => {
      // Blockchain to UI: Convert array to JSON string.
      // The type system expects `value` to be `unknown[]` here.
      // A truly empty or uninitialized array state should be represented by an empty array `[]`.
      if (!Array.isArray(value)) {
        // This case should ideally not be hit if types are followed,
        // but as a safeguard, return empty array string.
        console.warn('createArrayTransform input received non-array value:', value);
        return '[]';
      }
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        // Handle potential stringify errors (e.g., circular refs, though less likely with unknown[])
        return '[]';
      }
    },
    output: (value: unknown): unknown[] => {
      // UI to Blockchain: Convert UI string (e.g., JSON) back to array
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return []; // Default to empty array on parse error
        }
      }
      // If it's already an array (e.g. from direct manipulation if not using string input), pass through
      return Array.isArray(value) ? value : [];
    },
  };
}

/**
 * Creates a transform for object fields
 *
 * @returns Transform functions for object fields
 */
export function createObjectTransform(): FieldTransforms<Record<string, unknown>> {
  return {
    input: (value: Record<string, unknown>): string => {
      // Blockchain to UI: Convert object to JSON string for display/editing
      // The type system expects `value` to be Record<string, unknown> here.
      // An empty or uninitialized object state should be represented by an empty object `{}`.
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        // This case should ideally not be hit if types are strictly followed.
        console.warn('createObjectTransform input received non-object or null value:', value);
        return '{}'; // Default to empty object string
      }
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '{}'; // Default to empty object string on error
      }
    },
    output: (value: unknown): Record<string, unknown> => {
      // UI to Blockchain: Convert UI string (e.g., JSON) back to object
      if (typeof value === 'string') {
        if (!value.trim()) return {}; // Handle empty string input from UI
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
          }
          return {}; // Parsed but not an object
        } catch {
          return {}; // Default to empty object on parse error
        }
      }
      // If it's already an object (e.g. from direct manipulation if not using string input), pass through
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }
      return {};
    },
  };
}

/**
 * Creates a transform for array-object fields
 *
 * @returns Transform functions for array-object fields
 */
export function createArrayObjectTransform(): FieldTransforms<Record<string, unknown>[]> {
  return {
    input: (value: Record<string, unknown>[]): string => {
      // Blockchain to UI: Convert array of objects to JSON string
      if (!Array.isArray(value)) {
        // This case should ideally not be hit if types are strictly followed.
        // However, if it occurs at runtime, log a warning and return default.
        console.warn('createArrayObjectTransform input received non-array value:', value);
        return '[]';
      }
      try {
        // Ensure all items are actual objects before stringifying
        const validItems = value.filter(
          (item) => item && typeof item === 'object' && !Array.isArray(item)
        );
        return JSON.stringify(validItems, null, 2);
      } catch {
        return '[]'; // Default to empty array string on error
      }
    },
    output: (value: unknown): Record<string, unknown>[] => {
      // UI to Blockchain: Convert UI string (JSON) back to array of objects
      if (typeof value === 'string') {
        if (!value.trim()) return []; // Handle empty string from UI
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.filter(
              (item): item is Record<string, unknown> =>
                item && typeof item === 'object' && !Array.isArray(item)
            );
          }
          return []; // Parsed but not an array
        } catch {
          return []; // Default to empty array on parse error
        }
      }
      // If it's already an array of objects (e.g. from direct manipulation)
      if (Array.isArray(value)) {
        return value.filter(
          (item): item is Record<string, unknown> =>
            item && typeof item === 'object' && !Array.isArray(item)
        );
      }
      return [];
    },
  };
}
