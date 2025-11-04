import { getBytesSize, isPlainObject, logger } from '@openzeppelin/ui-builder-utils';

import {
  isArrayType,
  isBytesType,
  isMaybeType,
  isUintType,
  isVectorType,
} from '../utils/type-helpers';

// (shared helpers imported from ../utils/type-helpers)

function parseHexToUint8Array(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]*$/.test(normalized) || normalized.length % 2 !== 0) {
    throw new Error('Invalid hex string. Must be 0x-prefixed and even-length.');
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Parses a raw input value for Midnight based on a parameter type string.
 *
 * Supported:
 * - Primitives: bigint, number, boolean, string
 * - Bytes: Uint8Array and 0x-prefixed hex strings → Uint8Array
 * - Array<T>: JSON string or array → recursively parsed
 * - Maybe<T>: empty string/undefined/null → { is_some: false }, otherwise → { is_some: true, value: T }
 * - Enums/opaque/custom: pass-through (validated downstream)
 */
export function parseMidnightInput(value: unknown, parameterType: string): unknown {
  try {
    // Maybe<T> - check first to handle null/undefined/empty correctly
    const maybe = isMaybeType(parameterType);
    if (maybe.isMaybe && maybe.innerType) {
      // Represent Option/Maybe as struct expected by Midnight: { is_some: boolean, value?: T }
      if (value === '' || value === undefined || value === null) {
        return { is_some: false };
      }
      const innerParsed = parseMidnightInput(value, maybe.innerType);
      return { is_some: true, value: innerParsed };
    }

    // Early return for null/undefined only if not Maybe<T>
    if (value === undefined || value === null) return null;

    // Fixed-size vectors: Vector<N, T>
    const vector = isVectorType(parameterType);
    if (vector.isVector && vector.elementType) {
      let items: unknown[];
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error('Expected JSON array for Vector');
          items = parsed;
        } catch (e) {
          throw new Error(`Invalid JSON for Vector: ${(e as Error).message}`);
        }
      } else if (Array.isArray(value)) {
        items = value;
      } else {
        throw new Error('Vector input must be a JSON string or array');
      }

      let parsedItems = items.map((v) => parseMidnightInput(v, vector.elementType!));

      // Enforce fixed size for Vector types (no padding, no truncation)
      if (typeof vector.size === 'number') {
        if (parsedItems.length !== vector.size) {
          throw new Error(
            `Vector of type ${parameterType} requires exactly ${vector.size} elements. Received ${parsedItems.length}.`
          );
        }
      }
      return parsedItems;
    }

    // Arrays
    const arr = isArrayType(parameterType);
    if (arr.isArray && arr.elementType) {
      let items: unknown[];
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
          items = parsed;
        } catch (e) {
          throw new Error(`Invalid JSON for array: ${(e as Error).message}`);
        }
      } else if (Array.isArray(value)) {
        items = value;
      } else {
        throw new Error('Array input must be a JSON string or array');
      }
      return items.map((v) => parseMidnightInput(v, arr.elementType!));
    }

    // Primitives
    const t = parameterType.toLowerCase();
    if (t === 'bigint') {
      if (value === '' || value === null) throw new Error('Numeric value cannot be empty.');
      try {
        return BigInt(value as string | number | bigint);
      } catch {
        throw new Error(`Invalid bigint value: '${value as string}'.`);
      }
    }
    if (t === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new Error(`Invalid number value: '${value as string}'.`);
      return n;
    }

    // Uint<...> (unsigned integers): parse to JavaScript number
    if (isUintType(parameterType)) {
      if (value === '' || value === null) throw new Error('Numeric value cannot be empty.');
      if (typeof value === 'number') {
        if (!Number.isFinite(value) || value < 0) {
          throw new Error(`Invalid Uint value: '${value}'. Must be a non-negative finite number.`);
        }
        return value;
      }
      if (typeof value === 'bigint') {
        const num = Number(value);
        if (!Number.isFinite(num) || num < 0 || num > Number.MAX_SAFE_INTEGER) {
          throw new Error(`Uint value out of safe integer range: '${value.toString()}'.`);
        }
        return num;
      }
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) {
        throw new Error(`Invalid Uint value: '${value as string}'.`);
      }
      return n;
    }
    if (t === 'boolean') {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (lower === 'true') return true;
        if (lower === 'false') return false;
      }
      return Boolean(value);
    }
    if (t === 'string') {
      return String(value);
    }

    // Bytes
    if (isBytesType(parameterType)) {
      let bytes: Uint8Array;

      if (value instanceof Uint8Array) {
        bytes = value;
      } else if (typeof value === 'string') {
        if (!value.startsWith('0x')) {
          throw new Error('Bytes must be a 0x-prefixed hex string or Uint8Array');
        }
        bytes = parseHexToUint8Array(value);
      } else if (Array.isArray(value) && value.every((b) => typeof b === 'number')) {
        // Accept array-like numeric bytes [0..255]
        bytes = new Uint8Array(value as number[]);
      } else {
        throw new Error('Unsupported bytes input type');
      }

      // Validate size for Bytes<N> types
      const expectedSize = getBytesSize(parameterType);
      if (expectedSize !== undefined && bytes.length !== expectedSize) {
        throw new Error(
          `${parameterType} requires exactly ${expectedSize} bytes. Received ${bytes.length} bytes.`
        );
      }

      return bytes;
    }

    // Enums and opaque/custom types: accept as-is; further conversion handled downstream if needed
    if (
      isPlainObject(value) ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    return value;
  } catch (error) {
    logger.error('MidnightInputParser', 'Failed to parse Midnight input', {
      parameterType,
      value,
      error,
    });
    throw error;
  }
}
