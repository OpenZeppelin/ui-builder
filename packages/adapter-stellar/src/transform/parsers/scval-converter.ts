import { nativeToScVal, xdr } from '@stellar/stellar-sdk';

import { isEnumValue, type FunctionParameter } from '@openzeppelin/ui-builder-types';

import { convertStellarTypeToScValType } from '../../utils/formatting';
import { convertEnumToScVal } from '../../utils/input-parsing';
import { isPrimitiveParamType } from '../../utils/stellar-types';
import { isBytesNType, isLikelyEnumType } from '../../utils/type-detection';
import { compareScValsByXdr } from '../../utils/xdr-ordering';
import { parseGenericType } from './generic-parser';
import { parsePrimitive } from './primitive-parser';
import { convertStructToScVal, isStructType } from './struct-parser';
import type { SorobanEnumValue } from './types';

type EnumAwareFunctionParameter = FunctionParameter & {
  enumMetadata?: {
    name: string;
    variants: Array<{
      name: string;
      type: 'void' | 'tuple' | 'integer';
      payloadTypes?: string[];
      payloadComponents?: (FunctionParameter[] | undefined)[];
      value?: number;
      isSingleTuplePayload?: boolean;
    }>;
    isUnitOnly: boolean;
  };
};

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

  // Helper: detect SorobanArgumentValue wrapper { type, value }
  const isTypedWrapper = (v: unknown): v is { type: string; value: unknown } =>
    !!v &&
    typeof v === 'object' &&
    'type' in (v as Record<string, unknown>) &&
    'value' in (v as Record<string, unknown>);

  const enumMetadata = (paramSchema as EnumAwareFunctionParameter | undefined)?.enumMetadata;
  const possibleEnumValue =
    typeof value === 'string' && (enumMetadata || isLikelyEnumType(parameterType))
      ? { tag: value }
      : value;

  if (!genericInfo) {
    // Integer-only enums (discriminant enums) → encode as u32 (matches Lab behavior)
    if (enumMetadata && enumMetadata.variants.every((v) => v.type === 'integer')) {
      // Derive numeric discriminant from name, tag, or numeric input
      let numericValue: number | undefined;
      if (typeof value === 'string') {
        const byName = enumMetadata.variants.find((v) => v.name === value);
        numericValue = byName?.value ?? Number(value);
      } else if (typeof value === 'number') {
        numericValue = value;
      } else if (isEnumValue(value)) {
        const byTag = enumMetadata.variants.find((v) => v.name === value.tag);
        numericValue = byTag?.value;
      }
      if (numericValue === undefined || Number.isNaN(numericValue)) {
        throw new Error(`Invalid integer enum value for ${parameterType}: ${String(value)}`);
      }
      return nativeToScVal(numericValue, { type: 'u32' });
    }
    // If a typed wrapper is provided, convert directly using the wrapped type/value
    if (isTypedWrapper(possibleEnumValue)) {
      const wrapped = possibleEnumValue;
      const parsed = parsePrimitive(wrapped.value, wrapped.type);
      const finalVal = parsed !== null ? parsed : wrapped.value;
      const scValType = convertStellarTypeToScValType(wrapped.type);
      const typeHint = Array.isArray(scValType) ? scValType[0] : scValType;
      return nativeToScVal(finalVal, { type: typeHint });
    }

    // Check if this is an enum object (has 'tag' or 'enum' property)
    if (
      isEnumValue(possibleEnumValue) ||
      (typeof possibleEnumValue === 'object' &&
        possibleEnumValue !== null &&
        'enum' in possibleEnumValue)
    ) {
      const enumValue = possibleEnumValue as { tag: string; values?: unknown[]; enum?: number };

      // Handle integer enums
      if ('enum' in enumValue && typeof enumValue.enum === 'number') {
        return nativeToScVal(enumValue.enum, { type: 'u32' });
      }

      // Handle tagged enums with metadata for proper type conversion
      const tagSymbol = nativeToScVal(enumValue.tag, { type: 'symbol' });

      if (!enumValue.values || enumValue.values.length === 0) {
        // Unit variant - ScVec containing single ScSymbol
        return xdr.ScVal.scvVec([tagSymbol]);
      }

      const payloadValues = enumValue.values as unknown[];

      // Tuple variant - convert each payload value with proper types
      let payloadScVals: xdr.ScVal[];
      let variant:
        | {
            name: string;
            type: string;
            payloadTypes?: string[];
            payloadComponents?: (FunctionParameter[] | undefined)[];
            isSingleTuplePayload?: boolean;
          }
        | undefined;

      if (enumMetadata) {
        variant = enumMetadata.variants.find((variantEntry) => variantEntry.name === enumValue.tag);
        if (!variant || !variant.payloadTypes) {
          // No variant metadata or payloadTypes - use convertEnumToScVal fallback
          return convertEnumToScVal(enumValue as SorobanEnumValue);
        }
        // Convert each payload value with its corresponding type
        payloadScVals = variant.payloadTypes.map((payloadType, index) => {
          const payloadSchema = variant!.payloadComponents?.[index]
            ? {
                name: `payload_${index}`,
                type: payloadType,
                components: variant!.payloadComponents[index],
              }
            : { name: `payload_${index}`, type: payloadType };

          const val = payloadValues[index];
          return valueToScVal(val, payloadType, payloadSchema, parseValue);
        });
      } else {
        // No enum metadata - use convertEnumToScVal fallback
        return convertEnumToScVal(enumValue as SorobanEnumValue);
      }

      // For single Tuple payload, wrap all payload ScVals in another ScVec
      // Example: Some((Address, i128)) → ScVec([Symbol("Some"), ScVec([Address, I128])])
      if (variant?.isSingleTuplePayload) {
        const tuplePayloadVec = xdr.ScVal.scvVec(payloadScVals);
        return xdr.ScVal.scvVec([tagSymbol, tuplePayloadVec]);
      }

      // Return ScVec with tag symbol followed by payload values
      return xdr.ScVal.scvVec([tagSymbol, ...payloadScVals]);
    }

    // Check if this is a struct or tuple type
    // Accept array-shaped values for tuple-structs when schema components are provided
    if (
      Array.isArray(possibleEnumValue) &&
      paramSchema?.components &&
      paramSchema.components.length
    ) {
      // Runtime validation: ensure array length matches schema components
      if (possibleEnumValue.length !== paramSchema.components.length) {
        throw new Error(
          `Tuple-struct value length (${possibleEnumValue.length}) does not match schema components (${paramSchema.components.length}) for type ${parameterType}`
        );
      }
      return convertStructToScVal(
        possibleEnumValue as unknown as Record<string, unknown>,
        parameterType,
        paramSchema,
        parseValue,
        (innerValue, innerType, innerSchema) =>
          valueToScVal(innerValue, innerType, innerSchema, parseInnerValue)
      );
    }

    if (!isPrimitiveParamType(parameterType) && isStructType(value, parameterType)) {
      return convertStructToScVal(
        value as Record<string, unknown>,
        parameterType,
        paramSchema,
        parseValue,
        (innerValue, innerType, innerSchema) =>
          valueToScVal(innerValue, innerType, innerSchema, parseInnerValue)
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
        // For enum element types, we need to pass enum metadata
        // Check if paramSchema has enumMetadata or components that should be used for elements
        let elementSchema: FunctionParameter | undefined;
        if (enumMetadata) {
          // This Vec is of enum type - pass the enum metadata to each element
          elementSchema = {
            name: 'element',
            type: innerType,
            enumMetadata,
          } as EnumAwareFunctionParameter;
        } else if (paramSchema?.components) {
          // This Vec is of struct type - pass the components to each element
          elementSchema = {
            name: 'element',
            type: innerType,
            components: paramSchema.components,
          };
        }

        const convertedElements = value.map((element) =>
          valueToScVal(element, innerType, elementSchema, parseValue)
        );
        return nativeToScVal(convertedElements);
      }
      return nativeToScVal(value);
    }

    case 'Map': {
      // Handle Map<K,V> types in Stellar SDK format
      if (Array.isArray(value)) {
        // Expect Stellar SDK format: [{ 0: {value, type}, 1: {value, type} }, ...]
        const mapEntries: xdr.ScMapEntry[] = [];

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

            // Create ScVals for key and value
            const keyScValType = convertStellarTypeToScValType(entry[0].type);
            const keyTypeHint = Array.isArray(keyScValType) ? keyScValType[0] : keyScValType;
            const keyScVal = nativeToScVal(processedKey, { type: keyTypeHint });

            const valueScValType = convertStellarTypeToScValType(entry[1].type);
            const valueTypeHint = Array.isArray(valueScValType)
              ? valueScValType[0]
              : valueScValType;
            const valueScVal = nativeToScVal(processedValue, { type: valueTypeHint });

            mapEntries.push(
              new xdr.ScMapEntry({
                key: keyScVal,
                val: valueScVal,
              })
            );
          }
        );

        // Sort map entries by XDR-encoded keys (required by Soroban)
        const sortedMapEntries = mapEntries.sort((a, b) => compareScValsByXdr(a.key(), b.key()));
        return xdr.ScVal.scvMap(sortedMapEntries);
      }

      return nativeToScVal(value);
    }

    case 'Tuple': {
      if (!paramSchema?.components || paramSchema.components.length === 0) {
        throw new Error(
          `Tuple parameter "${paramSchema?.name ?? 'unknown'}" is missing component metadata`
        );
      }

      const tupleComponents = paramSchema.components;
      const tupleValues: xdr.ScVal[] = [];

      tupleComponents.forEach((component, index) => {
        const key = component.name ?? `item_${index}`;
        let elementValue: unknown;

        if (Array.isArray(value)) {
          elementValue = value[index];
        } else if (value && typeof value === 'object') {
          elementValue = (value as Record<string, unknown>)[key];
        }

        if (typeof elementValue === 'undefined') {
          throw new Error(
            `Missing tuple value for "${key}" in parameter "${paramSchema.name ?? 'unknown'}"`
          );
        }

        if (typeof elementValue === 'string' && isLikelyEnumType(component.type)) {
          elementValue = { tag: elementValue };
        }

        tupleValues.push(valueToScVal(elementValue, component.type, component, parseInnerValue));
      });

      return xdr.ScVal.scvVec(tupleValues);
    }

    case 'Option': {
      // Handle Option<T> types
      const innerType = parameters[0];

      if (value === null || value === undefined) {
        return nativeToScVal(null); // None variant
      } else {
        // Some variant - convert the inner value
        let innerSchema: FunctionParameter | undefined;
        if (enumMetadata) {
          innerSchema = {
            name: 'inner',
            type: innerType,
            ...({ enumMetadata } as unknown as Record<string, unknown>),
          } as unknown as FunctionParameter;
        } else if (paramSchema?.components) {
          innerSchema = {
            name: 'inner',
            type: innerType,
            components: paramSchema.components,
          };
        }
        return valueToScVal(value, innerType, innerSchema, parseInnerValue);
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
