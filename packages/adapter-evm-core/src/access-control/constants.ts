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

/**
 * Well-known OpenZeppelin role hashes (pre-computed keccak256) mapped to human-readable labels.
 * Used for instant label resolution without on-chain calls.
 *
 * @see https://docs.openzeppelin.com/contracts/5.x/api/access
 */
export const WELL_KNOWN_ROLES: Record<string, string> = {
  [DEFAULT_ADMIN_ROLE]: DEFAULT_ADMIN_ROLE_LABEL,
  '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6': 'MINTER_ROLE',
  '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a': 'PAUSER_ROLE',
  '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848': 'BURNER_ROLE',
  '0x189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3': 'UPGRADER_ROLE',
};

/**
 * Resolves a human-readable label for a role hash.
 * Checks the per-contract label map first (external + ABI labels),
 * then falls back to the well-known dictionary.
 *
 * @param roleId - bytes32 role identifier (0x-prefixed hex)
 * @param roleLabelMap - Optional per-contract map of hash -> label (external + ABI-extracted)
 * @returns Label string or undefined if not found
 */
export function resolveRoleLabel(
  roleId: string,
  roleLabelMap?: Map<string, string>
): string | undefined {
  const normalized = roleId.toLowerCase();
  return roleLabelMap?.get(normalized) ?? WELL_KNOWN_ROLES[normalized];
}
