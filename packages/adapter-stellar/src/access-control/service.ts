/**
 * Stellar Access Control Service
 *
 * Implements the AccessControlService interface for Stellar (Soroban) contracts.
 * Provides methods to inspect and manage access control (Ownable/AccessControl) on contracts.
 */

import type {
  AccessControlCapabilities,
  AccessControlService,
  AccessSnapshot,
  ContractSchema,
  HistoryEntry,
  OperationResult,
  OwnershipInfo,
  RoleAssignment,
  StellarNetworkConfig,
} from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { detectAccessControlCapabilities } from './feature-detection';
import { getAdmin, readCurrentRoles, readOwnership } from './onchain-reader';

/**
 * Context for Stellar Access Control operations
 * Stores contract schema and role information for a specific contract
 */
interface StellarAccessControlContext {
  contractSchema: ContractSchema;
  knownRoleIds?: string[];
}

/**
 * Stellar implementation of AccessControlService
 */
export class StellarAccessControlService implements AccessControlService {
  private readonly contractContexts = new Map<string, StellarAccessControlContext>();

  constructor(private readonly networkConfig: StellarNetworkConfig) {}

  /**
   * Registers a contract with its schema and known roles
   *
   * @param contractAddress The contract address
   * @param contractSchema The contract schema (required for capability detection)
   * @param knownRoleIds Optional array of known role identifiers
   */
  registerContract(
    contractAddress: string,
    contractSchema: ContractSchema,
    knownRoleIds?: string[]
  ): void {
    this.contractContexts.set(contractAddress, {
      contractSchema,
      knownRoleIds,
    });

    logger.debug('StellarAccessControlService.registerContract', `Registered ${contractAddress}`, {
      roleCount: knownRoleIds?.length || 0,
    });
  }

  /**
   * Gets the access control capabilities of a contract
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to capabilities
   */
  async getCapabilities(contractAddress: string): Promise<AccessControlCapabilities> {
    logger.info(
      'StellarAccessControlService.getCapabilities',
      `Detecting capabilities for ${contractAddress}`
    );

    const context = this.contractContexts.get(contractAddress);
    if (!context) {
      throw new Error(`Contract ${contractAddress} not registered. Call registerContract() first.`);
    }

    // Check if indexer is configured
    const indexerAvailable = !!(this.networkConfig.indexerUri || this.networkConfig.indexerWsUri);

    const capabilities = detectAccessControlCapabilities(context.contractSchema, indexerAvailable);

    logger.debug('StellarAccessControlService.getCapabilities', 'Detected capabilities:', {
      hasOwnable: capabilities.hasOwnable,
      hasAccessControl: capabilities.hasAccessControl,
      hasEnumerableRoles: capabilities.hasEnumerableRoles,
      supportsHistory: capabilities.supportsHistory,
      verifiedAgainstOZInterfaces: capabilities.verifiedAgainstOZInterfaces,
    });

    return capabilities;
  }

  /**
   * Gets the current owner of an Ownable contract
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to ownership information
   */
  async getOwnership(contractAddress: string): Promise<OwnershipInfo> {
    logger.info('StellarAccessControlService.getOwnership', `Reading owner for ${contractAddress}`);

    return readOwnership(contractAddress, this.networkConfig);
  }

  /**
   * Gets current role assignments for a contract
   *
   * Uses the known role IDs registered with the contract. For contracts with enumerable roles,
   * the role IDs should be discovered and registered first.
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to array of role assignments
   */
  async getCurrentRoles(contractAddress: string): Promise<RoleAssignment[]> {
    logger.info(
      'StellarAccessControlService.getCurrentRoles',
      `Reading roles for ${contractAddress}`
    );

    const context = this.contractContexts.get(contractAddress);
    if (!context) {
      throw new Error(`Contract ${contractAddress} not registered. Call registerContract() first.`);
    }

    const roleIds = context.knownRoleIds || [];

    if (roleIds.length === 0) {
      logger.warn(
        'StellarAccessControlService.getCurrentRoles',
        'No role IDs registered for this contract, returning empty array'
      );
      return [];
    }

    return readCurrentRoles(contractAddress, roleIds, this.networkConfig);
  }

