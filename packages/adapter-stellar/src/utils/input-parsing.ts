import { nativeToScVal, xdr } from '@stellar/stellar-sdk';

import { detectBytesEncoding, logger, stringToBytes } from '@openzeppelin/ui-utils';

// Import types for internal use
import type {
  SorobanArgumentValue,
  SorobanComplexValue,
  SorobanEnumValue,
  SorobanMapEntry,
} from '../transform/input-parser';
import { convertStellarTypeToScValType } from './formatting';
import { compareScValsByXdr } from './xdr-ordering';

const SYSTEM_LOG_TAG = 'StellarInputParsingUtils';

// Re-export types for convenience
export type {
  SorobanArgumentValue,
  SorobanEnumValue,
  SorobanMapEntry,
  SorobanComplexValue,
} from '../transform/input-parser';

// ================================
// TYPE GUARDS AND UTILITIES
// ================================

export function isPrimitiveArgumentSet(args: Record<string, SorobanComplexValue>): boolean {
  return Object.values(args).every(
    (v) => typeof v === 'object' && v !== null && 'type' in v && 'value' in v
  );
}

export function isEnumArgumentSet(args: Record<string, SorobanComplexValue>): boolean {
  return Object.values(args).some(
    (v) => typeof v === 'object' && v !== null && ('tag' in v || 'enum' in v)
  );
}

export function isMapArray(argValue: unknown[]): boolean {
  try {
    return (
      Array.isArray(argValue) &&
      argValue.every((obj: unknown) => {
        if (typeof obj !== 'object' || obj === null) return false;

        const keys = Object.keys(obj);
        if (keys.length !== 2 || !keys.includes('0') || !keys.includes('1')) {
          return false;
        }

        const keyEntry = (obj as Record<string, unknown>)['0'];
        return (
          typeof keyEntry === 'object' &&
          keyEntry !== null &&
          'value' in keyEntry &&
          'type' in keyEntry
        );
      })
    );
  } catch {
    return false;
  }
}

export function isComplexObjectArray(argValue: unknown[]): boolean {
  return argValue.some(
    (v) =>
      typeof v === 'object' &&
      v !== null &&
      typeof Object.values(v as Record<string, unknown>)[0] === 'object'
  );
}

export function isPrimitiveArray(argValue: unknown[]): argValue is SorobanArgumentValue[] {
  if (argValue.length === 0) return false;

  // Check if all items are SorobanArgumentValue (not SorobanMapEntry)
  const allArePrimitives = argValue.every(
    (v) =>
      typeof v === 'object' &&
      v !== null &&
      'value' in v &&
      'type' in v &&
      !('0' in v) && // Not a map entry
      !('1' in v) // Not a map entry
  );

  if (!allArePrimitives) return false;

  const firstItem = argValue[0] as SorobanArgumentValue;
  return argValue.every((v) => {
    const item = v as SorobanArgumentValue;
    return item.type === firstItem.type;
  });
}

export function isTupleArray(argValue: unknown[]): argValue is SorobanArgumentValue[] {
  return argValue.every(
    (v: unknown) =>
      typeof v === 'object' &&
      v !== null &&
      'type' in v &&
      'value' in v &&
      !('0' in v) && // Not a map entry
      !('1' in v) // Not a map entry
  );
}

export function isObjectWithTypedValues(argValue: SorobanComplexValue): boolean {
  return (
    typeof argValue === 'object' &&
    argValue !== null &&
    !Array.isArray(argValue) &&
    Object.values(argValue).every(
      (v: unknown) => typeof v === 'object' && v !== null && 'type' in v && 'value' in v
    )
  );
}

export function isPrimitiveValue(argValue: SorobanComplexValue): boolean {
  return (
    typeof argValue === 'object' && argValue !== null && 'type' in argValue && 'value' in argValue
  );
}

// ================================
// SCVAL CONVERSION UTILITIES
// ================================

export function getScValFromPrimitive(v: SorobanArgumentValue): xdr.ScVal {
  try {
    if (v.type === 'bool') {
      const boolValue = typeof v.value === 'boolean' ? v.value : v.value === 'true';
      return nativeToScVal(boolValue);
    }

    if (v.type === 'bytes') {
      const stringValue = v.value as string;
      const encoding = detectBytesEncoding(stringValue);
      return nativeToScVal(stringToBytes(stringValue, encoding));
    }

    // Use our improved type conversion utility
    const typeHint = convertStellarTypeToScValType(v.type);
    return nativeToScVal(v.value, { type: typeHint });
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, `Failed to convert primitive ${v.type}:`, error);
    throw new Error(`Failed to convert primitive value of type ${v.type}: ${error}`);
  }
}

export function getScValFromArg(arg: SorobanComplexValue, scVals: xdr.ScVal[]): xdr.ScVal {
  // Handle array of arrays with numeric objects (nested structures)
  if (Array.isArray(arg) && arg.length > 0) {
    const arrayScVals = arg.map((subArray) => {
      if (Array.isArray(subArray) && isMapArray(subArray)) {
        const { mapVal, mapType } = convertObjectToMap(subArray as SorobanMapEntry[]);

        // Better map key-value pair handling
        const items = Object.keys(mapVal);
        if (items.length > 1) {
          items.forEach((item) => {
            const mapScVal = nativeToScVal(mapVal[item], {
              type: mapType[item],
            });
            scVals.push(mapScVal);
          });
        }

        return nativeToScVal(mapVal, { type: mapType });
      }
      return getScValFromArg(subArray as SorobanComplexValue, scVals);
    });

    return xdr.ScVal.scvVec(arrayScVals);
  }

  // For single values, handle based on type
  if (typeof arg === 'object' && arg !== null && 'type' in arg && 'value' in arg) {
    return getScValFromPrimitive(arg as SorobanArgumentValue);
  }

  // Fallback to nativeToScVal for simple values
  return nativeToScVal(arg);
}

