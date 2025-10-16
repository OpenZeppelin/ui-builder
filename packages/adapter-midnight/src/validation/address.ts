import { bech32m } from '@scure/base';

import { logger } from '@openzeppelin/ui-builder-utils';

/**
 * Address validation utilities for Midnight Network
 *
 * NOTE: This is a temporary implementation until the Midnight SDK provides
 * official address validation utilities. Currently, the SDK only provides
 * encoding/decoding via @midnight-ntwrk/wallet-sdk-address-format but no
 * validation helpers. This implementation uses the standard @scure/base
 * library for Bech32m.
 *
 * @see https://github.com/midnight-network (when official utils are available)
 */

/**
 * Error messages for contract address validation
 * Matches the Midnight Deploy CLI validation
 */
export const CONTRACT_VALIDATION_ERRORS = {
  INVALID_FORMAT: 'Invalid contract address format',
  INVALID_LENGTH: 'Contract address must be 68 hex characters',
  INVALID_PREFIX: 'Contract address must start with 0200',
  INVALID_CHARACTERS: 'Invalid characters in contract address',
} as const;

/**
 * Error messages for user address validation
 */
export const USER_VALIDATION_ERRORS = {
  INVALID_FORMAT: 'Invalid address format',
  INVALID_BECH32M: 'Invalid Bech32m encoding',
  INVALID_PREFIX: 'Invalid address prefix',
} as const;

/**
 * Validates a Midnight contract address
 *
 * Midnight contract addresses are 68-character hex strings that start with "0200"
 * Example: 0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6
 *
 * This implementation matches the validation logic from midnight-deploy-cli
 *
 * @param address The address to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateContractAddress(address: string): {
  isValid: boolean;
  error?: string;
  normalized?: string;
} {
  try {
    // Basic format checks
    if (!address || typeof address !== 'string') {
      return {
        isValid: false,
        error: CONTRACT_VALIDATION_ERRORS.INVALID_FORMAT,
      };
    }

    // Trim and normalize
    const trimmed = address.trim().toLowerCase();

    // Check length (68 hex characters)
    if (trimmed.length !== 68) {
      return {
        isValid: false,
        error: CONTRACT_VALIDATION_ERRORS.INVALID_LENGTH,
      };
    }

    // Check prefix (must start with 0200)
    if (!trimmed.startsWith('0200')) {
      return {
        isValid: false,
        error: CONTRACT_VALIDATION_ERRORS.INVALID_PREFIX,
      };
    }

    // Check for valid hex characters
    const hexRegex = /^[0-9a-f]+$/;
    if (!hexRegex.test(trimmed)) {
      return {
        isValid: false,
        error: CONTRACT_VALIDATION_ERRORS.INVALID_CHARACTERS,
      };
    }

    logger.debug('validateContractAddress', `Valid contract address: ${trimmed}`);

    return {
      isValid: true,
      normalized: trimmed,
    };
  } catch {
    return {
      isValid: false,
      error: CONTRACT_VALIDATION_ERRORS.INVALID_FORMAT,
    };
  }
}

/**
 * Formats a contract address to ensure consistent representation
 *
 * @param address The contract address to format
 * @returns The formatted address (lowercase, trimmed) or null if invalid
 */
export function formatContractAddress(address: string): string | null {
  const validation = validateContractAddress(address);
  return validation.isValid ? validation.normalized! : null;
}

/**
 * Converts a hex contract address to the format expected by the indexer
 * For Midnight, this is just the hex address itself (already in the right format)
 *
 * @param address The hex contract address
 * @returns The address in indexer format (same as input for Midnight)
 */
export function contractAddressToHex(address: string): string {
  const validation = validateContractAddress(address);

  if (!validation.isValid) {
    throw new Error(`Invalid contract address: ${validation.error}`);
  }

  // Return the normalized (lowercase) hex address
  return validation.normalized!;
}

/**
 * Checks if a string looks like a valid Midnight contract address
 * Quick check without full validation
 *
 * @param address The address to check
 * @returns True if the address has the correct format
 */
