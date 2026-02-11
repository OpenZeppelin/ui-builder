/**
 * EVM Access Control On-Chain Reader
 *
 * Reads current access control state (ownership and admin) from EVM-compatible contracts
 * using viem public client. Each function creates a stateless viem `publicClient` per call,
 * consistent with the existing query handler pattern in `adapter-evm-core/src/query/handler.ts`.
 *
 * Supports:
 * - Ownable: `owner()` read
 * - Ownable2Step: `owner()` + `pendingOwner()` reads
 * - AccessControlDefaultAdminRules: `defaultAdmin()`, `pendingDefaultAdmin()`, `defaultAdminDelay()`
 * - AccessControl: `hasRole()`, `getRoleAdmin()`
 * - AccessControlEnumerable: `getRoleMemberCount()`, `getRoleMember()`
 * - Utility: `getCurrentBlock()`
 *
 * @module access-control/onchain-reader
 * @see quickstart.md §Step 3
 * @see research.md §R1 — On-Chain Read Strategy
 */

import type { Chain } from 'viem';

import type { RoleAssignment, RoleIdentifier } from '@openzeppelin/ui-types';
import { OperationFailed } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { createEvmPublicClient } from '../utils/public-client';
import {
  DEFAULT_ADMIN_ABI,
  DEFAULT_ADMIN_DELAY_ABI,
  GET_ROLE_ADMIN_ABI,
  GET_ROLE_MEMBER_ABI,
  GET_ROLE_MEMBER_COUNT_ABI,
  HAS_ROLE_ABI,
  OWNER_ABI,
  PENDING_DEFAULT_ADMIN_ABI,
  PENDING_OWNER_ABI,
} from './abis';
import { resolveRoleLabel, ZERO_ADDRESS } from './constants';

// ---------------------------------------------------------------------------
// Internal Types
// ---------------------------------------------------------------------------

/** Result of readOwnership — raw on-chain data before state classification */
export interface OwnershipReadResult {
  /** Owner address, or null if zero address (renounced) */
  owner: string | null;
  /** Pending owner address (Ownable2Step), or undefined if not available */
  pendingOwner?: string;
}

