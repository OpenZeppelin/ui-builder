/**
 * Custom JSON stringifier that handles BigInt values by converting them to strings.
 * @param value The value to stringify.
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text for readability.
 * @returns A JSON string representing the given value.
 */
export function stringifyWithBigInt(value: unknown, space?: number | string): string {
  const replacer = (_key: string, val: unknown) => {
    // Check if the value is a BigInt
    if (typeof val === 'bigint') {
      // Convert BigInt to string
      return val.toString();
    }
    // Return the value unchanged for other types
    return val;
  };

  return JSON.stringify(value, replacer, space);
}

/**
 * Check if a value is a serializable plain object suitable for blockchain output display.
 * Excludes arrays, dates, typed arrays, and objects with custom constructors.
 * @param value The value to check
 * @returns True if the value is a plain object that can be safely serialized
 */
export function isSerializableObject(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof Uint8Array) &&
    !(value instanceof Buffer) &&
    value.constructor === Object
  );
}

/**
 * Converts Stellar spec types to ScVal type hints.
 * This mapping is used with nativeToScVal to ensure proper type conversion.
 *
 * @param stellarType - The Stellar parameter type (e.g., 'U32', 'Address', 'Bool')
 * @returns The corresponding ScVal type hint (e.g., 'u32', 'address', 'bool')
 *
 * @example
 * ```typescript
 * nativeToScVal("0", { type: convertStellarTypeToScValType("U32") }) // → ScU32
 * nativeToScVal("GDQP2...", { type: convertStellarTypeToScValType("Address") }) // → ScAddress
 * ```
 */
export function convertStellarTypeToScValType(stellarType: string): string {
  switch (stellarType) {
    case 'Address':
      return 'address';
    case 'U32':
      return 'u32';
    case 'U64':
      return 'u64';
    case 'U128':
      return 'u128';
    case 'U256':
      return 'u256';
    case 'I32':
      return 'i32';
    case 'I64':
      return 'i64';
    case 'I128':
      return 'i128';
    case 'I256':
      return 'i256';
    case 'ScString':
      return 'string';
    case 'ScSymbol':
      return 'symbol';
    case 'Bool':
      return 'bool';
    case 'Bytes':
      return 'bytes';
    case 'DataUrl':
      return 'bytes';
    default:
      return stellarType.toLowerCase();
  }
}