export function isValidContractAddressFormat(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmed = address.trim().toLowerCase();

  // Quick check: 68 chars, starts with 0200, looks like hex
  return trimmed.length === 68 && trimmed.startsWith('0200') && /^[0-9a-f]+$/.test(trimmed);
}

/**
 * Valid Bech32m prefixes for Midnight user addresses
 */
export const MIDNIGHT_ADDRESS_PREFIXES = {
  SHIELDED: 'addr', // Shielded addresses
  UNSHIELDED: 'naddr', // Unshielded addresses (Night addresses)
  DUST: 'dust', // Dust addresses
  COIN_PUBLIC_KEY: 'cpk', // Coin public key
  ENCRYPTION_PUBLIC_KEY: 'epk', // Encryption public key
} as const;

/**
 * Validates a Midnight user address (Bech32m format)
 *
 * Midnight user addresses use Bech32m encoding with specific prefixes:
 * - addr: Shielded addresses
 * - naddr: Unshielded addresses (Night addresses)
 * - dust: Dust addresses
 * - cpk: Coin public keys
 * - epk: Encryption public keys
 *
 * @param address The address to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateUserAddress(address: string): {
  isValid: boolean;
  error?: string;
  prefix?: string;
} {
  try {
    if (!address || typeof address !== 'string') {
      return {
        isValid: false,
        error: USER_VALIDATION_ERRORS.INVALID_FORMAT,
      };
    }

    const trimmed = address.trim().toLowerCase();

    if (trimmed.length === 0) {
      return {
        isValid: false,
        error: USER_VALIDATION_ERRORS.INVALID_FORMAT,
      };
    }

    // Decode Bech32m address
    const decoded = bech32m.decode(trimmed as `${string}1${string}`);

    // Check if prefix is valid for Midnight user addresses
    const validPrefixes = Object.values(MIDNIGHT_ADDRESS_PREFIXES);
    const isValidPrefix = validPrefixes.includes(
      decoded.prefix as (typeof MIDNIGHT_ADDRESS_PREFIXES)[keyof typeof MIDNIGHT_ADDRESS_PREFIXES]
    );
    if (!isValidPrefix) {
      return {
        isValid: false,
        error: USER_VALIDATION_ERRORS.INVALID_PREFIX,
        prefix: decoded.prefix,
      };
    }

    logger.debug(
      'validateUserAddress',
      `Valid user address: ${trimmed} (prefix: ${decoded.prefix})`
    );

    return {
      isValid: true,
      prefix: decoded.prefix,
    };
  } catch (err) {
    logger.error('validateUserAddress', 'Invalid Bech32m address', err);
    return {
      isValid: false,
      error: USER_VALIDATION_ERRORS.INVALID_BECH32M,
    };
  }
}

/**
 * Checks if a string looks like a valid Midnight user address
 * Quick check without full Bech32m validation
 *
 * @param address The address to check
 * @returns True if the address has the correct format
 */
export function isValidUserAddressFormat(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmed = address.trim().toLowerCase();
  const validPrefixes = Object.values(MIDNIGHT_ADDRESS_PREFIXES);

  // Quick check: starts with valid prefix and has reasonable length
  return validPrefixes.some((prefix) => trimmed.startsWith(prefix + '1')) && trimmed.length > 10;
}

/**
 * Validates any Midnight address (contract or user)
 *
 * This is a convenience function that tries both contract and user address validation.
 * Used by the adapter's isValidAddress() method for general validation.
 *
 * @param address The address to validate
 * @returns True if the address is valid (either contract or user format)
 */
export function isValidAddress(address: string): boolean {
  // Try contract address format first (68-char hex)
  if (isValidContractAddressFormat(address)) {
    return validateContractAddress(address).isValid;
  }

  // Try user address format (Bech32m)
  if (isValidUserAddressFormat(address)) {
    return validateUserAddress(address).isValid;
  }

  return false;
}
