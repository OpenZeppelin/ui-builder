import type { FieldType } from '@openzeppelin/transaction-form-types';

import { EVM_TYPE_TO_FIELD_TYPE } from './constants';

/**
 * Map a blockchain-specific parameter type to a default form field type.
 * @param parameterType The blockchain parameter type (e.g., 'uint256', 'address', 'tuple')
 * @returns The appropriate default form field type (e.g., 'number', 'blockchain-address', 'textarea')
 */
export function mapEvmParamTypeToFieldType(parameterType: string): FieldType {
  // Check if this is an array type (ends with [] or [number])
  if (parameterType.match(/\[\d*\]$/)) {
    // All array types should use textarea for JSON input
    return 'textarea';
  }

  // Extract the base type from array types (e.g., uint256[] -> uint256)
  const baseType = parameterType.replace(/\[\d*\]/g, '');

  // Handle tuples (structs) - use textarea for JSON input
  if (baseType.startsWith('tuple')) {
    return 'textarea';
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
  // Handle array and tuple types - allow JSON input via textarea or basic text
  if (parameterType.match(/\[\d*\]$/)) {
    return ['textarea', 'text'];
  }
  const baseType = parameterType.replace(/\[\d*\]/g, '');
  if (baseType.startsWith('tuple')) {
    return ['textarea', 'text'];
  }

  // Define compatibility map for base types
  const compatibilityMap: Record<string, FieldType[]> = {
    address: ['blockchain-address', 'text'],
    uint: ['number', 'amount', 'text'],
    uint8: ['number', 'amount', 'text'],
    uint16: ['number', 'amount', 'text'],
    uint32: ['number', 'amount', 'text'],
    uint64: ['number', 'amount', 'text'],
    uint128: ['number', 'amount', 'text'],
    uint256: ['number', 'amount', 'text'],
    int: ['number', 'text'],
    int8: ['number', 'text'],
    int16: ['number', 'text'],
    int32: ['number', 'text'],
    int64: ['number', 'text'],
    int128: ['number', 'text'],
    int256: ['number', 'text'],
    bool: ['checkbox', 'select', 'radio', 'text'],
    string: ['text', 'textarea', 'email', 'password'],
    bytes: ['textarea', 'text'],
    bytes32: ['text', 'textarea'],
  };

  return compatibilityMap[baseType] || ['text']; // Default to 'text'
}
