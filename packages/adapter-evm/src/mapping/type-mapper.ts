import type { FieldType } from '@openzeppelin/ui-builder-types';

import { EVM_TYPE_TO_FIELD_TYPE } from './constants';

/**
 * Map a blockchain-specific parameter type to a default form field type.
 * @param parameterType The blockchain parameter type (e.g., 'uint256', 'address', 'tuple')
 * @returns The appropriate default form field type (e.g., 'number', 'blockchain-address', 'object')
 */
export function mapEvmParamTypeToFieldType(parameterType: string): FieldType {
  // Check if this is an array of tuples/objects
  if (parameterType.match(/^tuple\[\d*\]$/)) {
    return 'array-object';
  }

  // Check if this is an array type (ends with [] or [number])
  if (parameterType.match(/\[\d*\]$/)) {
    return 'array';
  }

  // Extract the base type from array types (e.g., uint256[] -> uint256)
  const baseType = parameterType.replace(/\[\d*\]/g, '');

  // Handle tuples (structs) - use object for composite types
  if (baseType.startsWith('tuple')) {
    return 'object';
  }

  // Map common EVM types to appropriate field types
  return EVM_TYPE_TO_FIELD_TYPE[baseType] || 'text'; // Default to 'text'
}

/**
 * Get field types compatible with a specific parameter type.
 * @param parameterType The blockchain parameter type.
 * @returns Array of compatible form field types.
 */
export function getEvmCompatibleFieldTypes(parameterType: string): FieldType[] {
  // Handle array of objects
  if (parameterType.match(/^tuple\[\d*\]$/)) {
    return ['array-object', 'textarea', 'text'];
  }

  // Handle array types - allow array field or fallback to textarea/text
  if (parameterType.match(/\[\d*\]$/)) {
    return ['array', 'textarea', 'text'];
  }

  const baseType = parameterType.replace(/\[\d*\]/g, '');

  // Handle tuples/objects
  if (baseType.startsWith('tuple')) {
    return ['object', 'textarea', 'text'];
  }

  // Define compatibility map for base types
  const compatibilityMap: Record<string, FieldType[]> = {
    address: ['blockchain-address', 'text'],
    uint: ['number', 'amount', 'text'],
    uint8: ['number', 'amount', 'text'],
    uint16: ['number', 'amount', 'text'],
    uint32: ['number', 'amount', 'text'],
    uint64: ['bigint', 'number', 'amount', 'text'],
    uint128: ['bigint', 'number', 'amount', 'text'],
    uint256: ['bigint', 'number', 'amount', 'text'],
    int: ['number', 'text'],
    int8: ['number', 'text'],
    int16: ['number', 'text'],
    int32: ['number', 'text'],
    int64: ['bigint', 'number', 'text'],
    int128: ['bigint', 'number', 'text'],
    int256: ['bigint', 'number', 'text'],
    bool: ['checkbox', 'select', 'radio', 'text'],
    string: ['text', 'textarea', 'email', 'password'],
    bytes: ['textarea', 'text'],
    bytes32: ['text', 'textarea'],
  };

  return compatibilityMap[baseType] || ['text']; // Default to 'text'
}
