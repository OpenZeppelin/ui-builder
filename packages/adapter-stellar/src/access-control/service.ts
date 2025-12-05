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
  ExecutionConfig,
  HistoryEntry,
  OperationResult,
  OwnershipInfo,
  RoleAssignment,
  StellarNetworkConfig,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/ui-builder-types';
import { ConfigurationInvalid, OperationFailed } from '@openzeppelin/ui-builder-types';
import { logger, validateSnapshot } from '@openzeppelin/ui-builder-utils';

import { signAndBroadcastStellarTransaction } from '../transaction/sender';
import {
  assembleGrantRoleAction,
  assembleRevokeRoleAction,
  assembleTransferOwnershipAction,
} from './actions';
import { detectAccessControlCapabilities } from './feature-detection';
import { createIndexerClient, StellarIndexerClient } from './indexer-client';
import { getAdmin, readCurrentRoles, readOwnership } from './onchain-reader';
import {
  validateAccountAddress,
  validateAddress,
  validateContractAddress,
  validateRoleIds,
} from './validation';

/**
 * Context for Stellar Access Control operations
 * Stores contract schema and role information for a specific contract
 */
interface StellarAccessControlContext {
  contractSchema: ContractSchema;
  /** Role IDs explicitly provided via registerContract() */
  knownRoleIds?: string[];
  /** Role IDs discovered via indexer query (cached) */
  discoveredRoleIds?: string[];
  /** Flag to prevent repeated discovery attempts when indexer is unavailable */
  roleDiscoveryAttempted?: boolean;
}

/**
 * Stellar implementation of AccessControlService
 */
export class StellarAccessControlService implements AccessControlService {
  private readonly contractContexts = new Map<string, StellarAccessControlContext>();
  private readonly indexerClient: StellarIndexerClient;

  constructor(private readonly networkConfig: StellarNetworkConfig) {
    this.indexerClient = createIndexerClient(networkConfig);
  }

  /**
   * Registers a contract with its schema and known roles
   *
   * @param contractAddress The contract address
   * @param contractSchema The contract schema (required for capability detection)
   * @param knownRoleIds Optional array of known role identifiers
   * @throws ConfigurationInvalid if the contract address or role IDs are invalid
   */
  registerContract(
    contractAddress: string,
    contractSchema: ContractSchema,
    knownRoleIds?: string[]
  ): void {
    // Validate contract address
    validateContractAddress(contractAddress);

    // Validate and deduplicate role IDs if provided
    const validatedRoleIds = knownRoleIds ? validateRoleIds(knownRoleIds) : undefined;

    this.contractContexts.set(contractAddress, {
      contractSchema,
      knownRoleIds: validatedRoleIds,
    });

    logger.debug('StellarAccessControlService.registerContract', `Registered ${contractAddress}`, {
      roleCount: validatedRoleIds?.length || 0,
    });
  }

  /**
   * Adds additional known role IDs to a registered contract
   *
   * This method allows consumers to manually add role IDs that may not have been
   * discovered via the indexer (e.g., newly created roles that haven't been granted yet).
   * Role IDs are validated and deduplicated before being added.
   *
   * @param contractAddress The contract address
   * @param roleIds Array of role identifiers to add
   * @throws ConfigurationInvalid if the contract address is invalid, contract not registered, or role IDs are invalid
   * @returns The updated array of all known role IDs for the contract
   */
  addKnownRoleIds(contractAddress: string, roleIds: string[]): string[] {
    // Validate contract address
    validateContractAddress(contractAddress);

    const context = this.contractContexts.get(contractAddress);
    if (!context) {
      throw new ConfigurationInvalid(
        'Contract not registered. Call registerContract() first.',
        contractAddress,
        'contractAddress'
      );
    }

    // Validate the new role IDs
    const validatedNewRoleIds = validateRoleIds(roleIds);

    if (validatedNewRoleIds.length === 0) {
      logger.debug(
        'StellarAccessControlService.addKnownRoleIds',
        `No valid role IDs to add for ${contractAddress}`
      );
      return context.knownRoleIds || context.discoveredRoleIds || [];
    }

    // Merge with existing role IDs (prioritize knownRoleIds over discoveredRoleIds)
    const existingRoleIds = context.knownRoleIds || context.discoveredRoleIds || [];
    const mergedRoleIds = [...new Set([...existingRoleIds, ...validatedNewRoleIds])];

    // Update the context - always store as knownRoleIds since user is explicitly providing them
    context.knownRoleIds = mergedRoleIds;

    logger.info(
      'StellarAccessControlService.addKnownRoleIds',
      `Added ${validatedNewRoleIds.length} role ID(s) for ${contractAddress}`,
      {
        added: validatedNewRoleIds,
        total: mergedRoleIds.length,
      }
    );

    return mergedRoleIds;
  }

