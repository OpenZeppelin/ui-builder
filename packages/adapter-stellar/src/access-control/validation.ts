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