export function convertEnumToScVal(obj: SorobanEnumValue, scVals?: xdr.ScVal[]): xdr.ScVal {
  try {
    // Integer variant - has enum property (keep as-is for integer enums)
    if (obj.enum !== undefined) {
      const enumScVal = nativeToScVal(obj.enum, { type: 'u32' });
      return enumScVal;
    }

    if (!obj.tag) {
      throw new Error('Enum object must have either "tag" or "enum" property');
    }

    // Use Vector format with Symbol for variant names (as per Soroban documentation)
    // Unit variants: ScVec containing single ScSymbol
    // Tuple variants: ScVec with ScSymbol + payload elements
    const tagSymbol = nativeToScVal(obj.tag, { type: 'symbol' });

    if (!obj.values || obj.values.length === 0) {
      // Unit variant - ScVec containing single ScSymbol
      const unitVec = xdr.ScVal.scvVec([tagSymbol]);
      return unitVec;
    }

    // Tuple variant - ScVec with ScSymbol + payload elements
    const valuesVal = obj.values.map((v) => getScValFromArg(v, scVals || []));
    const tupleVec = xdr.ScVal.scvVec([tagSymbol, ...valuesVal]);
    return tupleVec;
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to convert enum:', error);
    throw new Error(`Failed to convert enum: ${error}`);
  }
}

export function convertValuesToScVals(
  values: SorobanArgumentValue[],
  scVals: xdr.ScVal[]
): xdr.ScVal[] {
  return values.map((v) => getScValFromArg(v, scVals));
}

export function convertObjectToScVal(obj: Record<string, SorobanArgumentValue>): xdr.ScVal {
  try {
    const convertedValue: Record<string, unknown> = {};
    const typeHints: Record<string, string | string[]> = {};

    // Process each field in the object
    for (const key in obj) {
      const field = obj[key];

      if (field.type === 'bool') {
        convertedValue[key] =
          typeof field.value === 'boolean' ? field.value : field.value === 'true';
        typeHints[key] = ['symbol']; // Key is always symbol, value type varies
      } else {
        convertedValue[key] = field.value;
        const fieldTypeHint = convertStellarTypeToScValType(field.type);
        typeHints[key] = [
          'symbol',
          ...(Array.isArray(fieldTypeHint) ? fieldTypeHint : [fieldTypeHint]),
        ];
      }
    }

    return nativeToScVal(convertedValue, { type: typeHints });
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to convert object:', error);
    throw new Error(`Failed to convert object to ScVal: ${error}`);
  }
}

export function convertObjectToMap(mapArray: SorobanMapEntry[]): {
  mapVal: Record<string, unknown>;
  mapType: Record<string, string | string[]>;
} {
  try {
    const sortedEntries = [...mapArray].sort((a, b) => {
      const aKey = getScValFromPrimitive(a['0'] as SorobanArgumentValue);
      const bKey = getScValFromPrimitive(b['0'] as SorobanArgumentValue);
      return compareScValsByXdr(aKey, bKey);
    });

    const mapVal = sortedEntries.reduce((acc: Record<string, unknown>, pair) => {
      const key = String(pair['0'].value);

      if (Array.isArray(pair['1'])) {
        // Handle nested array values
        const valueScVal = getScValFromArg(pair['1'], []);
        acc[key] = valueScVal;
      } else {
        // Handle primitive values
        const value = pair['1'].value;
        if (pair['1'].type === 'bool') {
          if (typeof value === 'boolean') {
            acc[key] = value;
          } else if (typeof value === 'string') {
            acc[key] = value === 'true';
          } else {
            acc[key] = Boolean(value);
          }
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {});

    const mapType = sortedEntries.reduce((acc: Record<string, string[]>, pair) => {
      const key = String(pair['0'].value);
      const keyTypeHint = convertStellarTypeToScValType(pair['0'].type);
      const valueTypeHint = convertStellarTypeToScValType(pair['1'].type);
      acc[key] = [
        ...(Array.isArray(keyTypeHint) ? keyTypeHint : [keyTypeHint]),
        ...(Array.isArray(valueTypeHint) ? valueTypeHint : [valueTypeHint]),
      ];
      return acc;
    }, {});

    return { mapVal, mapType };
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to convert map:', error);
    throw new Error(`Failed to convert map: ${error}`);
  }
}

export function convertTupleToScVal(tupleArray: SorobanArgumentValue[]): xdr.ScVal {
  try {
    const tupleScVals = tupleArray.map((v) => {
      if (v.type === 'bool') {
        const boolValue = typeof v.value === 'boolean' ? v.value : v.value === 'true';
        return nativeToScVal(boolValue);
      }

      if (v.type === 'bytes') {
        const encoding = detectBytesEncoding(v.value as string);
        return nativeToScVal(stringToBytes(v.value as string, encoding));
      }

      const typeHint = convertStellarTypeToScValType(v.type);
      return nativeToScVal(v.value, { type: typeHint });
    });

    // JS SDK's nativeToScVal doesn't support mixed-type arrays, so use xdr.ScVal.scvVec
    return xdr.ScVal.scvVec(tupleScVals);
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to convert tuple:', error);
    throw new Error(`Failed to convert tuple: ${error}`);
  }
}
