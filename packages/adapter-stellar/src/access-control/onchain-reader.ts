/**
 * On-Chain Reader Module
 *
 * Reads current access control state (ownership and roles) from Stellar (Soroban) contracts
 * using on-chain queries. Supports both Ownable and AccessControl patterns.
 */

import { rpc as StellarRpc } from '@stellar/stellar-sdk';

import type {
  ContractSchema,
  OwnershipInfo,
  RoleAssignment,
  RoleIdentifier,
  StellarNetworkConfig,
} from '@openzeppelin/ui-builder-types';
import { OperationFailed } from '@openzeppelin/ui-builder-types';
import {
  DEFAULT_CONCURRENCY_LIMIT,
  logger,
  promiseAllWithLimit,
} from '@openzeppelin/ui-builder-utils';

import { queryStellarViewFunction } from '../query/handler';

/**
 * Helper to load a minimal contract schema for access control functions
 * This allows us to use the existing query infrastructure
 */
function createMinimalSchema(
  contractAddress: string,
  functionName: string,
  inputs: Array<{ name: string; type: string }> = [],
  outputType = 'Val'
): ContractSchema {
  return {
    ecosystem: 'stellar',
    address: contractAddress,
    functions: [
      {
        id: functionName,
        name: functionName,
        displayName: functionName,
        type: 'function',
        inputs,
        outputs: [{ name: 'result', type: outputType }],
        modifiesState: false,
        stateMutability: 'view',
      },
    ],
  };
}

/**
 * Simple wrapper around queryStellarViewFunction for access control queries
 */
async function queryAccessControlFunction(
  contractAddress: string,
  functionName: string,
  params: unknown[],
  networkConfig: StellarNetworkConfig,
  inputs: Array<{ name: string; type: string }> = []
): Promise<unknown> {
  const schema = createMinimalSchema(contractAddress, functionName, inputs);
  return queryStellarViewFunction(contractAddress, functionName, networkConfig, params, schema);
}

/**
 * Reads the current owner from an Ownable contract
 *
 * @param contractAddress The contract address
 * @param networkConfig The network configuration
 * @returns Ownership information
 */
export async function readOwnership(
  contractAddress: string,
  networkConfig: StellarNetworkConfig
): Promise<OwnershipInfo> {
  logger.info('readOwnership', `Reading owner for contract ${contractAddress}`);

  try {
    const result = await queryAccessControlFunction(
      contractAddress,
      'get_owner',
      [],
      networkConfig
    );

    // get_owner returns Option<Address>
    if (result === undefined || result === null) {
      return { owner: null };
    }

    const ownerAddress = typeof result === 'string' ? result : String(result);
    logger.debug('readOwnership', `Owner: ${ownerAddress}`);

    return { owner: ownerAddress };
  } catch (error) {
    logger.error('readOwnership', 'Failed to read ownership:', error);
    throw new OperationFailed(
      `Failed to read ownership: ${(error as Error).message}`,
      contractAddress,
      'readOwnership',
      error as Error
    );
  }
}

/**
 * Pending owner information from on-chain query
 *
 * Returned by {@link readPendingOwner} when a two-step ownership transfer is pending.
 * Contains the pending owner address and expiration ledger sequence.
 *
 * @example
 * ```typescript
 * const pending = await readPendingOwner(contractAddress, networkConfig);
 * if (pending) {
 *   console.log(`Pending owner: ${pending.pendingOwner}`);
 *   console.log(`Expires at ledger: ${pending.liveUntilLedger}`);
 * }
 * ```
 */
export interface PendingOwnerInfo {
  /** The address of the pending new owner */
  pendingOwner: string;
  /** The ledger sequence by which the transfer must be accepted (expiration) */
  liveUntilLedger: number;
}

