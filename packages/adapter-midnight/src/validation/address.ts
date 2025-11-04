import { MidnightBech32m } from '@midnight-ntwrk/wallet-sdk-address-format';

import { logger } from '@openzeppelin/ui-builder-utils';

/**
 * Address validation utilities for Midnight Network
 *
 * Uses the official @midnight-ntwrk/wallet-sdk-address-format package
 * for Bech32m validation.
 *
 * @see https://github.com/midnightntwrk
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
  MISSING_SEPARATOR: 'Bech32m address missing separator "1"',
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
 * Valid Bech32m address type prefixes for Midnight user addresses
 * Note: Midnight uses compound prefixes in the format: <network>-<type>_<env>
 * For example: mn_shield-addr_test, mn_shield-naddr_test
 * The Bech32m prefix (before the '1' separator) includes the full compound prefix.
 */
export const MIDNIGHT_ADDRESS_TYPES = {
  SHIELDED: 'addr', // Shielded addresses
  UNSHIELDED: 'naddr', // Unshielded addresses (Night addresses)
  DUST: 'dust', // Dust addresses
  COIN_PUBLIC_KEY: 'cpk', // Coin public key
  ENCRYPTION_PUBLIC_KEY: 'epk', // Encryption public key
} as const;

/**
 * Validates a Midnight user address (Bech32m format)
 *
 * Midnight user addresses use Bech32m encoding with compound prefixes in the format:
 * <network>-<type>_<env>1<data>
 *
 * Examples:
 * - mn_shield-addr_test1... (shielded testnet address)
 * - mn_shield-naddr_test1... (unshielded testnet address)
 * - mn_shield-addr1... (shielded mainnet address)
 *
 * Address types:
 * - addr: Shielded addresses
 * - naddr: Unshielded addresses (Night addresses)
 * - dust: Dust addresses
 * - cpk: Coin public keys
 * - epk: Encryption public keys
 *
 * Uses the official @midnight-ntwrk/wallet-sdk-address-format MidnightBech32m parser
 * for proper validation. Implements a two-phase approach for performance:
 * 1. Fast preliminary checks for obviously invalid/incomplete addresses
 * 2. Full Bech32m validation (including checksum) only for addresses that look complete
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

    // Fast preliminary checks before expensive Bech32m parsing

    // Check for Bech32m separator '1'
    if (!trimmed.includes('1')) {
      return {
        isValid: false,
        error: USER_VALIDATION_ERRORS.MISSING_SEPARATOR,
      };
    }

    // Quick length check - Midnight addresses are typically 100+ characters
    // Skip full validation if address is obviously too short (still being typed)
    if (trimmed.length < 80) {
      return {
        isValid: false,
        error: USER_VALIDATION_ERRORS.INVALID_FORMAT,
      };
    }

    // Extract type from prefix for quick check
    const separatorIndex = trimmed.lastIndexOf('1');
    if (separatorIndex === -1 || separatorIndex === trimmed.length - 1) {
      return {
        isValid: false,
        error: USER_VALIDATION_ERRORS.MISSING_SEPARATOR,
      };
    }

    const prefix = trimmed.substring(0, separatorIndex);
    const validAddressTypes = Object.values(MIDNIGHT_ADDRESS_TYPES);
    const hasValidAddressType = validAddressTypes.some((type) => prefix.includes(type));

    if (!hasValidAddressType) {
      return {
        isValid: false,
        error: USER_VALIDATION_ERRORS.INVALID_PREFIX,
        prefix: prefix,
      };
    }

    // Only run expensive Bech32m validation if preliminary checks pass
    // This includes full checksum verification
    const parsed = MidnightBech32m.parse(trimmed);

    logger.debug('validateUserAddress', `Valid user address: ${trimmed} (type: ${parsed.type})`);

    return {
      isValid: true,
      prefix: parsed.type,
    };
  } catch (err) {
    // Validation failures are expected during user input (typing, incomplete addresses)
    // Log at debug level to avoid noise in console
    logger.debug('validateUserAddress', 'Address validation failed', {
      address: address,
      error: err,
    });
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
  const validAddressTypes = Object.values(MIDNIGHT_ADDRESS_TYPES);

  // Quick check: contains Bech32m separator and has a valid address type
  // The address may have compound prefixes like "mn_shield-addr_test1..."
  return (
    trimmed.includes('1') &&
    validAddressTypes.some((type) => trimmed.includes(type)) &&
    trimmed.length > 20
  );
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
