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
