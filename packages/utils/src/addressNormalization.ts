/**
 * Normalizes a contract address by trimming whitespace and converting to lowercase.
 * This is useful for case-insensitive and whitespace-insensitive address comparison.
 *
 * @param address - The address to normalize (string, null, or undefined)
 * @returns The normalized address string, or empty string if input is falsy
 *
 * @example
 * ```ts
 * normalizeAddress('  0xABC123  ') // Returns '0xabc123'
 * normalizeAddress('0xDEF456') // Returns '0xdef456'
 * normalizeAddress(null) // Returns ''
 * normalizeAddress(undefined) // Returns ''
 * ```
 */
export function normalizeAddress(address: string | null | undefined): string {
  if (typeof address === 'string') {
    return address.trim().toLowerCase();
  }
  return '';
}

/**
 * Compares two addresses after normalization.
 * Returns true if both addresses normalize to the same value.
 *
 * @param address1 - First address to compare
 * @param address2 - Second address to compare
 * @returns True if addresses are equal after normalization
 *
 * @example
 * ```ts
 * addressesEqual('  0xABC  ', '0xabc') // Returns true
 * addressesEqual('0xDEF', '0xABC') // Returns false
 * addressesEqual(null, '') // Returns true
 * ```
 */
export function addressesEqual(
  address1: string | null | undefined,
  address2: string | null | undefined
): boolean {
  return normalizeAddress(address1) === normalizeAddress(address2);
}
