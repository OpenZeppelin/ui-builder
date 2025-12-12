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
  EnrichedRoleAssignment,
  EnrichedRoleMember,
  ExecutionConfig,
  GetOwnershipOptions,
  HistoryQueryOptions,
  OperationResult,
  OwnershipInfo,
  PaginatedHistoryResult,
  RoleAssignment,
  StellarNetworkConfig,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/ui-builder-types';
import { ConfigurationInvalid, OperationFailed } from '@openzeppelin/ui-builder-types';
import { logger, validateSnapshot } from '@openzeppelin/ui-builder-utils';

import { signAndBroadcastStellarTransaction } from '../transaction/sender';
import {
  assembleAcceptOwnershipAction,
  assembleGrantRoleAction,
  assembleRevokeRoleAction,
  assembleTransferOwnershipAction,
} from './actions';
import { detectAccessControlCapabilities } from './feature-detection';
import { createIndexerClient, StellarIndexerClient } from './indexer-client';
import {
  getAdmin,
  getCurrentLedger,
  readCurrentRoles,
  readOwnership,
  readPendingOwner,
} from './onchain-reader';
import {
  validateAccountAddress,
  validateAddress,
  validateContractAddress,
  validateExpirationLedger,
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
   * Gets the current owner and ownership state of an Ownable contract
   *
   * Retrieves the current owner via on-chain query, then checks for pending
   * two-step transfers via indexer to determine the ownership state:
   * - 'owned': Has owner, no pending transfer
   * - 'pending': Has owner, pending transfer not yet expired
   * - 'expired': Has owner, pending transfer has expired
   * - 'renounced': No owner (null)
   *
   * Gracefully degrades when indexer is unavailable, returning basic ownership
   * info with 'owned' state and logging a warning.
   *
   * @param contractAddress The contract address
   * @param options Optional configuration for the query
   * @param options.verifyOnChain When true, verifies pending transfer exists on-chain (adds ~100-300ms latency). Defaults to false for better performance.
   * @returns Promise resolving to ownership information with state
   * @throws ConfigurationInvalid if the contract address is invalid
   *
   * @example
   * ```typescript
   * // Fast query (default) - trusts indexer data
   * const ownership = await service.getOwnership(contractAddress);
   *
   * // Verified query - confirms pending transfer on-chain
   * const verifiedOwnership = await service.getOwnership(contractAddress, { verifyOnChain: true });
   *
   * console.log('Owner:', ownership.owner);
   * console.log('State:', ownership.state); // 'owned' | 'pending' | 'expired' | 'renounced'
   *
   * if (ownership.state === 'pending' && ownership.pendingTransfer) {
   *   console.log('Pending owner:', ownership.pendingTransfer.pendingOwner);
   *   console.log('Expires at ledger:', ownership.pendingTransfer.expirationBlock);
   * }
   * ```
   */
  async getOwnership(
    contractAddress: string,
    options?: GetOwnershipOptions
  ): Promise<OwnershipInfo> {
    // Validate contract address
    validateContractAddress(contractAddress);

    const verifyOnChain = options?.verifyOnChain ?? false;

    // T025: INFO logging for ownership queries per NFR-004
    logger.info(
      'StellarAccessControlService.getOwnership',
      `Reading ownership status for ${contractAddress}${verifyOnChain ? ' (with on-chain verification)' : ''}`
    );

    // T020: Call get_owner() for current owner
    const basicOwnership = await readOwnership(contractAddress, this.networkConfig);

    // T018/T023: Renounced state - owner is null
    if (basicOwnership.owner === null) {
      logger.debug(
        'StellarAccessControlService.getOwnership',
        `Contract ${contractAddress} has renounced ownership`
      );
      return {
        owner: null,
        state: 'renounced',
      };
    }

    // T024/T019: Check indexer availability for pending transfer detection
    const indexerAvailable = await this.indexerClient.checkAvailability();

    if (!indexerAvailable) {
      // T026: WARN logging for indexer unavailability per NFR-006
      logger.warn(
        'StellarAccessControlService.getOwnership',
        `Indexer unavailable for ${this.networkConfig.id}: pending transfer status cannot be determined`
      );
      // T024: Graceful degradation - return basic ownership with 'owned' state
      return {
        owner: basicOwnership.owner,
        state: 'owned',
      };
    }

    // T021: Query indexer for pending transfer (includes liveUntilLedger)
    let pendingTransfer;
    try {
      pendingTransfer = await this.indexerClient.queryPendingOwnershipTransfer(contractAddress);
    } catch (error) {
      // T026: Graceful degradation on indexer query error
      logger.warn(
        'StellarAccessControlService.getOwnership',
        `Failed to query pending transfer: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        owner: basicOwnership.owner,
        state: 'owned',
      };
    }

    // T015/T023: No pending transfer in indexer - state is 'owned'
    if (!pendingTransfer) {
      logger.debug(
        'StellarAccessControlService.getOwnership',
        `Contract ${contractAddress} has owner with no pending transfer`
      );
      return {
        owner: basicOwnership.owner,
        state: 'owned',
      };
    }

    // Optionally verify on-chain that the pending transfer still exists
    // This guards against stale indexer data but adds latency
    if (verifyOnChain) {
      let onChainPending;
      try {
        onChainPending = await readPendingOwner(contractAddress, this.networkConfig);
      } catch (error) {
        // If on-chain query fails, log warning and continue with indexer data
        logger.warn(
          'StellarAccessControlService.getOwnership',
          `Failed to verify on-chain pending owner: ${error instanceof Error ? error.message : String(error)}. Using indexer data.`
        );
      }

      // If no on-chain pending owner, the transfer may have been completed or expired
      if (!onChainPending) {
        logger.debug(
          'StellarAccessControlService.getOwnership',
          `Contract ${contractAddress} has no on-chain pending owner (transfer may have completed or expired)`
        );
        return {
          owner: basicOwnership.owner,
          state: 'owned',
        };
      }
    }

    // T022: Get current ledger to check expiration
    let currentLedger: number;
    try {
      currentLedger = await getCurrentLedger(this.networkConfig);
    } catch (error) {
      // Graceful degradation if ledger query fails
      logger.warn(
        'StellarAccessControlService.getOwnership',
        `Failed to get current ledger: ${error instanceof Error ? error.message : String(error)}`
      );
      // Return owned state since we can't determine expiration
      return {
        owner: basicOwnership.owner,
        state: 'owned',
      };
    }

    // Use indexer's liveUntilLedger for expiration check
    const liveUntilLedger = pendingTransfer.liveUntilLedger;

    // T022/T023: Determine state based on expiration
    // Per FR-020: expirationLedger must be > currentLedger, so >= means expired
    const isExpired = currentLedger >= liveUntilLedger;

    // Build pending transfer info for the response
    const pendingTransferInfo = {
      pendingOwner: pendingTransfer.pendingOwner,
      expirationBlock: liveUntilLedger,
      initiatedAt: pendingTransfer.timestamp,
      initiatedTxId: pendingTransfer.txHash,
      initiatedBlock: pendingTransfer.ledger,
    };

    if (isExpired) {
      // T017/T023: Expired state
      logger.debug(
        'StellarAccessControlService.getOwnership',
        `Contract ${contractAddress} has expired pending transfer (current: ${currentLedger}, expiration: ${liveUntilLedger})`
      );
      return {
        owner: basicOwnership.owner,
        state: 'expired',
        pendingTransfer: pendingTransferInfo,
      };
    }

    // T016/T023: Pending state
    logger.debug(
      'StellarAccessControlService.getOwnership',
      `Contract ${contractAddress} has pending transfer to ${pendingTransfer.pendingOwner} (expires at ledger ${liveUntilLedger})`
    );
    return {
      owner: basicOwnership.owner,
      state: 'pending',
      pendingTransfer: pendingTransferInfo,
    };
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
   * Gets current role assignments with enriched member information including grant timestamps
   *
   * This method returns role assignments with detailed metadata about when each member
   * was granted the role. If the indexer is unavailable, it gracefully degrades to
   * returning members without timestamp information.
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to array of enriched role assignments
   * @throws ConfigurationInvalid if the contract address is invalid or contract not registered
   */
  async getCurrentRolesEnriched(contractAddress: string): Promise<EnrichedRoleAssignment[]> {
    // Validate contract address
    validateContractAddress(contractAddress);

    logger.info(
      'StellarAccessControlService.getCurrentRolesEnriched',
      `Reading enriched roles for ${contractAddress}`
    );

    // First, get the current role assignments via on-chain queries
    const currentRoles = await this.getCurrentRoles(contractAddress);

    if (currentRoles.length === 0) {
      return [];
    }

    // Check indexer availability for enrichment
    const indexerAvailable = await this.indexerClient.checkAvailability();

    if (!indexerAvailable) {
      logger.debug(
        'StellarAccessControlService.getCurrentRolesEnriched',
        'Indexer not available, returning roles without timestamps'
      );
      // Graceful degradation: return enriched structure without timestamps
      return this.convertToEnrichedWithoutTimestamps(currentRoles);
    }

    // Enrich each role with grant timestamps from the indexer
    const enrichedAssignments: EnrichedRoleAssignment[] = [];

    for (const roleAssignment of currentRoles) {
      const enrichedMembers = await this.enrichMembersWithGrantInfo(
        contractAddress,
        roleAssignment.role.id,
        roleAssignment.members
      );

      enrichedAssignments.push({
        role: roleAssignment.role,
        members: enrichedMembers,
      });
    }

    logger.debug(
      'StellarAccessControlService.getCurrentRolesEnriched',
      `Enriched ${enrichedAssignments.length} role(s) with grant timestamps`
    );

    return enrichedAssignments;
  }

  /**
   * Converts standard role assignments to enriched format without timestamps
   * Used when indexer is unavailable (graceful degradation)
   */
  private convertToEnrichedWithoutTimestamps(
    roleAssignments: RoleAssignment[]
  ): EnrichedRoleAssignment[] {
    return roleAssignments.map((assignment) => ({
      role: assignment.role,
      members: assignment.members.map((address) => ({
        address,
        // Timestamps are undefined when indexer is unavailable
      })),
    }));
  }

  /**
   * Enriches member addresses with grant information from the indexer
   */
  private async enrichMembersWithGrantInfo(
    contractAddress: string,
    roleId: string,
    memberAddresses: string[]
  ): Promise<EnrichedRoleMember[]> {
    if (memberAddresses.length === 0) {
      return [];
    }

    try {
      // Query indexer for grant information
      const grantInfoMap = await this.indexerClient.queryLatestGrants(
        contractAddress,
        roleId,
        memberAddresses
      );

      // Build enriched members, using grant info when available
      return memberAddresses.map((address) => {
        const grantInfo = grantInfoMap.get(address);
        if (grantInfo) {
          return {
            address,
            grantedAt: grantInfo.timestamp,
            grantedTxId: grantInfo.txId,
            grantedLedger: grantInfo.ledger,
          };
        }
        // No grant info found (shouldn't happen for current members, but handle gracefully)
        return { address };
      });
    } catch (error) {
      logger.warn(
        'StellarAccessControlService.enrichMembersWithGrantInfo',
        `Failed to fetch grant info for role ${roleId}, returning members without timestamps: ${error instanceof Error ? error.message : String(error)}`
      );
      // Graceful degradation on error
      return memberAddresses.map((address) => ({ address }));
    }
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
   * Transfers ownership of the contract using two-step transfer
   *
   * Initiates a two-step ownership transfer with an expiration ledger.
   * The pending owner must call acceptOwnership() before the expiration
   * ledger to complete the transfer.
   *
   * @param contractAddress The contract address
   * @param newOwner The new owner address (pending owner)
   * @param expirationLedger The ledger sequence by which the transfer must be accepted
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result with transaction ID
   * @throws ConfigurationInvalid if addresses are invalid or expiration is invalid
   *
   * @example
   * ```typescript
   * // Calculate expiration ~12 hours from now (Stellar ledgers advance ~5s each)
   * const currentLedger = await getCurrentLedger(networkConfig);
   * const expirationLedger = currentLedger + 8640; // 12 * 60 * 60 / 5
   *
   * const result = await service.transferOwnership(
   *   contractAddress,
   *   newOwnerAddress,
   *   expirationLedger,
   *   executionConfig
   * );
   * console.log('Transfer initiated, txHash:', result.id);
   * ```
   */
  async transferOwnership(
    contractAddress: string,
    newOwner: string,
    expirationLedger: number,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    // Validate addresses
    // newOwner can be either an account address (G...) or contract address (C...)
    validateContractAddress(contractAddress);
    validateAddress(newOwner, 'newOwner');

    // T037: INFO logging for transfer initiation per NFR-004
    logger.info(
      'StellarAccessControlService.transferOwnership',
      `Initiating two-step ownership transfer to ${newOwner} on ${contractAddress} with expiration at ledger ${expirationLedger}`
    );

    // T034/T035: Client-side expiration validation (must be > current ledger)
    const currentLedger = await getCurrentLedger(this.networkConfig);
    const validationResult = validateExpirationLedger(expirationLedger, currentLedger);

    if (!validationResult.valid) {
      // T036: Specific error messages per FR-018
      throw new ConfigurationInvalid(
        validationResult.error ||
          `Expiration ledger ${expirationLedger} must be strictly greater than current ledger ${currentLedger}.`,
        String(expirationLedger),
        'expirationLedger'
      );
    }

    // Assemble the transaction data with live_until_ledger parameter
    const txData = assembleTransferOwnershipAction(contractAddress, newOwner, expirationLedger);

    logger.debug('StellarAccessControlService.transferOwnership', 'Transaction data prepared:', {
      contractAddress: txData.contractAddress,
      functionName: txData.functionName,
      argTypes: txData.argTypes,
      expirationLedger,
      currentLedger,
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
      `Ownership transfer initiated. TxHash: ${result.txHash}, pending owner: ${newOwner}, expires at ledger: ${expirationLedger}`
    );

    return { id: result.txHash };
  }

  /**
   * Accepts a pending ownership transfer (two-step transfer)
   *
   * Must be called by the pending owner (the address specified in transferOwnership)
   * before the expiration ledger. The on-chain contract validates:
   * 1. Caller is the pending owner
   * 2. Transfer has not expired
   *
   * @param contractAddress The contract address
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result with transaction ID
   * @throws ConfigurationInvalid if contract address is invalid
   * @throws OperationFailed if on-chain rejection (expired or unauthorized)
   *
   * @example
   * ```typescript
   * // Check ownership state before accepting
   * const ownership = await service.getOwnership(contractAddress);
   * if (ownership.state === 'pending') {
   *   const result = await service.acceptOwnership(contractAddress, executionConfig);
   *   console.log('Ownership accepted, txHash:', result.id);
   * }
   * ```
   */
  async acceptOwnership(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    // Validate contract address
    validateContractAddress(contractAddress);

    // T047: INFO logging for acceptance operations per NFR-004
    logger.info(
      'StellarAccessControlService.acceptOwnership',
      `Accepting pending ownership transfer for ${contractAddress}`
    );

    // T045: Per spec clarification, expiration is enforced on-chain
    // No pre-check required - the contract will reject if expired or caller is not pending owner

    // T043: Assemble the accept_ownership transaction data
    const txData = assembleAcceptOwnershipAction(contractAddress);

    logger.debug('StellarAccessControlService.acceptOwnership', 'Transaction data prepared:', {
      contractAddress: txData.contractAddress,
      functionName: txData.functionName,
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
      'StellarAccessControlService.acceptOwnership',
      `Ownership transfer accepted. TxHash: ${result.txHash}`
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
   * Gets history of role changes with pagination support
   *
   * Supports cursor-based pagination. Use `pageInfo.endCursor` from the response
   * as the `cursor` option in subsequent calls to fetch more pages.
   *
   * @param contractAddress The contract address
   * @param options Optional filtering and pagination options
   * @returns Promise resolving to paginated history result, or empty result if not supported
   * @throws ConfigurationInvalid if the contract address is invalid
   */
  async getHistory(
    contractAddress: string,
    options?: HistoryQueryOptions
  ): Promise<PaginatedHistoryResult> {
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
      return {
        items: [],
        pageInfo: { hasNextPage: false },
      };
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
 * Creates a service instance configured for a specific Stellar network.
 * The service supports both Ownable and AccessControl patterns including
 * two-step ownership transfers with ledger-based expiration.
 *
 * @param networkConfig The Stellar network configuration
 * @returns A new StellarAccessControlService instance
 *
 * @example
 * ```typescript
 * import { createStellarAccessControlService } from '@openzeppelin/ui-builder-adapter-stellar';
 *
 * const service = createStellarAccessControlService(networkConfig);
 * service.registerContract(contractAddress, contractSchema);
 *
 * const ownership = await service.getOwnership(contractAddress);
 * ```
 */
export function createStellarAccessControlService(
  networkConfig: StellarNetworkConfig
): StellarAccessControlService {
  return new StellarAccessControlService(networkConfig);
}
