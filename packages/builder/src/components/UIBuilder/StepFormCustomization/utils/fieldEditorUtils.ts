import { FormFieldType, isEnumValue } from '@openzeppelin/ui-builder-types';
import { getDefaultValueForType } from '@openzeppelin/ui-builder-utils';

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
 * Coerce object and array-object type values
 */
function coerceObjectValue(field: FormFieldType, raw: unknown): unknown {
  if (field.type === 'object') {
    return typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  }
  if (field.type === 'array-object') {
    return Array.isArray(raw) ? raw : [];
  }
  return raw;
}

/**
 * Coerce primitive type values (number, amount, checkbox)
 */
function coercePrimitiveValue(field: FormFieldType, raw: unknown): unknown {
  switch (field.type) {
    case 'number':
    case 'amount':
      return typeof raw === 'number' ? raw : 0;
    case 'checkbox':
      return typeof raw === 'boolean' ? raw : false;
    default:
      return raw;
  }
}

/**
 * Coerce string-based type values
 */
function coerceStringValue(raw: unknown): string {
  return typeof raw === 'string' ? raw : '';
}

/**
 * Clean up and coerce enum hardcoded values to proper EnumValue format
 */
function coerceEnumHardcodedValue(field: FormFieldType, raw: unknown): unknown {
  // Preserve valid EnumValue objects
  if (isEnumValue(raw)) {
    return raw;
  }

  // If not a valid EnumValue, return a basic enum value with the first variant
  // This handles cases where enum values were corrupted or stored as strings
  if (field.enumMetadata && field.enumMetadata.variants.length > 0) {
    const firstVariant = field.enumMetadata.variants[0];
    return {
      tag: firstVariant.name,
      ...(firstVariant.type !== 'void' && { values: [] }),
    };
  }

  // Fallback for enums without metadata
  return { tag: '', values: [] };
}

/**
 * Centralized coercion of a field's hardcoded value into the proper shape for its type.
 * Ensures cross-field switches never leak incompatible shapes (e.g., map array into a string field).
 *
 * This function delegates to specialized coercion functions based on field type categories:
 * - Collection types (array, map) → `cleanupCollectionHardcodedValue`
 * - Object types (object, array-object) → `coerceObjectValue`
 * - Primitive types (number, amount, checkbox) → `coercePrimitiveValue`
 * - Enum types → `coerceEnumHardcodedValue`
 * - String-based types → `coerceStringValue`
 *
 * This function is critical for handling scenarios where users change a field's type in the UI builder
 * after setting a hardcoded value. Without proper coercion, we could end up with type mismatches like:
 * - A map array `[{key: 'x', value: 'y'}]` in a text field (should become empty string)
 * - A string value `"hello"` in a number field (should become 0)
 * - An object `{foo: 'bar'}` in an array field (should become empty array)
 *
 * @param field - The target field configuration containing type and metadata
 * @param raw - The raw value that needs to be coerced (may be incompatible with field type)
 * @returns The coerced value that matches the field's expected type shape
 *
 * ## Coercion Rules by Field Type:
 *
 * **Collection Types:**
 * - `array`: Ensures array format, replaces corrupted objects with element defaults
 * - `map`: Ensures array of `{key, value}` objects, handles legacy [key, value] tuple format
 * - `array-object`: Ensures array format, defaults to empty array `[]`
 * - `object`: Ensures object format, defaults to empty object `{}`
 *
 * **Primitive Types:**
 * - `number`/`amount`: Ensures numeric value, defaults to `0`
 * - `checkbox`: Ensures boolean value, defaults to `false`
 *
 * **Complex Types:**
 * - `enum`: Ensures proper `EnumValue` format with `{tag, values?}`, uses first variant as default
 *
 * **String-based Types:**
 * - `text`, `textarea`, `bytes`, `email`, `password`, `url`, `date`, etc.
 * - All coerced to string format, default to empty string `""`
 * - `blockchain-address`: Special string type for addresses, defaults to `""`
 * - `select`, `radio`, `select-grouped`: Option-based fields, defaults to `""`
 * - `code-editor`: Code content field, defaults to `""`
 * - `hidden`: Hidden form field, defaults to `""`
 *
 * ## Common Use Cases:
 * 1. **Field Type Changes**: User switches from "Array" to "Text" - array gets coerced to `""`
 * 2. **Import/Export**: Imported configs might have mismatched value types
 * 3. **Legacy Data**: Older saved configurations with different value formats
 * 4. **Cross-Chain Adaptation**: Different adapters might have different value expectations
 */
export function coerceHardcodedValue(field: FormFieldType, raw: unknown): unknown {
  // If value is undefined, leave it as undefined (caller decides defaults)
  if (raw === undefined) return undefined;

  // Handle collection types (array, map)
  if (field.type === 'array' || field.type === 'map') {
    return cleanupCollectionHardcodedValue(field, raw);
  }

  // Handle object types (object, array-object)
  if (field.type === 'object' || field.type === 'array-object') {
    return coerceObjectValue(field, raw);
  }

  // Handle primitive types (number, amount, checkbox)
  if (field.type === 'number' || field.type === 'amount' || field.type === 'checkbox') {
    return coercePrimitiveValue(field, raw);
  }

  // Handle enum types
  if (field.type === 'enum') {
    return coerceEnumHardcodedValue(field, raw);
  }

  // Handle all string-based types
  return coerceStringValue(raw);
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
    // For enum types, provide a proper EnumValue default
    if (field.type === 'enum' && field.enumMetadata && field.enumMetadata.variants.length > 0) {
      const firstVariant = field.enumMetadata.variants[0];
      hardcodedValue = {
        tag: firstVariant.name,
        ...(firstVariant.type !== 'void' && { values: [] }),
      };
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
