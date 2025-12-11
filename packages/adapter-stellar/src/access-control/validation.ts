/**
 * Address Validation Module for Access Control
 *
 * Centralizes address validation for access control operations.
 * Uses Stellar-specific validation from the validation module and
 * shared normalization utilities from @openzeppelin/ui-builder-utils.
 */

import { ConfigurationInvalid } from '@openzeppelin/ui-builder-types';
import { normalizeAddress } from '@openzeppelin/ui-builder-utils';

import { isValidAccountAddress, isValidContractAddress } from '../validation/address';

/**
 * Validates a Stellar contract address
 *
 * @param address The contract address to validate
 * @param paramName Optional parameter name for error messages (defaults to 'contractAddress')
 * @throws ConfigurationInvalid if the address is invalid
 */
export function validateContractAddress(address: string, paramName = 'contractAddress'): void {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    throw new ConfigurationInvalid(
      `${paramName} is required and must be a non-empty string`,
      address,
      paramName
    );
  }

  if (!isValidContractAddress(address)) {
    throw new ConfigurationInvalid(
      `Invalid Stellar contract address: ${address}. Contract addresses must start with 'C' and be valid StrKey format.`,
      address,
      paramName
    );
  }
}

/**
 * Validates a Stellar account address (for role grants, ownership transfers, etc.)
 *
 * @param address The account address to validate
 * @param paramName Optional parameter name for error messages (defaults to 'account')
 * @throws ConfigurationInvalid if the address is invalid
 */
export function validateAccountAddress(address: string, paramName = 'account'): void {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    throw new ConfigurationInvalid(
      `${paramName} is required and must be a non-empty string`,
      address,
      paramName
    );
  }

  if (!isValidAccountAddress(address)) {
    throw new ConfigurationInvalid(
      `Invalid Stellar account address: ${address}. Account addresses must start with 'G' and be valid Ed25519 public keys.`,
      address,
      paramName
    );
  }
}

/**
 * Validates a Stellar address that can be either an account or contract address
 * (e.g., for ownership transfers where the new owner can be either type)
 *
 * @param address The address to validate (account or contract)
 * @param paramName Optional parameter name for error messages (defaults to 'address')
 * @throws ConfigurationInvalid if the address is invalid
 */
export function validateAddress(address: string, paramName = 'address'): void {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    throw new ConfigurationInvalid(
      `${paramName} is required and must be a non-empty string`,
      address,
      paramName
    );
  }

  // Check if it's a valid account address OR contract address
  if (!isValidAccountAddress(address) && !isValidContractAddress(address)) {
    throw new ConfigurationInvalid(
      `Invalid Stellar address: ${address}. Address must be a valid account address (starts with 'G') or contract address (starts with 'C').`,
      address,
      paramName
    );
  }
}

/**
 * Validates both contract and account addresses for operations
 *
 * @param contractAddress The contract address
 * @param accountAddress The account address
 * @throws ConfigurationInvalid if either address is invalid
 */
export function validateAddresses(contractAddress: string, accountAddress: string): void {
  validateContractAddress(contractAddress);
  validateAccountAddress(accountAddress);
}

/**
 * Normalizes a Stellar address using shared utils
 * This is useful for case-insensitive and whitespace-insensitive comparison
 *
 * @param address The address to normalize
 * @returns The normalized address
 */
export function normalizeStellarAddress(address: string): string {
  return normalizeAddress(address);
}

/**
 * Maximum length for a Soroban Symbol (role identifier)
 * Soroban symbols are limited to 32 characters
 */
const MAX_ROLE_ID_LENGTH = 32;

/**
 * Valid pattern for Soroban Symbol characters
 * Symbols can contain alphanumeric characters and underscores
 */
const VALID_ROLE_ID_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Validates a role identifier (Soroban Symbol)
 *
 * Role IDs must be:
 * - Non-empty strings
 * - Max 32 characters (Soroban Symbol limit)
 * - Start with a letter or underscore
 * - Contain only alphanumeric characters and underscores
 *
 * @param roleId The role identifier to validate
 * @param paramName Optional parameter name for error messages
 * @throws ConfigurationInvalid if the role ID is invalid
 */