/** Result of getAdmin — raw on-chain data for DefaultAdminRules */
export interface AdminReadResult {
  /** Default admin address, or null if zero address (renounced) */
  defaultAdmin: string | null;
  /** Pending new admin address, or undefined if no scheduled transfer */
  pendingDefaultAdmin?: string;
  /**
   * UNIX timestamp (seconds) at which the pending transfer can be accepted.
   * Only present when pendingDefaultAdmin is set.
   *
   * **Semantic note**: Despite the field name in the unified type (`expirationBlock`),
   * this is NOT a block number — it is a UNIX timestamp from the contract's
   * `pendingDefaultAdmin()` return value. See research.md §R5.
   */
  acceptSchedule?: number;
  /** Current admin delay in seconds */
  defaultAdminDelay?: number;
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

const LOG_SYSTEM = 'EvmOnChainReader';

/** Alias for readability within this module */
function createClient(rpcUrl: string, viemChain?: Chain) {
  return createEvmPublicClient(rpcUrl, viemChain);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read the current ownership state from an Ownable / Ownable2Step contract.
 *
 * Calls `owner()` (required) and `pendingOwner()` (optional — only Ownable2Step).
 * If `pendingOwner()` reverts or returns the zero address, `pendingOwner` is undefined.
 * If `owner()` returns the zero address, `owner` is returned as `null` (renounced).
 *
 * @param rpcUrl - RPC endpoint URL
 * @param contractAddress - The EVM contract address (0x-prefixed)
 * @param viemChain - Optional viem Chain object for the network
 * @returns Ownership read result with owner and optional pendingOwner
 * @throws OperationFailed if the `owner()` call fails
 */
export async function readOwnership(
  rpcUrl: string,
  contractAddress: string,
  viemChain?: Chain
): Promise<OwnershipReadResult> {
  logger.info(LOG_SYSTEM, `Reading ownership for contract ${contractAddress}`);

  const client = createClient(rpcUrl, viemChain);
  const address = contractAddress as `0x${string}`;

  // ── owner() — required ────────────────────────────────────────────
  let ownerAddress: string;
  try {
    ownerAddress = (await client.readContract({
      address,
      abi: OWNER_ABI,
      functionName: 'owner',
    })) as string;
  } catch (error) {
    logger.error(LOG_SYSTEM, `Failed to read owner() for ${contractAddress}:`, error);
    throw new OperationFailed(
      `Failed to read ownership: ${(error as Error).message}`,
      contractAddress,
      'readOwnership',
      error as Error
    );
  }

  // Normalize: zero address means renounced
  const owner = ownerAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase() ? null : ownerAddress;

  // ── pendingOwner() — optional (Ownable2Step only) ─────────────────
  let pendingOwner: string | undefined;
  try {
    const pendingOwnerAddress = (await client.readContract({
      address,
      abi: PENDING_OWNER_ABI,
      functionName: 'pendingOwner',
    })) as string;

    // Zero address means no pending transfer
    if (pendingOwnerAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
      pendingOwner = pendingOwnerAddress;
    }
  } catch {
    // Contract doesn't have pendingOwner (basic Ownable) — this is expected
    logger.debug(LOG_SYSTEM, `No pendingOwner() on ${contractAddress} (basic Ownable)`);
  }

  logger.debug(LOG_SYSTEM, `Ownership for ${contractAddress}:`, {
    owner,
    pendingOwner: pendingOwner ?? 'none',
  });

  return { owner, pendingOwner };
}

/**
 * Read the current default admin state from an AccessControlDefaultAdminRules contract.
 *
 * Calls `defaultAdmin()`, `pendingDefaultAdmin()`, and `defaultAdminDelay()`.
 * If `defaultAdmin()` returns the zero address, `defaultAdmin` is returned as `null` (renounced).
 * If `pendingDefaultAdmin()` returns the zero address as the new admin, no pending transfer
 * is indicated.
 *
 * @param rpcUrl - RPC endpoint URL
 * @param contractAddress - The EVM contract address (0x-prefixed)
 * @param viemChain - Optional viem Chain object for the network
 * @returns Admin read result with defaultAdmin, optional pendingDefaultAdmin and acceptSchedule
 * @throws OperationFailed if the `defaultAdmin()` call fails
 */
export async function getAdmin(
  rpcUrl: string,
  contractAddress: string,
  viemChain?: Chain
): Promise<AdminReadResult> {
  logger.info(LOG_SYSTEM, `Reading admin info for contract ${contractAddress}`);

  const client = createClient(rpcUrl, viemChain);
  const address = contractAddress as `0x${string}`;

  // ── defaultAdmin() ────────────────────────────────────────────────
  let adminAddress: string;
  try {
    adminAddress = (await client.readContract({
      address,
      abi: DEFAULT_ADMIN_ABI,
      functionName: 'defaultAdmin',
    })) as string;
  } catch (error) {
    logger.error(LOG_SYSTEM, `Failed to read defaultAdmin() for ${contractAddress}:`, error);
    throw new OperationFailed(
      `Failed to read admin info: ${(error as Error).message}`,
      contractAddress,
      'getAdmin',
      error as Error
    );
  }

  const defaultAdmin =
    adminAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase() ? null : adminAddress;

  // ── pendingDefaultAdmin() → (address newAdmin, uint48 schedule) ──
  let pendingDefaultAdmin: string | undefined;
  let acceptSchedule: number | undefined;

  try {
    const result = (await client.readContract({
      address,
      abi: PENDING_DEFAULT_ADMIN_ABI,
      functionName: 'pendingDefaultAdmin',
    })) as [string, bigint];

    const [newAdmin, schedule] = result;

    // Zero address means no pending transfer
    if (newAdmin.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
      pendingDefaultAdmin = newAdmin;
      acceptSchedule = Number(schedule);
    }
  } catch (error) {
    logger.warn(LOG_SYSTEM, `Failed to read pendingDefaultAdmin() for ${contractAddress}:`, error);
  }

  // ── defaultAdminDelay() → uint48 ────────────────────────────────
  let defaultAdminDelay: number | undefined;
  try {
    const delay = (await client.readContract({
      address,
      abi: DEFAULT_ADMIN_DELAY_ABI,
      functionName: 'defaultAdminDelay',
    })) as bigint;

    defaultAdminDelay = Number(delay);
  } catch (error) {
    logger.warn(LOG_SYSTEM, `Failed to read defaultAdminDelay() for ${contractAddress}:`, error);
  }

  logger.debug(LOG_SYSTEM, `Admin info for ${contractAddress}:`, {
    defaultAdmin,
    pendingDefaultAdmin: pendingDefaultAdmin ?? 'none',
    acceptSchedule,
    defaultAdminDelay,
  });

  return { defaultAdmin, pendingDefaultAdmin, acceptSchedule, defaultAdminDelay };
}

// ---------------------------------------------------------------------------
// Role Functions (Phase 5 — US3)
// ---------------------------------------------------------------------------

/**
 * Check if an account has a specific role on an AccessControl contract.
 *
 * Calls `hasRole(bytes32 role, address account)` and returns the boolean result.
 * Graceful degradation: returns `false` if the call reverts.
 *
 * @param rpcUrl - RPC endpoint URL
 * @param contractAddress - The EVM contract address (0x-prefixed)
 * @param roleId - bytes32 role identifier
 * @param account - Account address to check
 * @param viemChain - Optional viem Chain object
 * @returns true if the account has the role, false otherwise
 */
export async function hasRole(
  rpcUrl: string,
  contractAddress: string,
  roleId: string,
  account: string,
  viemChain?: Chain
): Promise<boolean> {
  logger.debug(LOG_SYSTEM, `Checking hasRole(${roleId}, ${account}) on ${contractAddress}`);

  const client = createClient(rpcUrl, viemChain);
  const address = contractAddress as `0x${string}`;

  try {
    const result = await client.readContract({
      address,
      abi: HAS_ROLE_ABI,
      functionName: 'hasRole',
      args: [roleId as `0x${string}`, account as `0x${string}`],
    });

    return result as boolean;
  } catch (error) {
    logger.debug(
      LOG_SYSTEM,
      `hasRole failed for ${roleId}/${account} on ${contractAddress}: ${(error as Error).message}`
    );
    return false;
  }
}

/**
 * Enumerate all members of a role using AccessControlEnumerable.
 *
 * Calls `getRoleMemberCount(role)` then `getRoleMember(role, index)` for each index.
 * Throws if `getRoleMemberCount` fails (contract may not be AccessControlEnumerable).
 *
 * @param rpcUrl - RPC endpoint URL
 * @param contractAddress - The EVM contract address (0x-prefixed)
 * @param roleId - bytes32 role identifier
 * @param viemChain - Optional viem Chain object
 * @returns Array of member addresses
 * @throws OperationFailed if getRoleMemberCount fails
 */
export async function enumerateRoleMembers(
  rpcUrl: string,
  contractAddress: string,
  roleId: string,
  viemChain?: Chain
): Promise<string[]> {
  logger.info(LOG_SYSTEM, `Enumerating members for role ${roleId} on ${contractAddress}`);

  const client = createClient(rpcUrl, viemChain);
  const address = contractAddress as `0x${string}`;

  // ── getRoleMemberCount ────────────────────────────────────────────
  let count: number;
  try {
    const rawCount = await client.readContract({
      address,
      abi: GET_ROLE_MEMBER_COUNT_ABI,
      functionName: 'getRoleMemberCount',
      args: [roleId as `0x${string}`],
    });
    count = Number(rawCount as bigint);
  } catch (error) {
    logger.error(LOG_SYSTEM, `Failed to get role member count for ${roleId}:`, error);
    throw new OperationFailed(
      `Failed to enumerate role members: ${(error as Error).message}`,
      contractAddress,
      'enumerateRoleMembers',
      error as Error
    );
  }

  if (count === 0) {
    logger.debug(LOG_SYSTEM, `Role ${roleId} has 0 members`);
    return [];
  }

  // ── getRoleMember for each index ──────────────────────────────────
  const members: string[] = [];
  for (let i = 0; i < count; i++) {
    try {
      const member = await client.readContract({
        address,
        abi: GET_ROLE_MEMBER_ABI,
        functionName: 'getRoleMember',
        args: [roleId as `0x${string}`, BigInt(i)],
      });
      members.push(member as string);
    } catch (error) {
      logger.warn(LOG_SYSTEM, `Failed to get role member at index ${i} for ${roleId}:`, error);
    }
  }

  logger.debug(LOG_SYSTEM, `Role ${roleId}: ${members.length} of ${count} members retrieved`);
  return members;
}

/**
 * Read current role assignments for provided role IDs.
 *
 * For each role ID, enumerates members (if `hasEnumerableRoles` is true) or
 * returns the role with an empty members array (caller must check membership
 * via `hasRole` or indexer).
 *
 * Labels are resolved from the optional roleLabelMap (external + ABI-extracted),
 * then the well-known dictionary (DEFAULT_ADMIN_ROLE, MINTER_ROLE, etc.).
 *
 * @param rpcUrl - RPC endpoint URL
 * @param contractAddress - The EVM contract address
 * @param roleIds - Array of bytes32 role identifiers
 * @param hasEnumerableRoles - Whether the contract supports AccessControlEnumerable
 * @param viemChain - Optional viem Chain object
 * @param roleLabelMap - Optional per-contract map of hash -> label for human-readable display
 * @returns Array of role assignments
 */
export async function readCurrentRoles(
  rpcUrl: string,
  contractAddress: string,
  roleIds: string[],
  hasEnumerableRoles: boolean,
  viemChain?: Chain,
  roleLabelMap?: Map<string, string>
): Promise<RoleAssignment[]> {
  logger.info(
    LOG_SYSTEM,
    `Reading ${roleIds.length} role(s) for contract ${contractAddress} (enumerable: ${hasEnumerableRoles})`
  );

  if (roleIds.length === 0) {
    return [];
  }

  const assignments: RoleAssignment[] = await Promise.all(
    roleIds.map(async (roleId) => {
      const role: RoleIdentifier = {
        id: roleId,
        label: resolveRoleLabel(roleId, roleLabelMap),
      };

      if (!hasEnumerableRoles) {
        // Without enumeration, return role with empty members
        // (caller will use hasRole checks or indexer to discover members)
        return { role, members: [] };
      }

      try {
        const members = await enumerateRoleMembers(rpcUrl, contractAddress, roleId, viemChain);
        return { role, members };
      } catch (error) {
        logger.warn(LOG_SYSTEM, `Failed to enumerate role ${roleId}:`, error);
        return { role, members: [] };
      }
    })
  );

  logger.info(
    LOG_SYSTEM,
    `Completed reading ${assignments.length} role(s) with ${assignments.reduce((sum, a) => sum + a.members.length, 0)} total members`
  );

  return assignments;
}

/**
 * Get the admin role for a given role.
 *
 * Calls `getRoleAdmin(bytes32 role)` and returns the admin role ID.
 * Returns null if the call fails.
 *
 * @param rpcUrl - RPC endpoint URL
 * @param contractAddress - The EVM contract address
 * @param roleId - bytes32 role identifier
 * @param viemChain - Optional viem Chain object
 * @returns The admin role ID (bytes32) or null if unavailable
 */
export async function getRoleAdmin(
  rpcUrl: string,
  contractAddress: string,
  roleId: string,
  viemChain?: Chain
): Promise<string | null> {
  logger.debug(LOG_SYSTEM, `Getting admin role for ${roleId} on ${contractAddress}`);

  const client = createClient(rpcUrl, viemChain);
  const address = contractAddress as `0x${string}`;

  try {
    const result = await client.readContract({
      address,
      abi: GET_ROLE_ADMIN_ABI,
      functionName: 'getRoleAdmin',
      args: [roleId as `0x${string}`],
    });

    return result as string;
  } catch (error) {
    logger.warn(LOG_SYSTEM, `Failed to get admin role for ${roleId}:`, error);
    return null;
  }
}

/**
 * Get the current block number from the RPC endpoint.
 *
 * @param rpcUrl - RPC endpoint URL
 * @param viemChain - Optional viem Chain object
 * @returns The current block number
 * @throws OperationFailed if the call fails
 */
export async function getCurrentBlock(rpcUrl: string, viemChain?: Chain): Promise<number> {
  logger.info(LOG_SYSTEM, `Fetching current block from ${rpcUrl}`);

  const client = createClient(rpcUrl, viemChain);

  try {
    const blockNumber = await client.getBlockNumber();
    const block = Number(blockNumber);

    logger.debug(LOG_SYSTEM, `Current block: ${block}`);
    return block;
  } catch (error) {
    logger.error(LOG_SYSTEM, 'Failed to get current block:', error);
    throw new OperationFailed(
      `Failed to get current block: ${(error as Error).message}`,
      rpcUrl,
      'getCurrentBlock',
      error as Error
    );
  }
}
