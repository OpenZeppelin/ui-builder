/**
 * EVM Access Control Input Validation
 *
 * Provides throwing validation wrappers for the access control module.
 * Reuses `isValidEvmAddress` from `../utils/validation.ts` for address checks
 * and adds bytes32 role ID validation (access-control-specific).
 *
 * All functions throw `ConfigurationInvalid` from `@openzeppelin/ui-types`
 * on failure, matching the Stellar adapter's error handling pattern.
 *
 * @module access-control/validation
 * @see research.md §R8 — EVM Address and Role Validation
 */

import { ConfigurationInvalid } from '@openzeppelin/ui-types';

import { isValidEvmAddress } from '../utils/validation';

/**
 * Regex pattern for validating bytes32 hex strings.
 * Must be 0x followed by exactly 64 hex characters (case-insensitive).
 */
const BYTES32_PATTERN = /^0x[0-9a-fA-F]{64}$/;

/**
 * Validates an EVM address, throwing `ConfigurationInvalid` on failure.
 *
 * Delegates to the existing `isValidEvmAddress()` utility (which uses
 * viem's `isAddress()` under the hood). EVM does not distinguish between
 * contract and account addresses — both are 20-byte hex strings — so a
 * single validation function is sufficient.
 *
 * @param address - The EVM address to validate (contract or account)
 * @param paramName - Parameter name for error messages (e.g. 'contractAddress', 'account', 'newOwner')
 * @throws ConfigurationInvalid if the address is empty or not a valid EVM address
 */
export function validateAddress(address: string, paramName = 'address'): void {
  assertNonEmptyString(address, paramName);

  if (!isValidEvmAddress(address)) {
    throw new ConfigurationInvalid(
      `Invalid EVM address: ${address}. Addresses must be 0x-prefixed, 40-character hex strings.`,
      address,
      paramName
    );
  }
}

/**
 * Validates a role identifier as a bytes32 hex string.
 *
 * EVM AccessControl uses `bytes32` values as role identifiers, typically
 * computed as `keccak256("ROLE_NAME")`. The format is `0x` followed by
 * exactly 64 hex characters (case-insensitive).
 *
 * The `DEFAULT_ADMIN_ROLE` (bytes32 zero: `0x0000...0000`) is a valid role ID.
 *
 * Returns the trimmed role ID so callers can use the sanitized value
 * in downstream operations (e.g. transaction assembly).
 *
 * @param roleId - The role identifier to validate
 * @param paramName - Optional parameter name for error messages (defaults to 'roleId')
 * @returns The trimmed, validated role ID
 * @throws ConfigurationInvalid if the role ID is invalid
 */
export function validateRoleId(roleId: string, paramName = 'roleId'): string {
  assertNonEmptyString(roleId, paramName);

  const trimmed = roleId.trim();

  if (!BYTES32_PATTERN.test(trimmed)) {
    throw new ConfigurationInvalid(
      `${paramName}: Invalid bytes32 role ID: ${trimmed}. Role IDs must be 0x-prefixed, 64-character hex strings (bytes32).`,
      roleId,
      paramName
    );
  }

  return trimmed;
}

/**
 * Validates an array of role identifiers.
 *
 * Each role ID is validated as a bytes32 hex string. The array is deduplicated
 * before returning. An empty array is valid (means no known role IDs).
 *
 * @param roleIds - The array of role identifiers to validate
 * @param paramName - Optional parameter name for error messages (defaults to 'roleIds')
 * @returns The validated and deduplicated array of role IDs
 * @throws ConfigurationInvalid if the input is not an array or any role ID is invalid
 */
export function validateRoleIds(roleIds: string[], paramName = 'roleIds'): string[] {
  if (!Array.isArray(roleIds)) {
    throw new ConfigurationInvalid(`${paramName} must be an array`, String(roleIds), paramName);
  }

  for (let i = 0; i < roleIds.length; i++) {
    validateRoleId(roleIds[i], `${paramName}[${i}]`);
  }

  return [...new Set(roleIds.map((r) => r.trim()))];
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Asserts that a value is a non-empty string.
 *
 * @param value - The value to check
 * @param paramName - Parameter name for error messages
 * @throws ConfigurationInvalid if the value is not a non-empty string
 */
function assertNonEmptyString(value: string, paramName: string): void {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new ConfigurationInvalid(
      `${paramName} is required and must be a non-empty string`,
      value,
      paramName
    );
  }
}
