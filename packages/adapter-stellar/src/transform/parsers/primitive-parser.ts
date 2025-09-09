import { Buffer } from 'buffer';
import { Address } from '@stellar/stellar-sdk';

import { detectBytesEncoding, logger } from '@openzeppelin/contracts-ui-builder-utils';

const SYSTEM_LOG_TAG = 'PrimitiveParser';

/**
 * Parses primitive Stellar/Soroban types from form inputs.
 * Handles: Bool, Bytes, Address, ScString, ScSymbol, and numeric types (U32, U64, U128, U256, I32, I64, I128, I256).
 *
 * @param value - The input value from the form
 * @param parameterType - The Stellar parameter type
 * @returns The parsed primitive value
 */
export function parsePrimitive(value: unknown, parameterType: string): unknown {
  try {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return null;
    }

    switch (parameterType) {
      // Boolean: convert string "true"/"false" to actual boolean
      case 'Bool':
        if (typeof value === 'boolean') {
          return value;
        }
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        throw new Error(`Boolean parameter expected, got ${typeof value}`);

      // Bytes: handle encoding detection
      case 'Bytes':
        if (typeof value === 'string') {
          // Remove 0x prefix if present
          const cleanValue = value.startsWith('0x') ? value.slice(2) : value;
          const encoding = detectBytesEncoding(cleanValue);
          return new Uint8Array(Buffer.from(cleanValue, encoding));
        }
        throw new Error(`Bytes parameter must be a string, got ${typeof value}`);

      // DataUrl: handle base64 encoded data (similar to Bytes)
      case 'DataUrl':
        if (typeof value === 'string') {
          // DataUrl is typically base64 encoded
          const encoding = detectBytesEncoding(value);
          return new Uint8Array(Buffer.from(value, encoding));
        }
        throw new Error(`DataUrl parameter must be a string, got ${typeof value}`);

      // Address: validate format
      case 'Address':
        if (typeof value === 'string') {
          try {
            Address.fromString(value); // Validate format
            return value; // Return raw string - nativeToScVal will handle conversion
          } catch {
            throw new Error(`Invalid Stellar address format: ${value}`);
          }
        }
        throw new Error(`Address parameter must be a string, got ${typeof value}`);

      // String types: return as-is
      case 'ScString':
      case 'ScSymbol':
        if (typeof value === 'string') {
          return value;
        }
        throw new Error(`String parameter expected, got ${typeof value}`);

      default:
        // Handle BytesN<size> patterns
        if (/^BytesN<\d+>$/.test(parameterType)) {
          if (typeof value === 'string') {
            const cleanValue = value.startsWith('0x') ? value.slice(2) : value;
            const encoding = detectBytesEncoding(cleanValue);
            return new Uint8Array(Buffer.from(cleanValue, encoding));
          }
          throw new Error(`Bytes parameter must be a string, got ${typeof value}`);
        }

        // Handle numeric types: U32, U64, U128, U256, I32, I64, I128, I256
        if (/^[UI](32|64|128|256)$/.test(parameterType)) {
          if (typeof value === 'string') {
            // Validate it's a valid integer (no decimals, letters)
            if (!/^-?\d+$/.test(value.trim())) {
              throw new Error(`Invalid number format for ${parameterType}: ${value}`);
            }
            return value; // Return raw string - let nativeToScVal handle conversion with type hints
          }
          if (typeof value === 'number') {
            return value.toString(); // Convert to string for consistency
          }
          throw new Error(`Numeric parameter expected for ${parameterType}, got ${typeof value}`);
        }

        return null; // Not a primitive type - let other parsers handle it
    }
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, `Failed to parse primitive ${parameterType}:`, error);
    throw error;
  }
}

/**
 * Checks if the given parameter type is a primitive type that can be handled by this parser.
 *
 * @param parameterType - The Stellar parameter type
 * @returns True if this is a primitive type
 */
export function isPrimitiveType(parameterType: string): boolean {
  return (
    parameterType === 'Bool' ||
    parameterType === 'Bytes' ||
    parameterType === 'DataUrl' ||
    parameterType === 'Address' ||
    parameterType === 'ScString' ||
    parameterType === 'ScSymbol' ||
    /^BytesN<\d+>$/.test(parameterType) ||
    /^[UI](32|64|128|256)$/.test(parameterType)
  );
}