/**
 * Reads the pending owner from a two-step Ownable contract
 *
 * Calls `get_pending_owner()` which returns `Option<(Address, u32)>` where:
 * - Address: the pending new owner
 * - u32: the live_until_ledger (expiration)
 *
 * @param contractAddress The contract address
 * @param networkConfig The network configuration
 * @returns Pending owner info, or null if no pending transfer
 */
export async function readPendingOwner(
  contractAddress: string,
  networkConfig: StellarNetworkConfig
): Promise<PendingOwnerInfo | null> {
  logger.info('readPendingOwner', `Reading pending owner for contract ${contractAddress}`);

  try {
    const result = await queryAccessControlFunction(
      contractAddress,
      'get_pending_owner',
      [],
      networkConfig
    );

    // get_pending_owner returns Option<(Address, u32)>
    // When there's no pending owner, returns None (null/undefined)
    if (result === undefined || result === null) {
      logger.debug('readPendingOwner', 'No pending owner');
      return null;
    }

    // Result should be a tuple [Address, u32]
    if (Array.isArray(result) && result.length === 2) {
      const pendingOwner = typeof result[0] === 'string' ? result[0] : String(result[0]);
      const liveUntilLedger =
        typeof result[1] === 'number' ? result[1] : parseInt(String(result[1]), 10);

      logger.debug(
        'readPendingOwner',
        `Pending owner: ${pendingOwner}, expires at ledger: ${liveUntilLedger}`
      );

      return { pendingOwner, liveUntilLedger };
    }

    // Handle case where result is an object with named fields
    // Note: null already handled above, and Soroban RPC won't return Date/RegExp
    if (typeof result === 'object') {
      const obj = result as Record<string, unknown>;
      const pendingOwner = obj.pendingOwner || obj[0];
      const liveUntilLedger = obj.liveUntilLedger || obj[1];

      if (pendingOwner !== undefined && liveUntilLedger !== undefined) {
        return {
          pendingOwner: String(pendingOwner),
          liveUntilLedger: Number(liveUntilLedger),
        };
      }
    }

    logger.warn('readPendingOwner', `Unexpected result format: ${JSON.stringify(result)}`);
    return null;
  } catch (error) {
    // Contract may not support two-step ownership - this is not an error
    logger.debug(
      'readPendingOwner',
      `get_pending_owner not available: ${(error as Error).message}`
    );
    return null;
  }
}

/**
 * Checks if an account has a specific role
 *
 * @param contractAddress The contract address
 * @param roleId The role identifier (Symbol)
 * @param account The account address to check
 * @param networkConfig The network configuration
 * @returns True if the account has the role, false otherwise
 */
export async function hasRole(
  contractAddress: string,
  roleId: string,
  account: string,
  networkConfig: StellarNetworkConfig
): Promise<boolean> {
  logger.debug('hasRole', `Checking role ${roleId} for ${account}`);

  try {
    const inputs = [
      { name: 'account', type: 'Address' },
      { name: 'role', type: 'Symbol' },
    ];
    const result = await queryAccessControlFunction(
      contractAddress,
      'has_role',
      [account, roleId],
      networkConfig,
      inputs
    );

    // has_role returns Option<u32> (Some(index) if has role, None otherwise)
    return typeof result === 'number';
  } catch (error) {
    logger.error('hasRole', `Failed to check role ${roleId}:`, error);
    return false;
  }
}

/**
 * Gets the count of members for a specific role
 *
 * @param contractAddress The contract address
 * @param roleId The role identifier (Symbol)
 * @param networkConfig The network configuration
 * @returns The count of role members
 */
