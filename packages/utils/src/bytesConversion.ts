/**
 * Cross-platform bytes conversion utilities that work in both browser and Node.js
 * without requiring Buffer polyfills.
 */

/**
 * Convert a hex string to Uint8Array using native browser APIs
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Uint8Array representation
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }

  // Validate hex characters
  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
    throw new Error('Invalid hex characters in string');
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }

  return bytes;
}

/**
 * Convert a base64 string to Uint8Array using native browser APIs
 * @param base64 - Base64 encoded string
 * @returns Uint8Array representation
 */
export function base64ToBytes(base64: string): Uint8Array {
  const decoded = atob(base64);
  const bytes = new Uint8Array(decoded.length);

  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }

  return bytes;
}

/**
 * Convert Uint8Array to hex string
 * @param bytes - Uint8Array to convert
 * @param withPrefix - Whether to include '0x' prefix
 * @returns Hex string representation
 */
export function bytesToHex(bytes: Uint8Array, withPrefix = false): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return withPrefix ? `0x${hex}` : hex;
}

/**
 * Convert string to bytes based on detected encoding (hex or base64)
 * @param value - The string value to convert
 * @param encoding - The detected encoding type
 * @returns Uint8Array representation
 */
export function stringToBytes(value: string, encoding: 'hex' | 'base64'): Uint8Array {
  switch (encoding) {
    case 'hex':
      return hexToBytes(value);
    case 'base64':
      return base64ToBytes(value);
    default:
      throw new Error(`Unsupported encoding: ${encoding}. Supported encodings: hex, base64`);
  }
}
