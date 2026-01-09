import type { FieldType, TypeMappingInfo } from '@openzeppelin/ui-types';

/**
 * Midnight primitive types supported by the adapter.
 *
 * These are the base types that can be used in Midnight/Compact contracts.
 * Does not include dynamic types like Array<T>, Maybe<T>, Map<K,V>, Vector<N,T>,
 * Opaque<T>, or custom types (structs/enums).
 *
 * Note: Uint<...> variants (like Uint<8>, Uint<16>, etc.) are not included as primitives
 * since they are parameterized types. They are handled dynamically by the type mapper.
 */
export const MIDNIGHT_PRIMITIVE_TYPES = [
  'bigint',
  'number',
  'boolean',
  'string',
  'Uint8Array',
] as const;

export type MidnightPrimitiveType = (typeof MIDNIGHT_PRIMITIVE_TYPES)[number];

/**
 * Mapping of Midnight primitive types to their default form field types.
 */
export const MIDNIGHT_TYPE_TO_FIELD_TYPE: Record<MidnightPrimitiveType, FieldType> = {
  bigint: 'bigint',
  number: 'number',
  boolean: 'checkbox',
  string: 'text',
  Uint8Array: 'bytes',
};

/**
 * Midnight dynamic type patterns handled through pattern matching.
 */
const MIDNIGHT_DYNAMIC_PATTERNS: TypeMappingInfo['dynamicPatterns'] = [
  {
    name: 'maybe',
    syntax: 'Maybe<T>',
    mapsTo: 'unwrap',
    description: 'Optional, resolves to inner type',
  },
  { name: 'array', syntax: 'Array<T>', mapsTo: 'array', description: 'Dynamic array' },
  { name: 'vector', syntax: 'Vector<N,T>', mapsTo: 'array', description: 'Fixed-size vector' },
  {
    name: 'map',
    syntax: 'Map<K,V>',
    mapsTo: 'map',
    description: 'Key-value map (limited Compact support)',
  },
  {
    name: 'uint',
    syntax: 'Uint<N>',
    mapsTo: 'number',
    description: 'Parameterized unsigned integer',
  },
  { name: 'opaque', syntax: 'Opaque<T>', mapsTo: 'text', description: 'Opaque wrapper' },
  {
    name: 'struct',
    syntax: 'StructName',
    mapsTo: 'object',
    description: 'Custom struct (PascalCase)',
  },
  { name: 'enum', syntax: 'EnumName', mapsTo: 'select', description: 'Enum type' },
];

/**
 * Returns complete type mapping information for Midnight.
 */
export function getMidnightTypeMappingInfo(): TypeMappingInfo {
  return {
    primitives: { ...MIDNIGHT_TYPE_TO_FIELD_TYPE },
    dynamicPatterns: MIDNIGHT_DYNAMIC_PATTERNS,
  };
}
