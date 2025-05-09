import type { FieldType } from '@openzeppelin/transaction-form-types';

/**
 * EVM-specific type mapping to default form field types.
 */
export const EVM_TYPE_TO_FIELD_TYPE: Record<string, FieldType> = {
  address: 'blockchain-address',
  string: 'text',
  uint: 'number',
  uint8: 'number',
  uint16: 'number',
  uint32: 'number',
  uint64: 'number',
  uint128: 'number',
  uint256: 'number',
  int: 'number',
  int8: 'number',
  int16: 'number',
  int32: 'number',
  int64: 'number',
  int128: 'number',
  int256: 'number',
  bool: 'checkbox',
  bytes: 'textarea',
  bytes32: 'text',
};
