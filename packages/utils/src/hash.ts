/**
 * Simple browser-compatible hash utilities
 * These functions provide deterministic hashing for content comparison
 * and are not intended for cryptographic purposes.
 */

/**
 * Creates a simple hash from a string using a non-cryptographic algorithm
 * Suitable for content comparison, caching keys, and quick fingerprinting
 *
 * @param str - The string to hash
 * @returns A hexadecimal hash string (always positive)
 *
 * @example
 * ```typescript
 * const hash1 = simpleHash('{"name": "test"}');
 * const hash2 = simpleHash('{"name": "test"}');
 * console.log(hash1 === hash2); // true - deterministic
 * ```
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}
