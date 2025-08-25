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
