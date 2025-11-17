/**
 * Set of primitive Stellar/Soroban parameter types.
 * These types do not have nested components and can be directly serialized.
 *
 * Used to distinguish primitive types from complex types (structs, enums, tuples, maps, vecs)
 * when processing parameters for serialization and validation.
 */
export const PRIMITIVE_STELLAR_TYPES = new Set([
  'Bool',
  'ScString',
  'ScSymbol',
  'Address',
  'Bytes',
  'U8',
  'U16',
  'U32',
  'U64',
  'U128',
  'U256',
  'I8',
  'I16',
  'I32',
  'I64',
  'I128',
  'I256',
]);

/**
 * Check if a Stellar type is a primitive type.
 * @param type - The Stellar type to check
 * @returns True if the type is primitive, false otherwise
 */
export function isPrimitiveParamType(type: string): boolean {
  return PRIMITIVE_STELLAR_TYPES.has(type);
}
