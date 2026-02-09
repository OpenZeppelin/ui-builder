/**
 * EVM Access Control Constants
 *
 * Shared constants for the access control module.
 * These values match OpenZeppelin's Solidity AccessControl contract definitions.
 *
 * @module access-control/constants
 */

/**
 * The bytes32 zero value used by OpenZeppelin AccessControl as the default admin role.
 * This is `keccak256("")` equivalent — the admin role that governs all other roles by default.
 *
 * @see https://docs.openzeppelin.com/contracts/5.x/api/access#AccessControl-DEFAULT_ADMIN_ROLE--
 */
export const DEFAULT_ADMIN_ROLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

/**
 * Human-readable label for the default admin role.
 * Used when displaying role information in the Role Manager UI.
 */
export const DEFAULT_ADMIN_ROLE_LABEL = 'DEFAULT_ADMIN_ROLE' as const;

/**
 * The EVM zero address (20 bytes of zeros).
 * Indicates renounced ownership or admin when returned by `owner()` or `defaultAdmin()`.
 */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
