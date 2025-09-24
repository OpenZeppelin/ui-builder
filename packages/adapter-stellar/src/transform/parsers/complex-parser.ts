import { nativeToScVal, xdr } from '@stellar/stellar-sdk';

import { detectBytesEncoding, stringToBytes } from '@openzeppelin/ui-builder-utils';

import { convertStellarTypeToScValType } from '../../utils/formatting';
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
} from '../../utils/input-parsing';
import type {
  SorobanArgumentValue,
  SorobanComplexValue,
  SorobanEnumValue,
  SorobanMapEntry,
} from './types';

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

    return primitiveScVals;
  }

  // Handle enum case - values have tag or enum properties
  if (isEnumArgumentSet(args)) {
    const enumScVals = Object.values(args).map((v) => {
      return convertEnumToScVal(v as SorobanEnumValue, scVals);
    });

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
            acc.push(stringToBytes(primitive.value as string, encoding));
          } else {
            acc.push(primitive.value);
          }
          return acc;
        }, []);

        const firstItem = argValue[0];
        const scValType = convertStellarTypeToScValType(firstItem.type);
        const typeHint = Array.isArray(scValType) ? scValType[0] : scValType;
        const scVal = nativeToScVal(arrayScVals, {
          type: typeHint,
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

  return scVals;
}
