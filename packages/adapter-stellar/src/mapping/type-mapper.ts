import type { FieldType } from '@openzeppelin/contracts-ui-builder-types';

import { isLikelyEnumType } from '../utils/type-detection';
import { STELLAR_TYPE_TO_FIELD_TYPE } from './constants';

/**
 * Map a Stellar-specific parameter type to a default form field type.
 * @param parameterType The Stellar parameter type (e.g., 'U128', 'Address', 'Vec<U32>')
 * @returns The appropriate default form field type (e.g., 'number', 'blockchain-address', 'array')
 */
export function mapStellarParameterTypeToFieldType(parameterType: string): FieldType {
  // Debug logging to identify completely unmapped types (not generics or handled cases)
  if (
    !STELLAR_TYPE_TO_FIELD_TYPE[parameterType] &&
    !parameterType.startsWith('Vec<') &&
    !parameterType.startsWith('Map<') &&
    !parameterType.startsWith('BytesN<') &&
    !parameterType.includes('<') &&
    parameterType !== 'Vec' &&
    parameterType !== 'Map' &&
    parameterType !== 'unknown'
  ) {
    console.warn(
      `[mapStellarParameterTypeToFieldType] No mapping found for type: "${parameterType}"`
    );
  }

  // Check if this is a Vec of custom/complex types (e.g., Vec<CustomStruct>)
  const vecComplexMatch = parameterType.match(/^Vec<([^>]+)>$/);
  if (vecComplexMatch) {
    const innerType = vecComplexMatch[1];
    // If inner type is not a primitive, treat as array of objects
    if (!STELLAR_TYPE_TO_FIELD_TYPE[innerType]) {
      return 'array-object';
    }
    return 'array';
  }

  // Check if this is a simple Vec type
  if (parameterType === 'Vec' || parameterType.startsWith('Vec<')) {
    return 'array';
  }

  // Check if this is a Map type
  if (parameterType === 'Map' || parameterType.startsWith('Map<')) {
    return 'map' as FieldType;
  }

  // Extract base type for generic types (e.g., Option<U32> -> U32)
  const genericMatch = parameterType.match(/^(\w+)<(.+)>$/);
  if (genericMatch) {
    const baseType = genericMatch[1];
    // For Option and Result types, use the inner type
    if (baseType === 'Option' || baseType === 'Result') {
      const innerType = genericMatch[2];
      return mapStellarParameterTypeToFieldType(innerType);
    }
  }

  // Map known Stellar/Soroban types to appropriate field types
  const mappedType = STELLAR_TYPE_TO_FIELD_TYPE[parameterType];
  if (mappedType) {
    return mappedType;
  }

  // Handle BytesN types (fixed-size byte arrays like BytesN<32> for hashes)
  if (parameterType.startsWith('BytesN<')) {
    return 'textarea'; // Users input as hex strings
  }

  // Handle custom types (structs, enums) - default to object unless it's clearly an enum
  if (isLikelyEnumType(parameterType)) {
    return 'select';
  }

  // Check if this looks like a custom struct (capitalized name and not a known primitive)
  if (parameterType[0] && parameterType[0] === parameterType[0].toUpperCase()) {
    // Check if it's not a known Stellar primitive type that starts with uppercase
    const knownUppercaseTypes = [
      'U32',
      'U64',
      'U128',
      'U256',
      'I32',
      'I64',
      'I128',
      'I256',
      'Bool',
      'Bytes',
    ];
    if (
      !knownUppercaseTypes.includes(parameterType) &&
      !parameterType.startsWith('Vec') &&
      !parameterType.startsWith('Map') &&
      !parameterType.includes('Unknown')
    ) {
      // Don't treat Unknown* as structs
      return 'object';
    }
  }

  // Final fallback to text for truly unknown types
  return 'text';
}

/**
 * Get field types compatible with a specific parameter type.
 * @param parameterType The Stellar parameter type.
 * @returns Array of compatible form field types.
 */
export function getStellarCompatibleFieldTypes(parameterType: string): FieldType[] {
  // Handle Vec of complex types
  const vecComplexMatch = parameterType.match(/^Vec<([^>]+)>$/);
  if (vecComplexMatch) {
    const innerType = vecComplexMatch[1];
    if (!STELLAR_TYPE_TO_FIELD_TYPE[innerType]) {
      return ['array-object', 'textarea', 'text'];
    }
    return ['array', 'textarea', 'text'];
  }

  // Handle Vec types - allow array field or fallback to textarea/text
  if (parameterType === 'Vec' || parameterType.startsWith('Vec<')) {
    return ['array', 'textarea', 'text'];
  }

  // Handle Map types
  if (parameterType === 'Map' || parameterType.startsWith('Map<')) {
    return ['map' as FieldType, 'textarea', 'text'];
  }

  // Handle generic types
  const genericMatch = parameterType.match(/^(\w+)<(.+)>$/);
  if (genericMatch) {
    const baseType = genericMatch[1];
    if (baseType === 'Option' || baseType === 'Result') {
      const innerType = genericMatch[2];
      return getStellarCompatibleFieldTypes(innerType);
    }
  }

  // Define compatibility map for known types
  const compatibilityMap: Record<string, FieldType[]> = {
    Address: ['blockchain-address', 'text'],

    // Unsigned integers
    U32: ['number', 'amount', 'text'],
    U64: ['number', 'amount', 'text'],
    U128: ['number', 'amount', 'text'],
    U256: ['number', 'amount', 'text'],

    // Signed integers
    I32: ['number', 'amount', 'text'],
    I64: ['number', 'amount', 'text'],
    I128: ['number', 'amount', 'text'],
    I256: ['number', 'amount', 'text'],

    // Boolean
    Bool: ['checkbox', 'select', 'radio', 'text'],

    // String types
    ScString: ['text', 'textarea', 'email', 'password'],
    ScSymbol: ['text', 'textarea'],

    // Byte types
    Bytes: ['bytes', 'textarea', 'text'],
    DataUrl: ['bytes', 'textarea', 'text'],
    // BytesN types like BytesN<32> for hashes
    'BytesN<32>': ['bytes', 'textarea', 'text'],

    // Complex types
    Tuple: ['object', 'textarea', 'text'],
    Instance: ['object', 'textarea', 'text'],
  };

  // Check if we have a specific compatibility mapping
  const compatibleTypes = compatibilityMap[parameterType];
  if (compatibleTypes) {
    return compatibleTypes;
  }

  // Handle enums
  if (isLikelyEnumType(parameterType)) {
    return ['enum', 'select', 'radio', 'text'];
  }

  // Handle custom types (assumed to be structs)
  if (parameterType[0] && parameterType[0] === parameterType[0].toUpperCase()) {
    // Check if it's not a known Stellar primitive type that starts with uppercase
    const knownUppercaseTypes = [
      'U32',
      'U64',
      'U128',
      'U256',
      'I32',
      'I64',
      'I128',
      'I256',
      'Bool',
      'Bytes',
    ];
    if (
      !knownUppercaseTypes.includes(parameterType) &&
      !parameterType.startsWith('Vec') &&
      !parameterType.startsWith('Map') &&
      !parameterType.includes('Unknown')
    ) {
      // Don't treat Unknown* as structs
      return ['object', 'textarea', 'text'];
    }
  }

  // Default fallback for truly unknown types
  return ['text'];
}
