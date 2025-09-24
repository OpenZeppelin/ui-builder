import { nativeToScVal, xdr } from '@stellar/stellar-sdk';

import { isEnumValue, type FunctionParameter } from '@openzeppelin/ui-builder-types';

import { convertStellarTypeToScValType } from '../../utils/formatting';
import { convertEnumToScVal } from '../../utils/input-parsing';
import { isBytesNType } from '../../utils/type-detection';
import { parseGenericType } from './generic-parser';
import { parsePrimitive } from './primitive-parser';
import { convertStructToScVal, isStructType } from './struct-parser';
import type { SorobanEnumValue } from './types';

/**
 * Converts a value to ScVal with comprehensive generic type support.
 * This should be used in the transaction execution instead of calling nativeToScVal directly.
 *
 * @param value - The parsed value from parseStellarInput
 * @param parameterType - The Stellar parameter type
 * @param paramSchema - Optional parameter schema with struct field definitions
 * @param parseInnerValue - Function to recursively parse inner values (defaults to parseStellarInput)
 * @returns ScVal ready for contract calls
 */
export function valueToScVal(
  value: unknown,
  parameterType: string,
  paramSchema?: FunctionParameter,
  parseInnerValue?: (val: unknown, type: string) => unknown
): xdr.ScVal {
  // Default parseInnerValue to a basic pass-through function if not provided
  // This handles the common case where callers don't need recursive parsing
  const parseValue = parseInnerValue || ((val: unknown) => val);
  const genericInfo = parseGenericType(parameterType);

  if (!genericInfo) {
    // Check if this is an enum object (has 'tag' or 'enum' property)
    if (isEnumValue(value) || (typeof value === 'object' && value !== null && 'enum' in value)) {
      return convertEnumToScVal(value as SorobanEnumValue);
    }

    // Check if this is a struct type
    if (isStructType(value, parameterType)) {
      return convertStructToScVal(
        value as Record<string, unknown>,
        parameterType,
        paramSchema,
        parseValue
      );
    }

    // Non-generic types - use existing logic
    if (parameterType === 'Bool' || parameterType === 'Bytes') {
      return nativeToScVal(value);
    }
    if (isBytesNType(parameterType)) {
      const match = parameterType.match(/^BytesN<(\d+)>$/);
      if (!match) {
        throw new Error(`Invalid BytesN parameterType format: ${parameterType}`);
      }
      const expectedBytes = Number.parseInt(match[1], 10);
      const decoded = parsePrimitive(value, 'Bytes');
      const bytesValue = decoded instanceof Uint8Array ? decoded : (decoded ?? value);

      if (
        Number.isFinite(expectedBytes) &&
        bytesValue instanceof Uint8Array &&
        bytesValue.length !== expectedBytes
      ) {
        throw new Error(
          `BytesN value must be exactly ${expectedBytes} bytes, received ${bytesValue.length}`
        );
      }

      return nativeToScVal(bytesValue);
    }
    const scValType = convertStellarTypeToScValType(parameterType);
    const typeHint = Array.isArray(scValType) ? scValType[0] : scValType;
    return nativeToScVal(value, { type: typeHint });
  }

  const { baseType, parameters } = genericInfo;

  switch (baseType) {
    case 'Vec': {
      // Handle Vec<T> types
      const innerType = parameters[0];
      if (Array.isArray(value)) {
        const convertedElements = value.map((element) => valueToScVal(element, innerType));
        return nativeToScVal(convertedElements);
      }
      return nativeToScVal(value);
    }

    case 'Map': {
      // Handle Map<K,V> types in Stellar SDK format
      if (Array.isArray(value)) {
        // Expect Stellar SDK format: [{ 0: {value, type}, 1: {value, type} }, ...]
        const convertedValue: Record<string, unknown> = {};
        const typeHints: Record<string, string[]> = {};

        value.forEach(
          (entry: { 0: { value: string; type: string }; 1: { value: string; type: string } }) => {
            if (
              typeof entry !== 'object' ||
              entry === null ||
              !entry[0] ||
              !entry[1] ||
              typeof entry[0].value === 'undefined' ||
              typeof entry[1].value === 'undefined'
            ) {
              throw new Error('Invalid Stellar SDK map format in valueToScVal');
            }

            // Process key and value through parsePrimitive for bytes conversion
            // This ensures bytes strings are converted to Uint8Array before nativeToScVal
            let processedKey: unknown = entry[0].value;
            let processedValue: unknown = entry[1].value;

            // Handle bytes conversion for keys
            const keyPrimitive = parsePrimitive(entry[0].value, entry[0].type);
            if (keyPrimitive !== null) {
              processedKey = keyPrimitive;
            }

            // Handle bytes conversion for values
            const valuePrimitive = parsePrimitive(entry[1].value, entry[1].type);
            if (valuePrimitive !== null) {
              processedValue = valuePrimitive;
            }

            // Use the processed key as the object key (convert to string if needed)
            const keyString =
              typeof processedKey === 'string' ? processedKey : String(processedKey);
            convertedValue[keyString] = processedValue;

            const keyScValType = convertStellarTypeToScValType(entry[0].type);
            const valueScValType = convertStellarTypeToScValType(entry[1].type);
            typeHints[keyString] = [
              Array.isArray(keyScValType) ? keyScValType[0] : keyScValType,
              Array.isArray(valueScValType) ? valueScValType[0] : valueScValType,
            ];
          }
        );

        return nativeToScVal(convertedValue, { type: typeHints });
      }

      return nativeToScVal(value);
    }

    case 'Option': {
      // Handle Option<T> types
      const innerType = parameters[0];

      if (value === null || value === undefined) {
        return nativeToScVal(null); // None variant
      } else {
        // Some variant - convert the inner value
        return valueToScVal(value, innerType);
      }
    }

    case 'Result': {
      // Handle Result<T,E> types
      const okType = parameters[0];
      const errType = parameters[1];

      // Result types typically come as {ok: value} or {err: error}
      if (typeof value === 'object' && value !== null) {
        const resultObj = value as Record<string, unknown>;
        if ('ok' in resultObj) {
          const okScVal = valueToScVal(resultObj.ok, okType);
          return nativeToScVal({ ok: okScVal });
        } else if ('err' in resultObj) {
          const errScVal = valueToScVal(resultObj.err, errType);
          return nativeToScVal({ err: errScVal });
        }
      }
      return nativeToScVal(value);
    }

    default: {
      // Unknown generic type - fallback to basic conversion
      const scValType = convertStellarTypeToScValType(parameterType);
      const typeHint = Array.isArray(scValType) ? scValType[0] : scValType;
      return nativeToScVal(value, { type: typeHint });
    }
  }
}
