import { nativeToScVal, xdr } from '@stellar/stellar-sdk';

import { isEnumValue, type FunctionParameter } from '@openzeppelin/ui-types';
import { isPlainObject, logger } from '@openzeppelin/ui-utils';

import { convertStellarTypeToScValType } from '../../utils/formatting';
import { isLikelyEnumType } from '../../utils/type-detection';
import { compareScValsByXdr } from '../../utils/xdr-ordering';
import { parseGenericType } from './generic-parser';

const SYSTEM_LOG_TAG = 'StructParser';

function isTupleStructSchema(schema: FunctionParameter | undefined): boolean {
  if (!schema?.components || schema.components.length === 0) {
    return false;
  }

  return schema.components.every((component, index) => component.name === index.toString());
}

/**
 * Determines if a field value needs parsing through parseStellarInput.
 * Returns false for already-processed values (like Uint8Array for bytes).
 */
function needsParsing(value: unknown, fieldType: string): boolean {
  // Skip parsing for already-processed Uint8Array values for bytes types
  if ((fieldType === 'Bytes' || fieldType.startsWith('BytesN<')) && value instanceof Uint8Array) {
    return false;
  }

  // For Vec types, check if it's already an array of properly typed values
  if (fieldType.startsWith('Vec<')) {
    if (!Array.isArray(value)) {
      return true; // Needs parsing if not an array
    }

    // Extract inner type to check array elements
    const innerTypeMatch = fieldType.match(/Vec<(.+)>$/);
    if (innerTypeMatch) {
      // If all elements are already properly typed, skip parsing
      // For now, let's always parse Vec types to ensure validation
      return true;
    }
  }

  // For Map types, always parse to convert UI MapEntry format to Stellar SDK format
  if (fieldType.startsWith('Map<')) {
    return true; // Map data needs conversion from UI format to Stellar SDK format
  }

  // For primitive types, parse if value is string (form input)
  if (typeof value === 'string') {
    return true;
  }

  // For complex objects, they might need recursive parsing
  if (isPlainObject(value)) {
    return true;
  }

  // For other cases, skip parsing (assume already processed)
  return false;
}

/**
 * Converts a struct object to ScVal using Laboratory pattern with schema-based type resolution.
 *
 * @param structObj - The plain object representing the struct
 * @param parameterType - The Stellar parameter type (for error messages)
 * @param paramSchema - Parameter schema with struct field definitions (required)
 * @param parseInnerValue - Function to recursively parse inner values
 * @param convertToScVal - Optional function to recursively convert values to ScVal (for tuple structs)
 * @returns ScVal ready for contract calls
 * @throws Error if schema information is missing for any field
 */
