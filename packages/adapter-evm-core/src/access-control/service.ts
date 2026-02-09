/**
 * EVM Access Control Service
 *
 * Implements the AccessControlService interface for EVM-compatible contracts.
 * Provides methods to inspect and manage access control (Ownable, Ownable2Step,
 * AccessControl, AccessControlDefaultAdminRules, AccessControlEnumerable) on contracts.
 *
 * The service assembles transaction data (as `WriteContractParameters`) and delegates
 * execution to a caller-provided `executeTransaction` callback, decoupling the service
 * from wallet/signing infrastructure.
 *
 * **Concurrency model (NFR-002)**: Single-consumer per instance. Concurrent reads for
 * different contracts are safe (each operates on independent Map entries). Concurrent
 * writes to the same contract context are not guarded — last write wins.
 *
 * @module access-control/service
 * @see contracts/access-control-service.ts — API contract
 * @see research.md §R9 — Service Lifecycle and Transaction Execution
 */

import type {
  AccessControlCapabilities,
  AccessControlService,
  AccessSnapshot,
  AdminInfo,
  ContractSchema,
  EnrichedRoleAssignment,
  EnrichedRoleMember,
  ExecutionConfig,
  HistoryQueryOptions,
  OperationResult,
  OwnershipInfo,
  PaginatedHistoryResult,
  PendingAdminTransfer,
  PendingOwnershipTransfer,
  RoleAssignment,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/ui-types';
import { ConfigurationInvalid } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { EvmCompatibleNetworkConfig, WriteContractParameters } from '../types';
import { detectAccessControlCapabilities } from './feature-detection';
import { createIndexerClient, EvmIndexerClient } from './indexer-client';
import { getAdmin, readCurrentRoles, readOwnership } from './onchain-reader';
import type { EvmAccessControlContext, EvmTransactionExecutor } from './types';
import { validateAddress, validateRoleIds } from './validation';

// ---------------------------------------------------------------------------
// Service Implementation
// ---------------------------------------------------------------------------

/**
 * EVM implementation of AccessControlService.
 *
 * This class is incrementally built across user stories. Phase 3 (US1) provides:
 * - registerContract()
 * - addKnownRoleIds()
 * - getCapabilities()
 * - dispose()
 *
 * Subsequent phases add: getOwnership, getAdminInfo, getCurrentRoles,
 * getCurrentRolesEnriched, grantRole, revokeRole, transferOwnership,
 * acceptOwnership, renounceOwnership, transferAdminRole, acceptAdminTransfer,
 * cancelAdminTransfer, changeAdminDelay, rollbackAdminDelay, renounceRole,
 * getHistory, exportSnapshot, discoverKnownRoleIds.
 */
export class EvmAccessControlService implements AccessControlService {
  private readonly contractContexts = new Map<string, EvmAccessControlContext>();
  private readonly networkConfig: EvmCompatibleNetworkConfig;
  private readonly executeTransaction: EvmTransactionExecutor;
  private readonly indexerClient: EvmIndexerClient;

  constructor(
    networkConfig: EvmCompatibleNetworkConfig,
    executeTransaction: EvmTransactionExecutor
  ) {
    this.networkConfig = networkConfig;
    this.executeTransaction = executeTransaction;
    this.indexerClient = createIndexerClient(networkConfig);
  }

  // ── Contract Registration ──────────────────────────────────────────────

  /**
   * Register a contract for access control operations.
   *
   * Validates the contract address and optional role IDs, then stores the context
   * in-memory. Re-registration overwrites the previous context.
   *
   * @param contractAddress - EVM address (0x-prefixed, 42 chars)
   * @param contractSchema - Parsed ABI as ContractSchema
   * @param knownRoleIds - Optional bytes32 role identifiers
   * @throws ConfigurationInvalid if address or role IDs are invalid
   */
  registerContract(
    contractAddress: string,
    contractSchema: ContractSchema,
    knownRoleIds?: string[]
  ): void {
    validateAddress(contractAddress, 'contractAddress');

    const validatedRoleIds = knownRoleIds ? validateRoleIds(knownRoleIds) : [];

    const normalizedAddress = contractAddress.toLowerCase();

    this.contractContexts.set(normalizedAddress, {
      contractAddress: normalizedAddress,
      contractSchema,
      knownRoleIds: validatedRoleIds,
      discoveredRoleIds: [],
      roleDiscoveryAttempted: false,
      capabilities: null,
    });

    logger.debug('EvmAccessControlService.registerContract', `Registered ${normalizedAddress}`, {
      roleCount: validatedRoleIds.length,
    });
  }

  /**
   * Add additional known role IDs to a registered contract.
   *
   * Merges with existing role IDs using union with deduplication.
   *
   * @param contractAddress - Previously registered contract address
   * @param roleIds - Additional bytes32 role identifiers
   * @returns Merged array of all known role IDs
   * @throws ConfigurationInvalid if contract not registered or role IDs invalid
   */
  addKnownRoleIds(contractAddress: string, roleIds: string[]): string[] {
    validateAddress(contractAddress, 'contractAddress');

    const context = this.getContextOrThrow(contractAddress);
    const validatedNewRoleIds = validateRoleIds(roleIds);

    if (validatedNewRoleIds.length === 0) {
      logger.debug(
        'EvmAccessControlService.addKnownRoleIds',
        `No valid role IDs to add for ${context.contractAddress}`
      );
      return [...context.knownRoleIds];
    }

    const mergedRoleIds = [...new Set([...context.knownRoleIds, ...validatedNewRoleIds])];
    context.knownRoleIds = mergedRoleIds;

    logger.info(
      'EvmAccessControlService.addKnownRoleIds',
      `Added ${validatedNewRoleIds.length} role ID(s) for ${context.contractAddress}`,
      { added: validatedNewRoleIds, total: mergedRoleIds.length }
    );

    return mergedRoleIds;
  }

  // ── Capability Detection ───────────────────────────────────────────────

  /**
   * Detect access control capabilities from the contract's ABI.
   *
   * Results are cached after the first call for a given contract. Also checks
   * indexer availability for the `supportsHistory` flag.
   *
   * @param contractAddress - Previously registered contract address
   * @returns Detected capabilities
   * @throws ConfigurationInvalid if contract not registered or address invalid
   */
  async getCapabilities(contractAddress: string): Promise<AccessControlCapabilities> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.getCapabilities',
      `Detecting capabilities for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    // Return cached capabilities if available
    if (context.capabilities !== null) {
      logger.debug(
        'EvmAccessControlService.getCapabilities',
        `Returning cached capabilities for ${context.contractAddress}`
      );
      return context.capabilities;
    }

    // Check indexer availability based on configuration
    const indexerAvailable = this.hasIndexerEndpoint();

    const capabilities = detectAccessControlCapabilities(context.contractSchema, indexerAvailable);

    // Cache the result
    context.capabilities = capabilities;

    logger.debug('EvmAccessControlService.getCapabilities', 'Detected capabilities:', {
      hasOwnable: capabilities.hasOwnable,
      hasTwoStepOwnable: capabilities.hasTwoStepOwnable,
      hasAccessControl: capabilities.hasAccessControl,
      hasTwoStepAdmin: capabilities.hasTwoStepAdmin,
      hasEnumerableRoles: capabilities.hasEnumerableRoles,
      supportsHistory: capabilities.supportsHistory,
    });

    return capabilities;
  }

  // ── Ownership ──────────────────────────────────────────────────────────

  /**
   * Get current ownership state.
   *
   * On-chain reads: `owner()`, `pendingOwner()` (if Ownable2Step)
   * Indexer enrichment: pending transfer initiation timestamp/tx
   *
   * State mapping:
   * - owner !== zeroAddress && no pendingOwner → 'owned'
   * - pendingOwner set → 'pending' (expirationBlock = undefined — no expiration for EVM)
   * - owner === zeroAddress → 'renounced'
   * - Never returns 'expired' for EVM (FR-023)
   *
   * Graceful degradation (FR-017): Returns on-chain data without enrichment
   * when the indexer is unavailable.
   *
   * @param contractAddress - Previously registered contract address
   * @returns Ownership information with state classification
   * @throws ConfigurationInvalid if contract not registered or address invalid
   */
  async getOwnership(contractAddress: string): Promise<OwnershipInfo> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.getOwnership',
      `Reading ownership status for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    // Read on-chain ownership data
    const onChainData = await readOwnership(
      this.networkConfig.rpcUrl,
      context.contractAddress,
      this.networkConfig.viemChain
    );

    // ── Renounced state — owner is null ─────────────────────────────
    if (onChainData.owner === null) {
      logger.debug(
        'EvmAccessControlService.getOwnership',
        `Contract ${context.contractAddress} has renounced ownership`
      );
      return {
        owner: null,
        state: 'renounced',
      };
    }

    // ── No pending owner — owned state ──────────────────────────────
    if (!onChainData.pendingOwner) {
      logger.debug(
        'EvmAccessControlService.getOwnership',
        `Contract ${context.contractAddress} has owner with no pending transfer`
      );
      return {
        owner: onChainData.owner,
        state: 'owned',
      };
    }

    // ── Pending owner exists — enrich from indexer if available ──────
    const pendingTransfer: PendingOwnershipTransfer = {
      pendingOwner: onChainData.pendingOwner,
      // EVM Ownable2Step has no expiration — expirationBlock is undefined (see research.md §R5)
      expirationBlock: undefined,
    };

    // Attempt indexer enrichment
    const indexerAvailable = await this.indexerClient.isAvailable();
    if (indexerAvailable) {
      try {
        const enrichment = await this.indexerClient.queryPendingOwnershipTransfer(
          context.contractAddress
        );
        if (enrichment) {
          pendingTransfer.initiatedAt = enrichment.initiatedAt;
          pendingTransfer.initiatedTxId = enrichment.initiatedTxId;
          pendingTransfer.initiatedBlock = enrichment.initiatedBlock;
        }
      } catch (error) {
        logger.warn(
          'EvmAccessControlService.getOwnership',
          `Failed to enrich ownership from indexer: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      logger.warn(
        'EvmAccessControlService.getOwnership',
        `Indexer unavailable for ${this.networkConfig.id}: pending transfer enrichment skipped`
      );
    }

    logger.debug(
      'EvmAccessControlService.getOwnership',
      `Contract ${context.contractAddress} has pending transfer to ${onChainData.pendingOwner}`
    );

    return {
      owner: onChainData.owner,
      state: 'pending',
      pendingTransfer,
    };
  }

  async transferOwnership(
    _contractAddress: string,
    _newOwner: string,
    _expirationBlock: number | undefined,
    _executionConfig: ExecutionConfig,
    _onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<OperationResult> {
    throw new Error('Not implemented — will be added in Phase 6 (US4)');
  }

  async acceptOwnership(
    _contractAddress: string,
    _executionConfig: ExecutionConfig,
    _onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<OperationResult> {
    throw new Error('Not implemented — will be added in Phase 6 (US4)');
  }

  // ── Admin ──────────────────────────────────────────────────────────────

  /**
   * Get current default admin state (AccessControlDefaultAdminRules).
   *
   * On-chain reads: `defaultAdmin()`, `pendingDefaultAdmin()`, `defaultAdminDelay()`
   * Indexer enrichment: pending transfer initiation timestamp/tx
   *
   * State mapping:
   * - defaultAdmin !== zeroAddress && no pending → 'active'
   * - pendingDefaultAdmin set → 'pending'
   * - defaultAdmin === zeroAddress → 'renounced'
   * - Never returns 'expired' for EVM (FR-023)
   *
   * For pending transfers, `acceptSchedule` maps to `expirationBlock` — this is a
   * **UNIX timestamp in seconds** (NOT a block number). See research.md §R5 for the
   * semantic divergence between Stellar and EVM.
   *
   * @param contractAddress - Previously registered contract address
   * @returns Admin information with state classification
   * @throws ConfigurationInvalid if contract not registered or address invalid
   */
  async getAdminInfo(contractAddress: string): Promise<AdminInfo> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.getAdminInfo',
      `Reading admin status for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    // Read on-chain admin data
    const onChainData = await getAdmin(
      this.networkConfig.rpcUrl,
      context.contractAddress,
      this.networkConfig.viemChain
    );

    // ── Renounced state — admin is null ─────────────────────────────
    if (onChainData.defaultAdmin === null) {
      logger.debug(
        'EvmAccessControlService.getAdminInfo',
        `Contract ${context.contractAddress} has renounced admin`
      );
      return {
        admin: null,
        state: 'renounced',
      };
    }

    // ── No pending admin — active state ─────────────────────────────
    if (!onChainData.pendingDefaultAdmin) {
      logger.debug(
        'EvmAccessControlService.getAdminInfo',
        `Contract ${context.contractAddress} has admin with no pending transfer`
      );
      return {
        admin: onChainData.defaultAdmin,
        state: 'active',
      };
    }

    // ── Pending admin exists — enrich from indexer if available ──────
    /**
     * The `expirationBlock` field stores the `acceptSchedule` value from
     * `pendingDefaultAdmin()` — this is a UNIX timestamp (seconds since epoch),
     * NOT a block number. See research.md §R5 for semantic divergence.
     */
    const pendingTransfer: PendingAdminTransfer = {
      pendingAdmin: onChainData.pendingDefaultAdmin,
      expirationBlock: onChainData.acceptSchedule,
    };

    // Attempt indexer enrichment
    const indexerAvailable = await this.indexerClient.isAvailable();
    if (indexerAvailable) {
      try {
        const enrichment = await this.indexerClient.queryPendingAdminTransfer(
          context.contractAddress
        );
        if (enrichment) {
          pendingTransfer.initiatedAt = enrichment.initiatedAt;
          pendingTransfer.initiatedTxId = enrichment.initiatedTxId;
          pendingTransfer.initiatedBlock = enrichment.initiatedBlock;
        }
      } catch (error) {
        logger.warn(
          'EvmAccessControlService.getAdminInfo',
          `Failed to enrich admin info from indexer: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      logger.warn(
        'EvmAccessControlService.getAdminInfo',
        `Indexer unavailable for ${this.networkConfig.id}: pending admin enrichment skipped`
      );
    }

    logger.debug(
      'EvmAccessControlService.getAdminInfo',
      `Contract ${context.contractAddress} has pending admin transfer to ${onChainData.pendingDefaultAdmin}`
    );

    return {
      admin: onChainData.defaultAdmin,
      state: 'pending',
      pendingTransfer,
    };
  }

  async transferAdminRole(
    _contractAddress: string,
    _newAdmin: string,
    _expirationBlock: number | undefined,
    _executionConfig: ExecutionConfig,
    _onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<OperationResult> {
    throw new Error('Not implemented — will be added in Phase 7 (US5)');
  }

  async acceptAdminTransfer(
    _contractAddress: string,
    _executionConfig: ExecutionConfig,
    _onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<OperationResult> {
    throw new Error('Not implemented — will be added in Phase 7 (US5)');
  }

  // ── Roles ──────────────────────────────────────────────────────────────

  /**
   * Get current role assignments for a registered AccessControl contract.
   *
   * Strategy:
   * 1. If AccessControlEnumerable: enumerate on-chain via `getRoleMember()`
   * 2. If known role IDs available: use on-chain `readCurrentRoles()` with hasRole checks
   * 3. If indexer available: attempt to discover role IDs via indexer
   * 4. Fallback: return empty array
   *
   * The `DEFAULT_ADMIN_ROLE` (bytes32 zero) is given the label `"DEFAULT_ADMIN_ROLE"`.
   * Other roles have no label (the keccak256 hash cannot be reversed).
   *
   * **Note (FR-026)**: `DEFAULT_ADMIN_ROLE` is NOT auto-included in knownRoleIds.
   * Consumers must provide it explicitly or rely on indexer discovery.
   *
   * @param contractAddress - Previously registered contract address
   * @returns Array of role assignments with members
   * @throws ConfigurationInvalid if contract not registered or address invalid
   */
  async getCurrentRoles(contractAddress: string): Promise<RoleAssignment[]> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info('EvmAccessControlService.getCurrentRoles', `Reading roles for ${contractAddress}`);

    const context = this.getContextOrThrow(contractAddress);

    // Detect capabilities to check for enumerable roles
    const capabilities = await this.getCapabilities(contractAddress);

    // Determine the union of known + discovered role IDs
    let roleIds = this.getMergedRoleIds(context);

    // If no role IDs are available, attempt discovery
    if (roleIds.length === 0) {
      logger.debug(
        'EvmAccessControlService.getCurrentRoles',
        'No role IDs provided, attempting discovery via indexer'
      );
      roleIds = await this.attemptRoleDiscovery(context);
    }

    if (roleIds.length === 0) {
      logger.warn(
        'EvmAccessControlService.getCurrentRoles',
        'No role IDs available (neither provided nor discoverable), returning empty array'
      );
      return [];
    }

    // Read roles from on-chain (uses enumeration if available)
    const assignments = await readCurrentRoles(
      this.networkConfig.rpcUrl,
      context.contractAddress,
      roleIds,
      capabilities.hasEnumerableRoles,
      this.networkConfig.viemChain
    );

    logger.debug(
      'EvmAccessControlService.getCurrentRoles',
      `Retrieved ${assignments.length} role assignment(s) for ${context.contractAddress}`
    );

    return assignments;
  }

  /**
   * Get enriched role assignments with grant metadata from the indexer.
   *
   * Builds on `getCurrentRoles()` and enriches each member with grant timestamp,
   * transaction ID, and block number from the indexer. Falls back to unenriched
   * data if the indexer is unavailable (graceful degradation per FR-017).
   *
   * The `grantedLedger` field in `EnrichedRoleMember` stores an EVM **block number**
   * despite its Stellar-originated name. This is a consequence of the unified type
   * design — see data-model.md §6.
   *
   * @param contractAddress - Previously registered contract address
   * @returns Array of enriched role assignments
   * @throws ConfigurationInvalid if contract not registered or address invalid
   */
  async getCurrentRolesEnriched(contractAddress: string): Promise<EnrichedRoleAssignment[]> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.getCurrentRolesEnriched',
      `Reading enriched roles for ${contractAddress}`
    );

    // Get base role assignments
    const currentRoles = await this.getCurrentRoles(contractAddress);

    if (currentRoles.length === 0) {
      return [];
    }

    // Check indexer availability for enrichment
    const indexerAvailable = await this.indexerClient.isAvailable();

    if (!indexerAvailable) {
      logger.debug(
        'EvmAccessControlService.getCurrentRolesEnriched',
        'Indexer not available, returning roles without timestamps'
      );
      return this.convertToEnrichedWithoutTimestamps(currentRoles);
    }

    // Attempt enrichment via indexer
    try {
      const context = this.getContextOrThrow(contractAddress);
      const roleIds = currentRoles.map((ra) => ra.role.id);

      const grantMap = await this.indexerClient.queryLatestGrants(context.contractAddress, roleIds);

      if (!grantMap) {
        logger.warn(
          'EvmAccessControlService.getCurrentRolesEnriched',
          'Indexer returned null for grant data, returning without enrichment'
        );
        return this.convertToEnrichedWithoutTimestamps(currentRoles);
      }

      // Map each role assignment to enriched form
      const enriched: EnrichedRoleAssignment[] = currentRoles.map((roleAssignment) => ({
        role: roleAssignment.role,
        members: roleAssignment.members.map((memberAddress) => {
          const grantInfo = grantMap.get(memberAddress.toLowerCase());
          const member: EnrichedRoleMember = {
            address: memberAddress,
          };

          if (grantInfo) {
            member.grantedAt = grantInfo.grantedAt;
            member.grantedTxId = grantInfo.txHash;
            /**
             * The `grantedLedger` field stores an EVM block number despite its
             * Stellar-originated name. See data-model.md §6.
             */
            // Block number is not directly available from roleMemberships query;
            // grantedAt timestamp is the primary enrichment data
          }

          return member;
        }),
      }));

      logger.debug(
        'EvmAccessControlService.getCurrentRolesEnriched',
        `Enriched ${enriched.length} role(s) with grant timestamps`
      );

      return enriched;
    } catch (error) {
      logger.warn(
        'EvmAccessControlService.getCurrentRolesEnriched',
        `Failed to enrich roles from indexer: ${error instanceof Error ? error.message : String(error)}`
      );
      // Graceful degradation: return on-chain data without enrichment
      return this.convertToEnrichedWithoutTimestamps(currentRoles);
    }
  }

  async grantRole(
    _contractAddress: string,
    _roleId: string,
    _account: string,
    _executionConfig: ExecutionConfig,
    _onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<OperationResult> {
    throw new Error('Not implemented — will be added in Phase 8 (US6)');
  }

  async revokeRole(
    _contractAddress: string,
    _roleId: string,
    _account: string,
    _executionConfig: ExecutionConfig,
    _onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<OperationResult> {
    throw new Error('Not implemented — will be added in Phase 8 (US6)');
  }

  // ── History & Snapshots (stub — implemented in Phase 9/10) ────────────

  async getHistory(
    _contractAddress: string,
    _options?: HistoryQueryOptions
  ): Promise<PaginatedHistoryResult> {
    throw new Error('Not implemented — will be added in Phase 9 (US7)');
  }

  async exportSnapshot(_contractAddress: string): Promise<AccessSnapshot> {
    throw new Error('Not implemented — will be added in Phase 10 (US8)');
  }

  // ── Role Discovery (stub — implemented in Phase 11) ───────────────────

  async discoverKnownRoleIds(_contractAddress: string): Promise<string[]> {
    throw new Error('Not implemented — will be added in Phase 11 (US9)');
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  /**
   * Clean up resources — clear all contract contexts and indexer resources.
   *
   * Safe to call multiple times.
   */
  dispose(): void {
    this.contractContexts.clear();
    // Indexer client is stateless (no subscriptions to unsubscribe) — no cleanup needed
    logger.debug('EvmAccessControlService.dispose', 'Service disposed');
  }

  // ── Internal Helpers ──────────────────────────────────────────────────

  /**
   * Retrieves the context for a registered contract, throwing if not found.
   *
   * @param contractAddress - Contract address (will be normalized)
   * @returns The contract context
   * @throws ConfigurationInvalid if the contract is not registered
   */
  private getContextOrThrow(contractAddress: string): EvmAccessControlContext {
    const normalizedAddress = contractAddress.toLowerCase();
    const context = this.contractContexts.get(normalizedAddress);

    if (!context) {
      throw new ConfigurationInvalid(
        'Contract not registered. Call registerContract() first.',
        contractAddress,
        'contractAddress'
      );
    }

    return context;
  }

  /**
   * Checks whether an indexer endpoint is configured for this network.
   *
   * Uses the config precedence: `accessControlIndexerUrl` on the network config.
   */
  private hasIndexerEndpoint(): boolean {
    return !!this.networkConfig.accessControlIndexerUrl;
  }

  /**
   * Returns the union of known + discovered role IDs for a context.
   * Deduplicates the combined set.
   */
  private getMergedRoleIds(context: EvmAccessControlContext): string[] {
    return [...new Set([...context.knownRoleIds, ...context.discoveredRoleIds])];
  }

  /**
   * Attempt to discover role IDs via the indexer.
   *
   * This is a lightweight wrapper that delegates to `discoverKnownRoleIds()`
   * when it's implemented (Phase 11). For now, returns the discovered role IDs
   * from the context if any, or an empty array.
   *
   * @internal
   */
  private async attemptRoleDiscovery(context: EvmAccessControlContext): Promise<string[]> {
    // If discovery was already attempted, return what we have
    if (context.roleDiscoveryAttempted) {
      return context.discoveredRoleIds;
    }

    // For now, mark as attempted and return empty
    // Full discovery will be implemented in Phase 11 (US9)
    context.roleDiscoveryAttempted = true;

    return context.discoveredRoleIds;
  }

  /**
   * Converts RoleAssignment[] to EnrichedRoleAssignment[] without timestamps.
   *
   * Used for graceful degradation when the indexer is unavailable.
   * Each member gets an `EnrichedRoleMember` with only the `address` field populated.
   */
  private convertToEnrichedWithoutTimestamps(
    assignments: RoleAssignment[]
  ): EnrichedRoleAssignment[] {
    return assignments.map((ra) => ({
      role: ra.role,
      members: ra.members.map((memberAddress) => ({
        address: memberAddress,
      })),
    }));
  }

  /**
   * Delegates transaction execution to the injected callback.
   * Single entry point for all write operations (Phase 6+).
   *
   * @internal
   */
  protected async executeAction(
    txData: WriteContractParameters,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    return this.executeTransaction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates an EvmAccessControlService instance.
 *
 * @param networkConfig - EVM network configuration (includes indexer URL)
 * @param executeTransaction - Callback for transaction execution (provided by EvmAdapter)
 * @returns A new EvmAccessControlService instance
 */
export function createEvmAccessControlService(
  networkConfig: EvmCompatibleNetworkConfig,
  executeTransaction: EvmTransactionExecutor
): EvmAccessControlService {
  return new EvmAccessControlService(networkConfig, executeTransaction);
}
