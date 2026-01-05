import { isEnumValue } from '@openzeppelin/ui-types';
import { isPlainObject, logger } from '@openzeppelin/ui-utils';

import { isLikelyEnumType } from '../../utils/type-detection';
import { isGenericType, parseGeneric } from './generic-parser';
import { isPrimitiveType, parsePrimitive } from './primitive-parser';

// Re-export types for backward compatibility
export type {
  SorobanArgumentValue,
  SorobanEnumValue,
  SorobanMapEntry,
  SorobanComplexValue,
} from './types';

// Re-export specific functions for backward compatibility
export { getScValsFromArgs } from './complex-parser';
export { valueToScVal } from './scval-converter';

const SYSTEM_LOG_TAG = 'StellarInputParser';

/**
 * Parses form input values for Stellar/Soroban contracts.
 * Handles both simple UI form inputs and complex structures.
 *
 * @param value - The input value from the form
 * @param parameterType - The Stellar parameter type (e.g., 'Address', 'U128', 'Vec<U32>')
 * @returns The parsed value suitable for nativeToScVal conversion
 */
export function parseStellarInput(value: unknown, parameterType: string): unknown {
  try {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return null;
    }

    // Try primitive types first (most common)
    if (isPrimitiveType(parameterType)) {
      const result = parsePrimitive(value, parameterType);
      if (result !== null) {
        return result;
      }
    }

    // Try generic types (Vec, Map, Option, Result)
    if (isGenericType(parameterType)) {
      const result = parseGeneric(value, parameterType, parseStellarInput);
      // For generic types, we always return the result (including null for Option<T> with empty/null values)
      return result;
    }

    // Handle remaining custom types and special cases
    // Check if this is an enum type and transform from chain-agnostic to Soroban format
    if (isEnumValue(value) && isLikelyEnumType(parameterType)) {
      // Chain-agnostic enum format: { tag: "VariantName", values?: [...] }
      // Return the chain-agnostic enum value as-is
      // The Stellar-specific transformation will happen in valueToScVal
      return value;
    }

    // Check if this is a struct type (object with primitive fields)
    if (isPlainObject(value)) {
      // For structs, we need to recursively process each field
      // But since we don't have field type information here, we'll pass it through
      // and handle the conversion in valueToScVal where we have access to contract schema
      return value;
    }

    // Accept array-shaped values for struct-like types (e.g., tuple structs with numeric keys).
    // RHF treats numeric path segments as arrays, so a struct with fields "0", "1" can arrive as an array.
    // Pass through; valueToScVal/convertStructToScVal will serialize correctly using the schema.
    if (Array.isArray(value)) {
      return value;
    }

    // For other types, try to return raw value with validation
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    throw new Error(`Unsupported parameter type: ${parameterType} with value type ${typeof value}`);
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to parse Stellar input:', error);
    throw error;
  }
}
