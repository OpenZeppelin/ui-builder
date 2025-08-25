import type { FieldType } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Stellar/Soroban-specific type mapping to default form field types.
 * Based on Soroban type system: https://developers.stellar.org/docs/learn/fundamentals/contract-development/types
 */
export const STELLAR_TYPE_TO_FIELD_TYPE: Record<string, FieldType> = {
  // Address types
  Address: 'blockchain-address',
  MuxedAddress: 'blockchain-address',

  // String types
  ScString: 'text',
  ScSymbol: 'text',

  // Numeric types - unsigned integers
  U32: 'number',
  U64: 'number',
  U128: 'number',
  U256: 'number',

  // Numeric types - signed integers
  I32: 'number',
  I64: 'number',
  I128: 'number',
  I256: 'number',

  // Boolean type
  Bool: 'checkbox',

  // Byte types
  Bytes: 'textarea',
  DataUrl: 'textarea',

  // Collection types
  Vec: 'array',
  Map: 'object',

  // Complex types
  Tuple: 'object',
  Enum: 'select',

  // Instance types (for compatibility)
  Instance: 'object',
};
