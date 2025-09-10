import type { FieldType, FieldValue } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Get a default value for a field type.
 * This is a chain-agnostic utility that provides appropriate default values
 * based on the UI field type.
 *
 * @param fieldType - The UI field type
 * @returns The appropriate default value for that field type
 */
export function getDefaultValueForType<T extends FieldType>(fieldType: T): FieldValue<T> {
  switch (fieldType) {
    case 'checkbox':
      return false as FieldValue<T>;
    case 'number':
    case 'amount':
      return 0 as FieldValue<T>;
    case 'array':
      return [] as FieldValue<T>;
    case 'object':
      return {} as FieldValue<T>;
    case 'array-object':
      return [] as FieldValue<T>;
    case 'map':
      return [] as FieldValue<T>; // Empty array of key-value pairs
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
      return '' as FieldValue<T>;
  }
}