export function validateRoleId(roleId: string, paramName = 'roleId'): void {
  if (!roleId || typeof roleId !== 'string') {
    throw new ConfigurationInvalid(
      `${paramName} is required and must be a non-empty string`,
      roleId,
      paramName
    );
  }

  const trimmed = roleId.trim();
  if (trimmed === '') {
    throw new ConfigurationInvalid(
      `${paramName} cannot be empty or whitespace-only`,
      roleId,
      paramName
    );
  }

  if (trimmed.length > MAX_ROLE_ID_LENGTH) {
    throw new ConfigurationInvalid(
      `${paramName} exceeds maximum length of ${MAX_ROLE_ID_LENGTH} characters: "${trimmed}" (${trimmed.length} chars)`,
      roleId,
      paramName
    );
  }

  if (!VALID_ROLE_ID_PATTERN.test(trimmed)) {
    throw new ConfigurationInvalid(
      `${paramName} contains invalid characters: "${trimmed}". Role IDs must start with a letter or underscore and contain only alphanumeric characters and underscores.`,
      roleId,
      paramName
    );
  }
}

/**
 * Validates an array of role identifiers
 *
 * @param roleIds The array of role identifiers to validate
 * @param paramName Optional parameter name for error messages
 * @throws ConfigurationInvalid if any role ID is invalid or if the array is invalid
 * @returns The validated and deduplicated array of role IDs
 */
export function validateRoleIds(roleIds: string[], paramName = 'roleIds'): string[] {
  if (!Array.isArray(roleIds)) {
    throw new ConfigurationInvalid(`${paramName} must be an array`, String(roleIds), paramName);
  }

  // Validate each role ID
  for (let i = 0; i < roleIds.length; i++) {
    validateRoleId(roleIds[i], `${paramName}[${i}]`);
  }

  // Deduplicate and return
  return [...new Set(roleIds.map((r) => r.trim()))];
}

/**
 * Result of expiration ledger validation
 *
 * Returned by {@link validateExpirationLedger} to indicate whether
 * a proposed expiration ledger is valid for a two-step ownership transfer.
 *
 * @example
 * ```typescript
 * const currentLedger = await getCurrentLedger(networkConfig);
 * const result = validateExpirationLedger(expirationLedger, currentLedger);
 * if (!result.valid) {
 *   throw new ConfigurationInvalid(result.error!, String(expirationLedger), 'expirationLedger');
 * }
 * ```
 */
export interface ExpirationValidationResult {
  /** Whether the expiration ledger is valid (must be strictly greater than current ledger) */
  valid: boolean;
  /** The current ledger sequence used for comparison */
  currentLedger: number;
  /** Human-readable error message if validation failed */
  error?: string;
}

/**
 * Validates an expiration ledger against the current ledger sequence
 *
 * For two-step Ownable contracts, the expiration ledger must be strictly greater
 * than the current ledger (per FR-020: expirationLedger == currentLedger is invalid).
 *
 * @param expirationLedger The proposed expiration ledger sequence
 * @param currentLedger The current ledger sequence number
 * @returns Validation result with valid flag, currentLedger, and optional error message
 *
 * @example
 * ```typescript
 * const currentLedger = await getCurrentLedger(networkConfig);
 * const result = validateExpirationLedger(expirationLedger, currentLedger);
 * if (!result.valid) {
 *   throw new ConfigurationInvalid(result.error, 'expirationLedger');
 * }
 * ```
 */
export function validateExpirationLedger(
  expirationLedger: number,
  currentLedger: number
): ExpirationValidationResult {
  // Per FR-020: expirationLedger must be strictly greater than currentLedger
  if (expirationLedger <= currentLedger) {
    return {
      valid: false,
      currentLedger,
      error: `Expiration ledger ${expirationLedger} has already passed or equals current ledger. Current ledger is ${currentLedger}. Expiration must be strictly greater than current ledger.`,
    };
  }

  return {
    valid: true,
    currentLedger,
  };
}
