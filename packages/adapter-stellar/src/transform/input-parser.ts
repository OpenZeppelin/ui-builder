import { Address, nativeToScVal, xdr } from '@stellar/stellar-sdk';

import { detectBytesEncoding, logger } from '@openzeppelin/contracts-ui-builder-utils';

import { convertStellarTypeToScValType } from '../utils/formatting';
import {
  convertEnumToScVal,
  convertObjectToMap,
  convertObjectToScVal,
  convertTupleToScVal,
  getScValFromArg,
  getScValFromPrimitive,
  isComplexObjectArray,
  isEnumArgumentSet,
  isMapArray,
  isObjectWithTypedValues,
  isPrimitiveArgumentSet,
  isPrimitiveArray,
  isPrimitiveValue,
  isTupleArray,
} from '../utils/input-parsing';

const SYSTEM_LOG_TAG = 'StellarInputParser';

// ================================
// TYPE DEFINITIONS
// ================================

/**
 * Enhanced argument structure for complex Soroban contract calls.
 * Supports both simple form inputs and complex structures.
 */
export interface SorobanArgumentValue {
  value: string | number | boolean | SorobanArgumentValue | SorobanArgumentValue[];
  type: string;
}

export interface SorobanEnumValue {
  tag?: string;
  values?: SorobanArgumentValue[];
  enum?: string | number;
}

export interface SorobanMapEntry {
  '0': SorobanArgumentValue; // key
  '1': SorobanArgumentValue; // value
}

export type SorobanComplexValue =
  | SorobanArgumentValue
  | SorobanArgumentValue[]
  | SorobanArgumentValue[][]
  | SorobanEnumValue
  | SorobanMapEntry[]
  | SorobanMapEntry[][]
  | SorobanMapEntry
  | Record<string, SorobanArgumentValue>
  | Record<string, SorobanArgumentValue>[];

// ================================
// MAIN PARSING FUNCTIONS
// ================================

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
      logger.debug(SYSTEM_LOG_TAG, `Converting null/undefined value for type ${parameterType}`);
      return null;
    }

    logger.debug(SYSTEM_LOG_TAG, `Parsing input for type ${parameterType}:`, value);

    // Handle special cases first
    switch (true) {
      // Boolean: convert string "true"/"false" to actual boolean
      case parameterType === 'Bool':
        if (typeof value === 'boolean') {
          return value;
        }
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        throw new Error(`Boolean parameter expected, got ${typeof value}`);

      // Bytes: handle encoding detection
      case parameterType === 'Bytes' || /^BytesN<\d+>$/.test(parameterType):
        if (typeof value === 'string') {
          // Remove 0x prefix if present
          const cleanValue = value.startsWith('0x') ? value.slice(2) : value;
          const encoding = detectBytesEncoding(cleanValue);
          return new Uint8Array(Buffer.from(cleanValue, encoding));
        }
        throw new Error(`Bytes parameter must be a string, got ${typeof value}`);

      // Address: validate format
      case parameterType === 'Address':
        if (typeof value === 'string') {
          try {
            Address.fromString(value); // Validate format
            return value; // Return raw string - nativeToScVal will handle conversion
          } catch {
            throw new Error(`Invalid Stellar address format: ${value}`);
          }
        }
        throw new Error(`Address parameter must be a string, got ${typeof value}`);

      // String types: return as-is
      case parameterType === 'ScString' || parameterType === 'ScSymbol':
        if (typeof value === 'string') {
          return value;
        }
        throw new Error(`String parameter expected, got ${typeof value}`);

      // Numeric types: return raw values for nativeToScVal with type hints
      case /^[UI](32|64|128|256)$/.test(parameterType):
        if (typeof value === 'string') {
          // Validate it's a number
          const parsed = parameterType.startsWith('I') ? parseInt(value, 10) : parseInt(value, 10);
          if (isNaN(parsed)) {
            throw new Error(`Invalid number format for ${parameterType}: ${value}`);
          }
          return value; // Return raw string - let nativeToScVal handle conversion with type hints
        }
        if (typeof value === 'number') {
          return value.toString(); // Convert to string for consistency
        }
        throw new Error(`Numeric parameter expected for ${parameterType}, got ${typeof value}`);

      // Vec types: handle arrays
      case parameterType.startsWith('Vec<'):
        if (!Array.isArray(value)) {
          throw new Error(`Array expected for Vec type ${parameterType}, got ${typeof value}`);
        }

        // Extract the inner type (e.g., 'U128' from 'Vec<U128>')
        const innerTypeMatch = parameterType.match(/Vec<(.+)>$/);
        if (!innerTypeMatch) {
          throw new Error(`Could not parse Vec type: ${parameterType}`);
        }

        const innerType = innerTypeMatch[1];
        return value.map((item) => parseStellarInput(item, innerType));

      // Map types: handle key-value pairs
      case parameterType.startsWith('Map<'):
        if (!Array.isArray(value)) {
          throw new Error(`Array of key-value pairs expected for Map type, got ${typeof value}`);
        }
        return value;

      // Option types: handle optionals
      case parameterType.startsWith('Option<'):
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const optionInnerMatch = parameterType.match(/Option<(.+)>$/);
        if (!optionInnerMatch) {
          throw new Error(`Could not parse Option type: ${parameterType}`);
        }
        return parseStellarInput(value, optionInnerMatch[1]);

      // Custom types and structs: return as-is for nativeToScVal to handle
      default:
        if (typeof value === 'object' && value !== null) {
          logger.debug(
            SYSTEM_LOG_TAG,
            `Handling custom type ${parameterType}, returning value as-is:`,
            value
          );
          return value;
        }

        // For other types, try to return raw value with validation
        if (typeof value === 'string' || typeof value === 'number') {
          return value;
        }

        throw new Error(
          `Unsupported parameter type: ${parameterType} with value type ${typeof value}`
        );
    }
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to parse Stellar input:', error);
    throw error;
  }
}

