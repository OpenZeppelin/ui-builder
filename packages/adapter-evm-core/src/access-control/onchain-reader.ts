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
 *
 * Future phases will add: `hasRole`, `enumerateRoleMembers`, `readCurrentRoles`,
 * `getRoleAdmin`, `getCurrentBlock`.
 *
 * @module access-control/onchain-reader
 * @see quickstart.md §Step 3
 * @see research.md §R1 — On-Chain Read Strategy
 */

import { createPublicClient, http, type Chain } from 'viem';

import { OperationFailed } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import {
  DEFAULT_ADMIN_ABI,
  DEFAULT_ADMIN_DELAY_ABI,
  OWNER_ABI,
  PENDING_DEFAULT_ADMIN_ABI,
  PENDING_OWNER_ABI,
} from './abis';
import { ZERO_ADDRESS } from './constants';

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

/**
 * Creates a viem public client for a given RPC URL and optional chain.
 * If viemChain is not provided, creates a minimal chain config.
 */
function createClient(rpcUrl: string, viemChain?: Chain) {
  const chain = viemChain ?? {
    id: 1,
    name: 'Unknown',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
  };

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
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