  /**
   * Gets the access control capabilities of a contract
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to capabilities
   * @throws ConfigurationInvalid if the contract address is invalid or contract not registered
   */
  async getCapabilities(contractAddress: string): Promise<AccessControlCapabilities> {
    // Validate contract address
    validateContractAddress(contractAddress);

    logger.info(
      'StellarAccessControlService.getCapabilities',
      `Detecting capabilities for ${contractAddress}`
    );

    const context = this.contractContexts.get(contractAddress);
    if (!context) {
      throw new ConfigurationInvalid(
        'Contract not registered. Call registerContract() first.',
        contractAddress,
        'contractAddress'
      );
    }

    // Check if indexer is configured
    const indexerAvailable = await this.indexerClient.checkAvailability();

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
   * @throws ConfigurationInvalid if the contract address is invalid
   */
  async getOwnership(contractAddress: string): Promise<OwnershipInfo> {
    // Validate contract address
    validateContractAddress(contractAddress);

    logger.info('StellarAccessControlService.getOwnership', `Reading owner for ${contractAddress}`);

    return readOwnership(contractAddress, this.networkConfig);
  }

  /**
   * Gets current role assignments for a contract
   *
   * Uses the known role IDs registered with the contract. If no role IDs were provided
   * via registerContract(), attempts to discover them dynamically via the indexer.
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to array of role assignments
   * @throws ConfigurationInvalid if the contract address is invalid or contract not registered
   */
  async getCurrentRoles(contractAddress: string): Promise<RoleAssignment[]> {
    // Validate contract address
    validateContractAddress(contractAddress);

    logger.info(
      'StellarAccessControlService.getCurrentRoles',
      `Reading roles for ${contractAddress}`
    );

    const context = this.contractContexts.get(contractAddress);
    if (!context) {
      throw new ConfigurationInvalid(
        'Contract not registered. Call registerContract() first.',
        contractAddress,
        'contractAddress'
      );
    }

    // Use known role IDs if provided, otherwise attempt discovery
    let roleIds = context.knownRoleIds || [];

    if (roleIds.length === 0) {
      // Attempt to discover roles via indexer
      logger.debug(
        'StellarAccessControlService.getCurrentRoles',
        'No role IDs provided, attempting discovery via indexer'
      );
      roleIds = await this.discoverKnownRoleIds(contractAddress);
    }

    if (roleIds.length === 0) {
      logger.warn(
        'StellarAccessControlService.getCurrentRoles',
        'No role IDs available (neither provided nor discoverable), returning empty array'
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
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result
   * @throws ConfigurationInvalid if addresses are invalid
   */
  async grantRole(
    contractAddress: string,
    roleId: string,
    account: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    // Validate addresses
    validateContractAddress(contractAddress);
    validateAccountAddress(account, 'account');

    logger.info(
      'StellarAccessControlService.grantRole',
      `Granting role ${roleId} to ${account} on ${contractAddress}`
    );

    // Assemble the transaction data
    const txData = assembleGrantRoleAction(contractAddress, roleId, account);

    logger.debug('StellarAccessControlService.grantRole', 'Transaction data prepared:', {
      contractAddress: txData.contractAddress,
      functionName: txData.functionName,
      argTypes: txData.argTypes,
    });

    // Execute the transaction
    const result = await signAndBroadcastStellarTransaction(
      txData,
      executionConfig,
      this.networkConfig,
      onStatusChange,
      runtimeApiKey
    );

    logger.info('StellarAccessControlService.grantRole', `Role granted. TxHash: ${result.txHash}`);

    return { id: result.txHash };
  }

  /**
   * Revokes a role from an account
   *
   * @param contractAddress The contract address
   * @param roleId The role identifier
   * @param account The account to revoke the role from
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result
   * @throws ConfigurationInvalid if addresses are invalid
   */
  async revokeRole(
    contractAddress: string,
    roleId: string,
    account: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    // Validate addresses
    validateContractAddress(contractAddress);
    validateAccountAddress(account, 'account');

    logger.info(
      'StellarAccessControlService.revokeRole',
      `Revoking role ${roleId} from ${account} on ${contractAddress}`
    );

    // Assemble the transaction data
    const txData = assembleRevokeRoleAction(contractAddress, roleId, account);

    logger.debug('StellarAccessControlService.revokeRole', 'Transaction data prepared:', {
      contractAddress: txData.contractAddress,
      functionName: txData.functionName,
      argTypes: txData.argTypes,
    });

    // Execute the transaction
    const result = await signAndBroadcastStellarTransaction(
      txData,
      executionConfig,
      this.networkConfig,
      onStatusChange,
      runtimeApiKey
    );

    logger.info('StellarAccessControlService.revokeRole', `Role revoked. TxHash: ${result.txHash}`);

    return { id: result.txHash };
  }

  /**
   * Transfers ownership of the contract
   *
   * @param contractAddress The contract address
   * @param newOwner The new owner address
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result with transaction ID
   * @throws ConfigurationInvalid if addresses are invalid
   */
  async transferOwnership(
    contractAddress: string,
    newOwner: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    // Validate addresses
    // newOwner can be either an account address (G...) or contract address (C...)
    validateContractAddress(contractAddress);
    validateAddress(newOwner, 'newOwner');

    logger.info(
      'StellarAccessControlService.transferOwnership',
      `Transferring ownership to ${newOwner} on ${contractAddress}`
    );

    // Assemble the transaction data
    const txData = assembleTransferOwnershipAction(contractAddress, newOwner);

    logger.debug('StellarAccessControlService.transferOwnership', 'Transaction data prepared:', {
      contractAddress: txData.contractAddress,
      functionName: txData.functionName,
      argTypes: txData.argTypes,
    });

    // Execute the transaction
    const result = await signAndBroadcastStellarTransaction(
      txData,
      executionConfig,
      this.networkConfig,
      onStatusChange,
      runtimeApiKey
    );

    logger.info(
      'StellarAccessControlService.transferOwnership',
      `Ownership transferred. TxHash: ${result.txHash}`
    );

    return { id: result.txHash };
  }

  /**
   * Exports a snapshot of current access control state
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to access snapshot
   * @throws Error if snapshot validation fails
   * @throws ConfigurationInvalid if the contract address is invalid
   */
  async exportSnapshot(contractAddress: string): Promise<AccessSnapshot> {
    // Validate contract address
    validateContractAddress(contractAddress);

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

    const snapshot: AccessSnapshot = {
      roles,
      ownership,
    };

    // Validate snapshot using utils
    if (!validateSnapshot(snapshot)) {
      const errorMsg = `Invalid snapshot structure for contract ${contractAddress}`;
      logger.error('StellarAccessControlService.exportSnapshot', errorMsg);
      throw new OperationFailed(errorMsg, contractAddress, 'exportSnapshot');
    }

    logger.debug('StellarAccessControlService.exportSnapshot', 'Snapshot created and validated:', {
      hasOwnership: !!ownership?.owner,
      roleCount: roles.length,
      totalMembers: roles.reduce((sum, r) => sum + r.members.length, 0),
    });

    return snapshot;
  }

  /**
   * Gets history of role changes
   *
   * @param contractAddress The contract address
   * @param options Optional filtering options
   * @returns Promise resolving to array of history entries, or empty array if not supported
   * @throws ConfigurationInvalid if the contract address is invalid
   */
  async getHistory(
    contractAddress: string,
    options?: {
      roleId?: string;
      account?: string;
      limit?: number;
    }
  ): Promise<HistoryEntry[]> {
    // Validate contract address
    validateContractAddress(contractAddress);

    // Validate account if provided
    if (options?.account) {
      validateAccountAddress(options.account, 'options.account');
    }

    logger.info(
      'StellarAccessControlService.getHistory',
      `Fetching history for ${contractAddress}`,
      options
    );

    const isAvailable = await this.indexerClient.checkAvailability();
    if (!isAvailable) {
      logger.warn(
        'StellarAccessControlService.getHistory',
        `Indexer not available for network ${this.networkConfig.id}, returning empty history`
      );
      return [];
    }

    return this.indexerClient.queryHistory(contractAddress, options);
  }

  /**
   * Helper to get the admin account (AccessControl contracts only)
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to admin address or null
   * @throws ConfigurationInvalid if the contract address is invalid
   */
  async getAdminAccount(contractAddress: string): Promise<string | null> {
    // Validate contract address
    validateContractAddress(contractAddress);

    logger.info(
      'StellarAccessControlService.getAdminAccount',
      `Reading admin for ${contractAddress}`
    );

    return getAdmin(contractAddress, this.networkConfig);
  }

  /**
   * Discovers known role IDs for a contract by querying historical events from the indexer
   *
   * This method queries all role_granted and role_revoked events from the indexer and
   * extracts unique role identifiers. Results are cached to avoid repeated queries.
   *
   * If knownRoleIds were provided via registerContract(), those take precedence and
   * this method returns them without querying the indexer.
   *
   * @param contractAddress The contract address to discover roles for
   * @returns Promise resolving to array of unique role identifiers
   * @throws ConfigurationInvalid if contract address is invalid or contract not registered
   */
  async discoverKnownRoleIds(contractAddress: string): Promise<string[]> {
    // Validate contract address
    validateContractAddress(contractAddress);

    const context = this.contractContexts.get(contractAddress);
    if (!context) {
      throw new ConfigurationInvalid(
        'Contract not registered. Call registerContract() first.',
        contractAddress,
        'contractAddress'
      );
    }

    // If knownRoleIds were explicitly provided, return them (they take precedence)
    if (context.knownRoleIds && context.knownRoleIds.length > 0) {
      logger.debug(
        'StellarAccessControlService.discoverKnownRoleIds',
        `Using ${context.knownRoleIds.length} explicitly provided role IDs for ${contractAddress}`
      );
      return context.knownRoleIds;
    }

    // Return cached discovered roles if available
    if (context.discoveredRoleIds) {
      logger.debug(
        'StellarAccessControlService.discoverKnownRoleIds',
        `Using ${context.discoveredRoleIds.length} cached discovered role IDs for ${contractAddress}`
      );
      return context.discoveredRoleIds;
    }

    // If we already attempted discovery and found nothing, don't retry
    if (context.roleDiscoveryAttempted) {
      logger.debug(
        'StellarAccessControlService.discoverKnownRoleIds',
        `Discovery already attempted for ${contractAddress}, returning empty array`
      );
      return [];
    }

    logger.info(
      'StellarAccessControlService.discoverKnownRoleIds',
      `Discovering role IDs via indexer for ${contractAddress}`
    );

    // Check if indexer is available
    const isAvailable = await this.indexerClient.checkAvailability();
    if (!isAvailable) {
      logger.warn(
        'StellarAccessControlService.discoverKnownRoleIds',
        `Indexer not available for network ${this.networkConfig.id}, cannot discover roles`
      );
      // Mark as attempted so we don't retry
      context.roleDiscoveryAttempted = true;
      return [];
    }

    try {
      // Query indexer for unique role IDs
      const roleIds = await this.indexerClient.discoverRoleIds(contractAddress);

      // Cache the results
      context.discoveredRoleIds = roleIds;
      context.roleDiscoveryAttempted = true;

      logger.info(
        'StellarAccessControlService.discoverKnownRoleIds',
        `Discovered ${roleIds.length} role(s) for ${contractAddress}`,
        { roles: roleIds }
      );

      return roleIds;
    } catch (error) {
      logger.error(
        'StellarAccessControlService.discoverKnownRoleIds',
        `Failed to discover roles: ${error instanceof Error ? error.message : String(error)}`
      );
      // Mark as attempted so we don't retry on transient errors
      context.roleDiscoveryAttempted = true;
      return [];
    }
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
