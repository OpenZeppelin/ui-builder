import type { FieldType, TypeMappingInfo } from '@openzeppelin/ui-types';

/**
 * Stellar/Soroban-specific type mapping to default form field types.
 * Based on Soroban type system: https://developers.stellar.org/docs/learn/fundamentals/contract-development/types
 *
 * Note: Large integer types (U64, U128, U256, I64, I128, I256) are mapped to 'bigint'
 * instead of 'number' to avoid JavaScript's Number precision limitations.
 * JavaScript's Number type can only safely represent integers up to 2^53 - 1,
 * but these types can hold much larger values. The BigIntField component stores values
 * as strings and the Stellar adapter handles conversion automatically.
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
  U64: 'bigint',
  U128: 'bigint',
  U256: 'bigint',

  // Numeric types - signed integers
  I32: 'number',
  I64: 'bigint',
  I128: 'bigint',
  I256: 'bigint',

  // Boolean type
  Bool: 'checkbox',

  // Byte types
  Bytes: 'bytes',
  DataUrl: 'bytes',

  // Collection types
  Vec: 'array',
  Map: 'map',

  // Complex types
  Tuple: 'object',
  Enum: 'select',

  // Instance types (for compatibility)
  Instance: 'object',
};

/**
 * Stellar dynamic type patterns handled through pattern matching.
 */
const STELLAR_DYNAMIC_PATTERNS: TypeMappingInfo['dynamicPatterns'] = [
  { name: 'vec', syntax: 'Vec<T>', mapsTo: null, description: 'Array (maps based on inner type)' },
  { name: 'map', syntax: 'Map<K,V>', mapsTo: 'map', description: 'Key-value map' },
  {
    name: 'option',
    syntax: 'Option<T>',
    mapsTo: 'unwrap',
    description: 'Optional, resolves to inner type',
  },
  {
    name: 'result',
    syntax: 'Result<T>',
    mapsTo: 'unwrap',
    description: 'Result, resolves to inner type',
  },
  { name: 'bytes-n', syntax: 'BytesN<N>', mapsTo: 'bytes', description: 'Fixed-size byte array' },
  {
    name: 'struct',
    syntax: 'StructName',
    mapsTo: 'object',
    description: 'Custom struct (PascalCase)',
  },
  { name: 'enum', syntax: 'EnumName', mapsTo: 'select', description: 'Enum type' },
];

/**
 * Returns complete type mapping information for Stellar.
 */
export function getStellarTypeMappingInfo(): TypeMappingInfo {
  return {
    primitives: { ...STELLAR_TYPE_TO_FIELD_TYPE },
    dynamicPatterns: STELLAR_DYNAMIC_PATTERNS,
  };
}