  /**
   * Grants a role to an account
   *
   * @param contractAddress The contract address
   * @param roleId The role identifier
   * @param account The account to grant the role to
   * @returns Promise resolving to operation result
   * @throws Error - Not yet implemented (US2)
   */
  async grantRole(
    contractAddress: string,
    roleId: string,
    account: string
  ): Promise<OperationResult> {
    logger.info(
      'StellarAccessControlService.grantRole',
      `Granting role ${roleId} to ${account} on ${contractAddress}`
    );

    throw new Error('grantRole not yet implemented (US2)');
  }

  /**
   * Revokes a role from an account
   *
   * @param contractAddress The contract address
   * @param roleId The role identifier
   * @param account The account to revoke the role from
   * @returns Promise resolving to operation result
   * @throws Error - Not yet implemented (US2)
   */
  async revokeRole(
    contractAddress: string,
    roleId: string,
    account: string
  ): Promise<OperationResult> {
    logger.info(
      'StellarAccessControlService.revokeRole',
      `Revoking role ${roleId} from ${account} on ${contractAddress}`
    );

    throw new Error('revokeRole not yet implemented (US2)');
  }

  /**
   * Transfers ownership of the contract
   *
   * @param contractAddress The contract address
   * @param newOwner The new owner address
   * @returns Promise resolving to operation result
   * @throws Error - Not yet implemented (US3)
   */
  async transferOwnership(contractAddress: string, newOwner: string): Promise<OperationResult> {
    logger.info(
      'StellarAccessControlService.transferOwnership',
      `Transferring ownership to ${newOwner} on ${contractAddress}`
    );

    throw new Error('transferOwnership not yet implemented (US3)');
  }

  /**
   * Exports a snapshot of current access control state
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to access snapshot
   */
  async exportSnapshot(contractAddress: string): Promise<AccessSnapshot> {
    logger.info(
      'StellarAccessControlService.exportSnapshot',
      `Exporting snapshot for ${contractAddress}`
    );

    // Read ownership (if supported)
    let ownership: OwnershipInfo | undefined;
    try {
      ownership = await this.getOwnership(contractAddress);
    } catch (error) {
      logger.debug('StellarAccessControlService.exportSnapshot', 'Ownership not available:', error);
      // Contract may not be Ownable, continue without ownership
    }

    // Read roles (if contract is registered and has roles)
    let roles: RoleAssignment[] = [];
    try {
      roles = await this.getCurrentRoles(contractAddress);
    } catch (error) {
      logger.debug('StellarAccessControlService.exportSnapshot', 'Roles not available:', error);
      // Contract may not be registered or have no roles, continue with empty roles array
    }

    logger.debug('StellarAccessControlService.exportSnapshot', 'Snapshot created:', {
      hasOwnership: !!ownership?.owner,
      roleCount: roles.length,
    });

    return {
      roles,
      ownership,
    };
  }

  /**
   * Gets history of role changes
   *
   * @param contractAddress The contract address
   * @param options Optional filtering options
   * @returns Promise resolving to array of history entries, or empty array if not supported
   * @throws Error - Not yet implemented (US5)
   */
  async getHistory(
    contractAddress: string,
    options?: {
      roleId?: string;
      account?: string;
      limit?: number;
    }
  ): Promise<HistoryEntry[]> {
    logger.info(
      'StellarAccessControlService.getHistory',
      `Fetching history for ${contractAddress}`,
      options
    );

    throw new Error('getHistory not yet implemented (US5)');
  }

  /**
   * Helper to get the admin account (AccessControl contracts only)
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to admin address or null
   */
  async getAdminAccount(contractAddress: string): Promise<string | null> {
    logger.info(
      'StellarAccessControlService.getAdminAccount',
      `Reading admin for ${contractAddress}`
    );

    return getAdmin(contractAddress, this.networkConfig);
  }
}

/**
 * Factory function to create a StellarAccessControlService instance
 *
 * @param networkConfig The Stellar network configuration
 * @returns A new StellarAccessControlService instance
 */
export function createStellarAccessControlService(
  networkConfig: StellarNetworkConfig
): StellarAccessControlService {
  return new StellarAccessControlService(networkConfig);
}