export async function getRoleMemberCount(
  contractAddress: string,
  roleId: string,
  networkConfig: StellarNetworkConfig
): Promise<number> {
  logger.debug('getRoleMemberCount', `Getting member count for role ${roleId}`);

  try {
    const inputs = [{ name: 'role', type: 'Symbol' }];
    const result = await queryAccessControlFunction(
      contractAddress,
      'get_role_member_count',
      [roleId],
      networkConfig,
      inputs
    );

    // Handle both number and string results (formatter may return string for large numbers)
    if (typeof result === 'number') {
      return result;
    }
    if (typeof result === 'string') {
      const parsed = parseInt(result, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  } catch (error) {
    logger.error('getRoleMemberCount', `Failed to get member count for role ${roleId}:`, error);
    return 0;
  }
}

/**
 * Gets the member address at a specific index for a role
 *
 * @param contractAddress The contract address
 * @param roleId The role identifier (Symbol)
 * @param index The index of the member to retrieve
 * @param networkConfig The network configuration
 * @returns The member address, or null if index out of bounds
 */
export async function getRoleMember(
  contractAddress: string,
  roleId: string,
  index: number,
  networkConfig: StellarNetworkConfig
): Promise<string | null> {
  logger.debug('getRoleMember', `Getting member at index ${index} for role ${roleId}`);

  try {
    const inputs = [
      { name: 'role', type: 'Symbol' },
      { name: 'index', type: 'u32' },
    ];
    const result = await queryAccessControlFunction(
      contractAddress,
      'get_role_member',
      [roleId, index],
      networkConfig,
      inputs
    );

    if (result === undefined || result === null) {
      return null;
    }

    return String(result);
  } catch (error) {
    logger.error('getRoleMember', `Failed to get role member at index ${index}:`, error);
    return null;
  }
}

/**
 * Enumerates all members of a specific role
 *
 * Fetches all members in parallel with controlled concurrency for improved
 * performance while avoiding overwhelming RPC endpoints.
 *
 * @param contractAddress The contract address
 * @param roleId The role identifier (Symbol)
 * @param networkConfig The network configuration
 * @returns Array of member addresses
 */
export async function enumerateRoleMembers(
  contractAddress: string,
  roleId: string,
  networkConfig: StellarNetworkConfig
): Promise<string[]> {
  logger.info('enumerateRoleMembers', `Enumerating members for role ${roleId}`);

  try {
    // Get the count of members
    const count = await getRoleMemberCount(contractAddress, roleId, networkConfig);

    logger.debug('enumerateRoleMembers', `Role ${roleId} has ${count} members`);

    if (count === 0) {
      return [];
    }

    // Create task functions for controlled concurrent execution
    const memberTasks = Array.from(
      { length: count },
      (_, i) => () => getRoleMember(contractAddress, roleId, i, networkConfig)
    );

    // Fetch members with concurrency limit to avoid overwhelming RPC endpoints
    const results = await promiseAllWithLimit(memberTasks, DEFAULT_CONCURRENCY_LIMIT);

    // Filter out null results and return valid members
    const members = results.filter((m): m is string => m !== null);

    logger.debug('enumerateRoleMembers', `Retrieved ${members.length} members for role ${roleId}`);

    return members;
  } catch (error) {
    logger.error('enumerateRoleMembers', `Failed to enumerate role ${roleId}:`, error);
    throw new OperationFailed(
      `Failed to enumerate role members: ${(error as Error).message}`,
      contractAddress,
      'enumerateRoleMembers',
      error as Error
    );
  }
}

/**
 * Reads all current role assignments for a contract
 *
 * Fetches all roles in parallel for improved performance.
 *
 * @param contractAddress The contract address
 * @param roleIds Array of role identifiers to query
 * @param networkConfig The network configuration
 * @returns Array of role assignments
 */
export async function readCurrentRoles(
  contractAddress: string,
  roleIds: string[],
  networkConfig: StellarNetworkConfig
): Promise<RoleAssignment[]> {
  logger.info(
    'readCurrentRoles',
    `Reading ${roleIds.length} roles for contract ${contractAddress}`
  );

  if (roleIds.length === 0) {
    return [];
  }

  // Process all roles in parallel for improved performance
  const assignmentPromises = roleIds.map(async (roleId) => {
    const role: RoleIdentifier = {
      id: roleId,
      label: roleId.replace(/_/g, ' ').toLowerCase(),
    };

    try {
      const members = await enumerateRoleMembers(contractAddress, roleId, networkConfig);

      logger.debug('readCurrentRoles', `Role ${roleId} has ${members.length} members`);

      return {
        role,
        members,
      };
    } catch (error) {
      logger.warn('readCurrentRoles', `Failed to read role ${roleId}:`, error);
      // Return role with empty members array to maintain array length consistency
      return {
        role,
        members: [],
      };
    }
  });

  const assignments = await Promise.all(assignmentPromises);

  logger.info(
    'readCurrentRoles',
    `Completed reading ${assignments.length} roles with ${assignments.reduce((sum, a) => sum + a.members.length, 0)} total members`
  );

  return assignments;
}

/**
 * Gets the admin role for a specific role
 *
 * @param contractAddress The contract address
 * @param roleId The role identifier (Symbol)
 * @param networkConfig The network configuration
 * @returns The admin role identifier, or null if no admin role set
 */
export async function getRoleAdmin(
  contractAddress: string,
  roleId: string,
  networkConfig: StellarNetworkConfig
): Promise<string | null> {
  logger.debug('getRoleAdmin', `Getting admin role for ${roleId}`);

  try {
    const inputs = [{ name: 'role', type: 'Symbol' }];
    const result = await queryAccessControlFunction(
      contractAddress,
      'get_role_admin',
      [roleId],
      networkConfig,
      inputs
    );

    // get_role_admin returns Option<Symbol>
    if (result === undefined || result === null) {
      return null;
    }

    return String(result);
  } catch (error) {
    logger.error('getRoleAdmin', `Failed to get admin role for ${roleId}:`, error);
    return null;
  }
}

/**
 * Gets the top-level admin account
 *
 * @param contractAddress The contract address
 * @param networkConfig The network configuration
 * @returns The admin address, or null if no admin set
 */
export async function getAdmin(
  contractAddress: string,
  networkConfig: StellarNetworkConfig
): Promise<string | null> {
  logger.info('getAdmin', `Reading admin for contract ${contractAddress}`);

  try {
    const result = await queryAccessControlFunction(
      contractAddress,
      'get_admin',
      [],
      networkConfig
    );

    // get_admin returns Option<Address>
    if (result === undefined || result === null) {
      return null;
    }

    return String(result);
  } catch (error) {
    logger.error('getAdmin', 'Failed to read admin:', error);
    return null;
  }
}

/**
 * Gets the current ledger sequence number from the Soroban RPC
 *
 * Used for two-step Ownable contracts to:
 * - Calculate appropriate expiration ledgers for ownership transfers
 * - Validate expiration ledgers before submitting transactions
 * - Determine if pending ownership transfers have expired
 *
 * @param networkConfig The network configuration containing the Soroban RPC URL
 * @returns Promise resolving to the current ledger sequence number
 * @throws OperationFailed if the RPC call fails
 *
 * @example
 * ```typescript
 * const currentLedger = await getCurrentLedger(networkConfig);
 * // Set expiration to ~1 hour from now (~720 ledgers at 5s/ledger)
 * const expirationLedger = currentLedger + 720;
 * ```
 */
export async function getCurrentLedger(networkConfig: StellarNetworkConfig): Promise<number> {
  logger.info('getCurrentLedger', `Fetching current ledger from ${networkConfig.sorobanRpcUrl}`);

  try {
    const server = new StellarRpc.Server(networkConfig.sorobanRpcUrl);
    const latestLedger = await server.getLatestLedger();

    logger.debug('getCurrentLedger', `Current ledger: ${latestLedger.sequence}`);

    return latestLedger.sequence;
  } catch (error) {
    logger.error('getCurrentLedger', 'Failed to fetch current ledger:', error);
    throw new OperationFailed(
      `Failed to get current ledger: ${(error as Error).message}`,
      networkConfig.sorobanRpcUrl,
      'getCurrentLedger',
      error as Error
    );
  }
}
