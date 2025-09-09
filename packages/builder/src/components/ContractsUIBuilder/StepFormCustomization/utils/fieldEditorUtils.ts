import { FormFieldType } from '@openzeppelin/contracts-ui-builder-types';
import { getDefaultValueForType } from '@openzeppelin/contracts-ui-builder-utils';

import { FieldEditorFormValues } from '../types';

/**
 * Get appropriate default value for array/map element based on element type
 */
function getArrayElementDefault(field: FormFieldType): unknown {
  return field.elementFieldConfig?.defaultValue !== undefined
    ? field.elementFieldConfig.defaultValue
    : field.elementType === 'number' || field.elementType === 'amount'
      ? 0
      : field.elementType === 'checkbox'
        ? false
        : ''; // Default for text, address, etc.
}

/**
 * Get appropriate default value for map value based on value field config
 */
function getMapValueDefault(field: FormFieldType): unknown {
  const valueConfig = field.mapMetadata?.valueFieldConfig;
  if (!valueConfig) return '';
  if (valueConfig.defaultValue !== undefined) return valueConfig.defaultValue;
  return valueConfig.type === 'number' || valueConfig.type === 'amount'
    ? 0
    : valueConfig.type === 'checkbox'
      ? false
      : '';
}

/**
 * Clean up corrupted array/map hardcoded values that might have objects instead of proper element values
 */
function cleanupCollectionHardcodedValue(field: FormFieldType, value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }

  // Maps expect an array of { key, value } objects. Preserve objects and coerce legacy shapes.
  if (field.type === 'map' && field.mapMetadata) {
    const valueDefault = getMapValueDefault(field);

    return value.map((item) => {
      if (
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        'key' in (item as Record<string, unknown>)
      ) {
        return item as unknown;
      }
      if (Array.isArray(item)) {
        const [k, v] = item as unknown[];
        return { key: k, value: v ?? valueDefault } as unknown;
      }
      return { key: item as unknown, value: valueDefault } as unknown;
    });
  }

  // Arrays should not contain objects; replace objects with element defaults
  if (field.type === 'array') {
    const elementDefault = getArrayElementDefault(field);

    // Check if array/map contains objects when it should contain primitives
    const hasCorruptedObjects = value.some(
      (item) => typeof item === 'object' && item !== null && !Array.isArray(item)
    );

    if (hasCorruptedObjects) {
      // Replace corrupted objects with proper element defaults
      return value.map((item) =>
        typeof item === 'object' && item !== null && !Array.isArray(item) ? elementDefault : item
      );
    }
  }

  return value as unknown[];
}

/**
 * Centralized coercion of a field's hardcoded value into the proper shape for its type.
 * Ensures cross-field switches never leak incompatible shapes (e.g., map array into a string field).
 */
export function coerceHardcodedValue(field: FormFieldType, raw: unknown): unknown {
  // If value is undefined, leave it as undefined (caller decides defaults)
  if (raw === undefined) return undefined;

  switch (field.type) {
    case 'array':
    case 'map':
      return cleanupCollectionHardcodedValue(field, raw);
    case 'object':
      return typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    case 'array-object':
      return Array.isArray(raw) ? raw : [];
    case 'number':
    case 'amount':
      return typeof raw === 'number' ? raw : 0;
    case 'checkbox':
      return typeof raw === 'boolean' ? raw : false;
    case 'blockchain-address':
    case 'text':
    case 'textarea':
    case 'bytes':
    case 'email':
    case 'password':
    case 'select':
    case 'radio':
    case 'date':
    case 'hidden':
    default:
      return typeof raw === 'string' ? raw : '';
  }
}

/**
 * Initializes form values from a FormFieldType
 */
export function initializeFormValues(field: FormFieldType): FieldEditorFormValues {
  // Start from field snapshot
  let hardcodedValue: unknown = field.hardcodedValue;

  if (hardcodedValue !== undefined) {
    // Coerce any stored value into the current field type's shape
    hardcodedValue = coerceHardcodedValue(field, hardcodedValue);
  } else if (field.isHardcoded) {
    // If marked hardcoded but without a stored value, derive a default per type
    hardcodedValue = getDefaultValueForType(field.type);
    // For collection types prefer empty collection over element defaults
    if (field.type === 'array' || field.type === 'map' || field.type === 'array-object') {
      hardcodedValue = [];
    }
    if (field.type === 'object') {
      hardcodedValue = {};
    }
  }

  return {
    // Copy all existing properties from the field
    ...field,
    // Ensure hardcodedValue is properly initialized based on field type
    hardcodedValue,
    // Initialize validation object if not present
    validation: field.validation || { required: false },
    // Ensure boolean flags are properly initialized
    readOnly: field.readOnly ?? false,
    isHidden: field.isHidden ?? false,
    isHardcoded: field.isHardcoded ?? false,
  };
}