/**
 * Converts a value to ScVal with proper type hints.
 * This should be used in the transaction execution instead of calling nativeToScVal directly.
 *
 * @param value - The parsed value from parseStellarInput
 * @param parameterType - The Stellar parameter type
 * @returns ScVal ready for contract calls
 */
export function valueToScVal(value: unknown, parameterType: string): xdr.ScVal {
  const scValType = convertStellarTypeToScValType(parameterType);

  // Handle special cases that don't need type hints
  if (parameterType === 'Bool' || parameterType === 'Bytes') {
    return nativeToScVal(value);
  }

  // For most types, use type hints
  return nativeToScVal(value, { type: scValType });
}

// ================================
// COMPLEX PARSING
// ================================

/**
 * Advanced ScVal generation from complex Soroban arguments.
 * Handles Maps, Enums, Tuples, and nested structures.
 *
 * @param args - Complex argument structure from advanced UI forms
 * @param scVals - Accumulator for generated ScVals (used for recursion)
 * @returns Array of ScVals ready for contract invocation
 */
export function getScValsFromArgs(
  args: Record<string, SorobanComplexValue> | SorobanComplexValue[],
  scVals: xdr.ScVal[] = []
): xdr.ScVal[] {
  logger.debug(SYSTEM_LOG_TAG, 'Processing arguments for ScVal conversion:', args);

  // Handle array input (multiple arguments)
  if (Array.isArray(args)) {
    return args.map((arg) => {
      if (typeof arg === 'object' && 'value' in arg && 'type' in arg) {
        return getScValFromPrimitive(arg as SorobanArgumentValue);
      }
      return getScValFromArg(arg, []);
    });
  }

  // Handle primitive case - all values have type and value
  if (isPrimitiveArgumentSet(args)) {
    const primitiveScVals = Object.values(args).map((v) => {
      return getScValFromPrimitive(v as SorobanArgumentValue);
    });

    logger.debug(SYSTEM_LOG_TAG, `Generated ${primitiveScVals.length} primitive ScVals`);
    return primitiveScVals;
  }

  // Handle enum case - values have tag or enum properties
  if (isEnumArgumentSet(args)) {
    const enumScVals = Object.values(args).map((v) => {
      return convertEnumToScVal(v as SorobanEnumValue, scVals);
    });

    logger.debug(SYSTEM_LOG_TAG, `Generated ${enumScVals.length} enum ScVals`);
    return enumScVals;
  }

  // Handle complex cases (maps, objects, arrays)
  for (const argKey in args) {
    const argValue = args[argKey];

    if (Array.isArray(argValue)) {
      // Map case - array of key-value pair objects
      if (isMapArray(argValue)) {
        const { mapVal, mapType } = convertObjectToMap(argValue as SorobanMapEntry[]);
        const mapScVal = nativeToScVal(mapVal, { type: mapType });
        scVals.push(mapScVal);
        continue;
      }

      // Vector case #1: array of complex objects or tuples
      if (isComplexObjectArray(argValue)) {
        const arrayScVals = argValue.map((v) => {
          // Use proper type guards to ensure safe casting
          if (typeof v === 'object' && v !== null && ('tag' in v || 'enum' in v)) {
            return convertEnumToScVal(v as SorobanEnumValue, scVals);
          }
          if (
            typeof v === 'object' &&
            v !== null &&
            !Array.isArray(v) &&
            !('0' in v) &&
            !('1' in v)
          ) {
            return convertObjectToScVal(v as Record<string, SorobanArgumentValue>);
          }
          // Fallback for other types
          return nativeToScVal(v);
        });

        const tupleScValsVec = xdr.ScVal.scvVec(arrayScVals);
        scVals.push(tupleScValsVec);
        continue;
      }

      // Vector case #2: array of primitives (homogeneous type)
      if (isPrimitiveArray(argValue)) {
        // TypeScript now knows argValue is SorobanArgumentValue[] thanks to type predicate
        const arrayScVals = argValue.reduce((acc: unknown[], v) => {
          const primitive = v as unknown as SorobanArgumentValue;
          if (primitive.type === 'bool') {
            acc.push(primitive.value === 'true' ? true : false);
          } else if (primitive.type === 'bytes') {
            const encoding = detectBytesEncoding(primitive.value as string);
            acc.push(new Uint8Array(Buffer.from(primitive.value as string, encoding)));
          } else {
            acc.push(primitive.value);
          }
          return acc;
        }, []);

        const firstItem = argValue[0];
        const scVal = nativeToScVal(arrayScVals, {
          type: convertStellarTypeToScValType(firstItem.type),
        });

        scVals.push(scVal);
        continue;
      }

      // Tuple case - mixed types in array
      if (isTupleArray(argValue)) {
        // TypeScript now knows argValue is SorobanArgumentValue[] thanks to type predicate
        const tupleScValsVec = convertTupleToScVal(argValue);
        scVals.push(tupleScValsVec);
        continue;
      }
    }

    // Object case - structured data
    if (isObjectWithTypedValues(argValue)) {
      const convertedObj = convertObjectToScVal(argValue as Record<string, SorobanArgumentValue>);
      scVals.push(convertedObj);
      continue;
    }

    // Single primitive value
    if (isPrimitiveValue(argValue)) {
      scVals.push(getScValFromPrimitive(argValue as SorobanArgumentValue));
    }
  }

  logger.debug(SYSTEM_LOG_TAG, `Generated ${scVals.length} total ScVals`);
  return scVals;
}