export function convertStructToScVal(
  structObj: Record<string, unknown>,
  parameterType: string,
  paramSchema: FunctionParameter | undefined,
  parseInnerValue: (val: unknown, type: string) => unknown,
  convertToScVal?: (
    value: unknown,
    type: string,
    schema?: FunctionParameter,
    parseValue?: (val: unknown, type: string) => unknown
  ) => xdr.ScVal
): xdr.ScVal {
  // Laboratory-style struct conversion with proper type hint handling

  // Check if this is a tuple struct (numeric field names like "0", "1", "2")
  // Tuple structs in Soroban need to be serialized as vectors, not maps
  if (isTupleStructSchema(paramSchema) && paramSchema && convertToScVal) {
    const tupleValues = paramSchema.components!.map((component, index) => {
      const key = component.name ?? index.toString();
      let elementValue = structObj[key];

      if (typeof elementValue === 'undefined') {
        throw new Error(
          `Missing tuple value for "${key}" in struct type "${parameterType}". Received: ${JSON.stringify(structObj)}`
        );
      }

      // If the element is a string and its type is likely an enum, wrap it as { tag: value }
      if (typeof elementValue === 'string' && isLikelyEnumType(component.type)) {
        elementValue = { tag: elementValue };
      }

      return convertToScVal(elementValue, component.type, component, parseInnerValue);
    });

    return xdr.ScVal.scvVec(tupleValues);
  }

  // Struct conversion using Laboratory pattern with schema-based type resolution
  // See: laboratory/src/helpers/sorobanUtils.ts convertObjectToScVal
  const convertedValue: Record<string, unknown> = {};
  const typeHints: Record<string, unknown> = {};

  // For structs with Vec/Map fields, ensure proper parsing but use nativeToScVal approach

  // Laboratory pattern: preserve raw values, provide type hints as arrays
  // Type hints format: [keyType, valueType] where keyType is always "symbol"
  for (const [fieldName, fieldValue] of Object.entries(structObj)) {
    // Use schema information for accurate type mapping
    let fieldType: string | undefined;
    if (paramSchema?.components) {
      const fieldSchema = paramSchema.components.find(
        (comp: FunctionParameter) => comp.name === fieldName
      );
      fieldType = fieldSchema?.type;
    }

    if (fieldType) {
      // Parse the field value using the correct type to ensure validation and conversion
      // Only parse if the value appears to be raw form input (strings/primitives)
      // Skip parsing for already-processed values (like Uint8Array for bytes)
      let parsedValue: unknown;

      if (needsParsing(fieldValue, fieldType)) {
        parsedValue = parseInnerValue(fieldValue, fieldType);
      } else {
        parsedValue = fieldValue;
      }

      if (typeof parsedValue === 'string' && isLikelyEnumType(fieldType)) {
        parsedValue = { tag: parsedValue };
      }

      // Handle Map fields specially - convert from SDK format to plain object with type hints
      if (fieldType.startsWith('Map<') && Array.isArray(parsedValue)) {
        // Extract key and value types
        const mapTypeMatch = fieldType.match(/Map<(.+),\s*(.+)>$/);
        const mapKeyType = mapTypeMatch ? mapTypeMatch[1] : 'ScSymbol';
        const mapValueType = mapTypeMatch ? mapTypeMatch[2] : 'Bytes';

        // parsedValue is in Stellar SDK format: [{0: {value, type}, 1: {value, type}}, ...]
        // Convert to plain object for nativeToScVal
        const mapObject: Record<string, unknown> = {};
        const mapTypeHints: Record<string, string[]> = {};

        (
          parsedValue as Array<{
            0: { value: unknown; type: string };
            1: { value: unknown; type: string };
          }>
        ).forEach((entry) => {
          // Parse the key and value
          const processedKey = parseInnerValue(entry[0].value, entry[0].type || mapKeyType);
          const processedVal = parseInnerValue(entry[1].value, entry[1].type || mapValueType);

          const keyString = typeof processedKey === 'string' ? processedKey : String(processedKey);
          mapObject[keyString] = processedVal;

          // Set type hints for each entry using the actual types
          const keyScValType = convertStellarTypeToScValType(entry[0].type || mapKeyType);
          const valueScValType = convertStellarTypeToScValType(entry[1].type || mapValueType);

          // Laboratory pattern: [keyType, valueType] for each map entry
          mapTypeHints[keyString] = [
            Array.isArray(keyScValType)
              ? keyScValType[0]
              : keyScValType === 'map-special'
                ? 'symbol'
                : keyScValType,
            Array.isArray(valueScValType)
              ? valueScValType[0]
              : valueScValType === 'map-special'
                ? 'bytes'
                : valueScValType,
          ];
        });

        convertedValue[fieldName] = mapObject;
        // Provide nested type hints for Map field (Laboratory pattern)
        typeHints[fieldName] = ['symbol', mapTypeHints];
      } else {
        // Check if this is a Vec or other generic type that needs special handling
        if (convertToScVal && (fieldType.startsWith('Vec<') || isEnumValue(parsedValue))) {
          const fieldSchema = paramSchema?.components?.find((c) => c.name === fieldName);
          // Use valueToScVal for Vec and enum fields to ensure proper conversion
          convertedValue[fieldName] = convertToScVal(
            parsedValue,
            fieldType,
            fieldSchema,
            parseInnerValue
          );
          typeHints[fieldName] = ['symbol', 'scval'];
        } else {
          convertedValue[fieldName] = parsedValue;

          // Use exact type from schema for non-Map fields
          const scValType = convertStellarTypeToScValType(fieldType);
          if (scValType !== 'map-special') {
            typeHints[fieldName] = ['symbol', Array.isArray(scValType) ? scValType[0] : scValType];
          }
        }
      }
    } else {
      // Schema is required for struct field type resolution
      throw new Error(
        `Missing schema information for struct field "${fieldName}" in struct type "${parameterType}". ` +
          `Schema-based type resolution is required for accurate ScVal conversion.`
      );
    }
  }

  logger.debug(SYSTEM_LOG_TAG, 'convertStructToScVal final values:', {
    parameterType,
    convertedValue,
    typeHints,
  });

  // Check if any fields are enums that need special conversion
  const hasEnumFields = paramSchema?.components?.some((comp) => {
    const fieldValue = convertedValue[comp.name];
    return isEnumValue(fieldValue);
  });

  let scVal: xdr.ScVal;

  if (hasEnumFields && convertToScVal && paramSchema?.components) {
    // Manually build the ScMap with proper enum conversion
    const mapEntries: xdr.ScMapEntry[] = [];

    for (const fieldSchema of paramSchema.components) {
      const fieldName = fieldSchema.name;
      const fieldValue = convertedValue[fieldName];

      // Create key
      const keyScVal = nativeToScVal(fieldName, { type: 'symbol' });

      // Create value - check if it's an enum
      let valueScVal: xdr.ScVal;
      if (isEnumValue(fieldValue)) {
        valueScVal = convertToScVal(fieldValue, fieldSchema.type, fieldSchema, parseInnerValue);
      } else {
        // Use nativeToScVal for non-enum fields
        const fieldTypeHint = typeHints[fieldName];
        if (fieldTypeHint && Array.isArray(fieldTypeHint) && fieldTypeHint.length > 1) {
          valueScVal = nativeToScVal(fieldValue, { type: fieldTypeHint[1] });
        } else {
          valueScVal = nativeToScVal(fieldValue);
        }
      }

      mapEntries.push(
        new xdr.ScMapEntry({
          key: keyScVal,
          val: valueScVal,
        })
      );
    }

    // Sort map entries by XDR-encoded keys (required by Soroban)
    const sortedMapEntries = mapEntries.sort((a, b) => compareScValsByXdr(a.key(), b.key()));

    scVal = xdr.ScVal.scvMap(sortedMapEntries);
  } else {
    scVal = nativeToScVal(convertedValue, { type: typeHints });
  }

  logger.debug(SYSTEM_LOG_TAG, 'convertStructToScVal generated ScVal:', {
    parameterType,
    scValType: scVal.switch().name,
    scValValue: scVal.value(),
  });

  return scVal;
}

/**
 * Checks if the given value and type represent a struct that can be handled by this parser.
 *
 * @param value - The value to check
 * @param parameterType - The Stellar parameter type
 * @returns True if this is a struct type
 */
export function isStructType(value: unknown, parameterType: string): boolean {
  // Check if this is a struct type (object that doesn't match enum pattern or generic pattern)
  // Exclude special object types like Uint8Array, Date, etc.
  if (!isPlainObject(value)) {
    return false;
  }

  // Skip if it's a generic type
  const genericInfo = parseGenericType(parameterType);
  if (genericInfo) {
    return false;
  }

  // Skip if it looks like an enum (has 'tag', 'enum', or 'values' properties)
  const obj = value as Record<string, unknown>;
  if ('tag' in obj || 'enum' in obj || 'values' in obj) {
    return false;
  }

  // Check if it's a plain object with simple constructor
  return (
    !(value instanceof Uint8Array) &&
    !(value instanceof Date) &&
    typeof value.constructor === 'function' &&
    value.constructor === Object
  );
}
