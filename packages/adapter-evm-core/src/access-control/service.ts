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
import { ConfigurationInvalid, OperationFailed } from '@openzeppelin/ui-types';
import { logger, validateSnapshot } from '@openzeppelin/ui-utils';

import { resolveRpcUrl } from '../configuration/rpc';
import type { EvmCompatibleNetworkConfig, WriteContractParameters } from '../types';
import {
  assembleAcceptAdminTransferAction,
  assembleAcceptOwnershipAction,
  assembleBeginAdminTransferAction,
  assembleCancelAdminTransferAction,
  assembleChangeAdminDelayAction,
  assembleGrantRoleAction,
  assembleRenounceOwnershipAction,
  assembleRenounceRoleAction,
  assembleRevokeRoleAction,
  assembleRollbackAdminDelayAction,
  assembleTransferOwnershipAction,
} from './actions';
import { detectAccessControlCapabilities } from './feature-detection';
import { createIndexerClient, EvmIndexerClient, grantMapKey } from './indexer-client';
import { getAdmin, readCurrentRoles, readOwnership } from './onchain-reader';
import { discoverRoleLabelsFromAbi } from './role-discovery';
import type { EvmAccessControlContext, EvmTransactionExecutor } from './types';
import { validateAddress, validateRoleId, validateRoleIds } from './validation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Empty history result used for graceful degradation (FR-017) */
const EMPTY_HISTORY_RESULT: PaginatedHistoryResult = {
  items: [],
  pageInfo: { hasNextPage: false },
};

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
      roleLabelMap: new Map(),
      abiRoleDiscoveryDone: false,
    });

    logger.debug('EvmAccessControlService.registerContract', `Registered ${normalizedAddress}`, {
      roleCount: validatedRoleIds.length,
    });
  }

  /**
   * Add additional known role IDs to a registered contract.
   *
   * Merges with existing role IDs using union with deduplication.
   * Accepts plain role IDs (string) or label pairs ({ id, label }) for human-readable display.
   * External labels are stored in context.roleLabelMap and take precedence over ABI/dictionary.
   *
   * @param contractAddress - Previously registered contract address
   * @param roleIds - Additional bytes32 role identifiers, or { id, label } pairs
   * @returns Merged array of all known role IDs
   * @throws ConfigurationInvalid if contract not registered or role IDs invalid
   */
  addKnownRoleIds(
    contractAddress: string,
    roleIds: Array<string | { id: string; label: string }>
  ): string[] {
    validateAddress(contractAddress, 'contractAddress');

    const context = this.getContextOrThrow(contractAddress);

    const validatedIds: string[] = [];
    for (let i = 0; i < roleIds.length; i++) {
      const item = roleIds[i];
      if (typeof item === 'string') {
        validatedIds.push(validateRoleId(item, `roleIds[${i}]`));
      } else {
        validatedIds.push(validateRoleId(item.id, `roleIds[${i}].id`));
        context.roleLabelMap.set(validatedIds[validatedIds.length - 1], item.label);
      }
    }

    if (validatedIds.length === 0) {
      logger.debug(
        'EvmAccessControlService.addKnownRoleIds',
        `No valid role IDs to add for ${context.contractAddress}`
      );
      return [...context.knownRoleIds];
    }

    const mergedRoleIds = [...new Set([...context.knownRoleIds, ...validatedIds])];
    context.knownRoleIds = mergedRoleIds;

    logger.info(
      'EvmAccessControlService.addKnownRoleIds',
      `Added ${validatedIds.length} role ID(s) for ${context.contractAddress}`,
      { added: validatedIds, total: mergedRoleIds.length }
    );

    return mergedRoleIds;
  }

  /**
   * Ensures ABI role constant discovery has been run once for this contract.
   * Merges discovered hash -> label into context.roleLabelMap and sets abiRoleDiscoveryDone.
   */
  private async ensureAbiRoleLabels(context: EvmAccessControlContext): Promise<void> {
    if (context.abiRoleDiscoveryDone) return;

    try {
      const discovered = await discoverRoleLabelsFromAbi(
        resolveRpcUrl(this.networkConfig),
        context.contractAddress,
        context.contractSchema,
        this.networkConfig.viemChain
      );
      for (const [hash, label] of discovered) {
        // Only set if not already present — external labels from addKnownRoleIds() take precedence
        if (!context.roleLabelMap.has(hash)) {
          context.roleLabelMap.set(hash, label);
        }
      }
    } finally {
      context.abiRoleDiscoveryDone = true;
    }
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
      resolveRpcUrl(this.networkConfig),
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

  /**
   * Initiate ownership transfer.
   *
   * - Ownable: single-step `transferOwnership(newOwner)` — ownership changes immediately
   * - Ownable2Step: `transferOwnership(newOwner)` — sets `pendingOwner`, requires `acceptOwnership()`
   *
   * The `expirationBlock` parameter is **ignored for EVM** — EVM Ownable2Step has no
   * expiration mechanism (FR-023). The parameter exists for API parity with Stellar.
   *
   * @param contractAddress - Previously registered contract address
   * @param newOwner - The new owner address
   * @param _expirationBlock - Ignored for EVM (no expiration). Exists for Stellar API parity.
   * @param executionConfig - Execution strategy configuration (EOA, Relayer, etc.)
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered or addresses invalid
   */
  async transferOwnership(
    contractAddress: string,
    newOwner: string,
    _expirationBlock: number | undefined,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');
    validateAddress(newOwner, 'newOwner');

    logger.info(
      'EvmAccessControlService.transferOwnership',
      `Initiating ownership transfer for ${contractAddress} to ${newOwner}`
    );

    const context = this.getContextOrThrow(contractAddress);

    const txData = assembleTransferOwnershipAction(context.contractAddress, newOwner);

    logger.debug(
      'EvmAccessControlService.transferOwnership',
      `Assembled transferOwnership tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }

  /**
   * Accept a pending ownership transfer (Ownable2Step only).
   *
   * Must be called by the pending owner. No arguments — the caller is
   * implicitly validated on-chain.
   *
   * @param contractAddress - Previously registered contract address
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered or address invalid
   */
  async acceptOwnership(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.acceptOwnership',
      `Accepting ownership for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    const txData = assembleAcceptOwnershipAction(context.contractAddress);

    logger.debug(
      'EvmAccessControlService.acceptOwnership',
      `Assembled acceptOwnership tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }

  /**
   * Renounce ownership (Ownable).
   *
   * Permanently renounces ownership — after execution, `owner()` returns the zero address
   * and ownership queries return state `'renounced'`.
   *
   * **EVM-specific extension** — not part of the unified AccessControlService interface
   * or the Stellar adapter. Stellar has no equivalent.
   *
   * @param contractAddress - Previously registered contract address
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered or address invalid
   */
  async renounceOwnership(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.renounceOwnership',
      `Renouncing ownership for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    const txData = assembleRenounceOwnershipAction(context.contractAddress);

    logger.debug(
      'EvmAccessControlService.renounceOwnership',
      `Assembled renounceOwnership tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
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
      resolveRpcUrl(this.networkConfig),
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

  /**
   * Initiate default admin transfer (AccessControlDefaultAdminRules).
   *
   * Assembles `beginDefaultAdminTransfer(newAdmin)` and delegates execution.
   * The contract's built-in delay determines when the transfer can be accepted.
   *
   * The `expirationBlock` parameter is **ignored for EVM** — the delay is
   * determined by the contract's `defaultAdminDelay()`. The parameter exists
   * for API parity with Stellar.
   *
   * **Guard (FR-024)**: Throws `ConfigurationInvalid` if the contract does not
   * have the `hasTwoStepAdmin` capability.
   *
   * @param contractAddress - Previously registered contract address
   * @param newAdmin - The new admin address
   * @param _expirationBlock - Ignored for EVM. Exists for Stellar API parity.
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered, address invalid, or lacks hasTwoStepAdmin
   */
  async transferAdminRole(
    contractAddress: string,
    newAdmin: string,
    _expirationBlock: number | undefined,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');
    validateAddress(newAdmin, 'newAdmin');

    logger.info(
      'EvmAccessControlService.transferAdminRole',
      `Initiating admin transfer for ${contractAddress} to ${newAdmin}`
    );

    const context = this.getContextOrThrow(contractAddress);
    await this.ensureHasTwoStepAdmin(contractAddress);

    const txData = assembleBeginAdminTransferAction(context.contractAddress, newAdmin);

    logger.debug(
      'EvmAccessControlService.transferAdminRole',
      `Assembled beginDefaultAdminTransfer tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }

  /**
   * Accept a pending default admin transfer (AccessControlDefaultAdminRules).
   *
   * Must be called by the pending admin after the accept schedule timestamp.
   * No arguments — the caller is implicitly validated on-chain.
   *
   * **Guard (FR-024)**: Throws `ConfigurationInvalid` if the contract does not
   * have the `hasTwoStepAdmin` capability.
   *
   * @param contractAddress - Previously registered contract address
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered, address invalid, or lacks hasTwoStepAdmin
   */
  async acceptAdminTransfer(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.acceptAdminTransfer',
      `Accepting admin transfer for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);
    await this.ensureHasTwoStepAdmin(contractAddress);

    const txData = assembleAcceptAdminTransferAction(context.contractAddress);

    logger.debug(
      'EvmAccessControlService.acceptAdminTransfer',
      `Assembled acceptDefaultAdminTransfer tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }

  /**
   * Cancel a pending default admin transfer (AccessControlDefaultAdminRules).
   *
   * Must be called by the current default admin. Cancels any pending transfer
   * and resets the pending admin state.
   *
   * **EVM-specific extension** — not part of the unified AccessControlService interface
   * or the Stellar adapter.
   *
   * **Guard (FR-024)**: Throws `ConfigurationInvalid` if the contract does not
   * have the `hasTwoStepAdmin` capability.
   *
   * @param contractAddress - Previously registered contract address
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered, address invalid, or lacks hasTwoStepAdmin
   */
  async cancelAdminTransfer(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.cancelAdminTransfer',
      `Canceling admin transfer for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);
    await this.ensureHasTwoStepAdmin(contractAddress);

    const txData = assembleCancelAdminTransferAction(context.contractAddress);

    logger.debug(
      'EvmAccessControlService.cancelAdminTransfer',
      `Assembled cancelDefaultAdminTransfer tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }

  /**
   * Change the default admin transfer delay (AccessControlDefaultAdminRules).
   *
   * Schedules a change to the delay period. The change itself has a delay
   * before it takes effect (determined by the current delay).
   *
   * **EVM-specific extension** — not part of the unified AccessControlService interface.
   *
   * **Guard (FR-024)**: Throws `ConfigurationInvalid` if the contract does not
   * have the `hasTwoStepAdmin` capability.
   *
   * @param contractAddress - Previously registered contract address
   * @param newDelay - The new delay in seconds (uint48)
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered, address invalid, or lacks hasTwoStepAdmin
   */
  async changeAdminDelay(
    contractAddress: string,
    newDelay: number,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.changeAdminDelay',
      `Changing admin delay for ${contractAddress} to ${newDelay}s`
    );

    const context = this.getContextOrThrow(contractAddress);
    await this.ensureHasTwoStepAdmin(contractAddress);

    const txData = assembleChangeAdminDelayAction(context.contractAddress, newDelay);

    logger.debug(
      'EvmAccessControlService.changeAdminDelay',
      `Assembled changeDefaultAdminDelay tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }

  /**
   * Rollback a pending admin delay change (AccessControlDefaultAdminRules).
   *
   * Cancels a scheduled delay change. Must be called by the current default admin
   * before the delay change takes effect.
   *
   * **EVM-specific extension** — not part of the unified AccessControlService interface.
   *
   * **Guard (FR-024)**: Throws `ConfigurationInvalid` if the contract does not
   * have the `hasTwoStepAdmin` capability.
   *
   * @param contractAddress - Previously registered contract address
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered, address invalid, or lacks hasTwoStepAdmin
   */
  async rollbackAdminDelay(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.rollbackAdminDelay',
      `Rolling back admin delay change for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);
    await this.ensureHasTwoStepAdmin(contractAddress);

    const txData = assembleRollbackAdminDelayAction(context.contractAddress);

    logger.debug(
      'EvmAccessControlService.rollbackAdminDelay',
      `Assembled rollbackDefaultAdminDelay tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
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

    await this.ensureAbiRoleLabels(context);

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
      resolveRpcUrl(this.networkConfig),
      context.contractAddress,
      roleIds,
      capabilities.hasEnumerableRoles,
      this.networkConfig.viemChain,
      context.roleLabelMap
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
          const grantInfo = grantMap.get(grantMapKey(roleAssignment.role.id, memberAddress));
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

  /**
   * Grant a role to an account.
   *
   * Assembles `grantRole(bytes32 role, address account)` and delegates execution.
   * Must be called by an account with the role's admin role (typically DEFAULT_ADMIN_ROLE).
   *
   * @param contractAddress - Previously registered contract address
   * @param roleId - The bytes32 role identifier to grant
   * @param account - The account to grant the role to
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered, addresses invalid, or role ID invalid
   */
  async grantRole(
    contractAddress: string,
    roleId: string,
    account: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');
    const validatedRoleId = validateRoleId(roleId, 'roleId');
    validateAddress(account, 'account');

    logger.info(
      'EvmAccessControlService.grantRole',
      `Granting role ${validatedRoleId} to ${account} on ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    const txData = assembleGrantRoleAction(context.contractAddress, validatedRoleId, account);

    logger.debug(
      'EvmAccessControlService.grantRole',
      `Assembled grantRole tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }

  /**
   * Revoke a role from an account.
   *
   * Assembles `revokeRole(bytes32 role, address account)` and delegates execution.
   * Must be called by an account with the role's admin role.
   *
   * @param contractAddress - Previously registered contract address
   * @param roleId - The bytes32 role identifier to revoke
   * @param account - The account to revoke the role from
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered, addresses invalid, or role ID invalid
   */
  async revokeRole(
    contractAddress: string,
    roleId: string,
    account: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');
    const validatedRoleId = validateRoleId(roleId, 'roleId');
    validateAddress(account, 'account');

    logger.info(
      'EvmAccessControlService.revokeRole',
      `Revoking role ${validatedRoleId} from ${account} on ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    const txData = assembleRevokeRoleAction(context.contractAddress, validatedRoleId, account);

    logger.debug(
      'EvmAccessControlService.revokeRole',
      `Assembled revokeRole tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }

  /**
   * Renounce own role.
   *
   * Assembles `renounceRole(bytes32 role, address callerConfirmation)` and delegates execution.
   * The `account` parameter acts as a caller confirmation — on-chain, the contract verifies
   * it matches `msg.sender` to prevent accidental renouncement.
   *
   * **EVM-specific extension** — Stellar uses `revokeRole` for self-revocation instead
   * of a separate `renounceRole` function.
   *
   * @param contractAddress - Previously registered contract address
   * @param roleId - The bytes32 role identifier to renounce
   * @param account - The caller's address for confirmation (must match msg.sender on-chain)
   * @param executionConfig - Execution strategy configuration
   * @param onStatusChange - Optional callback for transaction status updates
   * @param runtimeApiKey - Optional API key for relayer execution
   * @returns Operation result with transaction hash
   * @throws ConfigurationInvalid if contract not registered, addresses invalid, or role ID invalid
   */
  async renounceRole(
    contractAddress: string,
    roleId: string,
    account: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult> {
    validateAddress(contractAddress, 'contractAddress');
    const validatedRoleId = validateRoleId(roleId, 'roleId');
    validateAddress(account, 'account');

    logger.info(
      'EvmAccessControlService.renounceRole',
      `Renouncing role ${validatedRoleId} for ${account} on ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    const txData = assembleRenounceRoleAction(context.contractAddress, validatedRoleId, account);

    logger.debug(
      'EvmAccessControlService.renounceRole',
      `Assembled renounceRole tx for ${context.contractAddress}`
    );

    return this.executeAction(txData, executionConfig, onStatusChange, runtimeApiKey);
  }

  // ── History (Phase 9 — US7) ────────────────────────────────────────────

  /**
   * Query historical access control events from the indexer.
   *
   * Delegates to the indexer client's `queryHistory()` with filter/pagination options.
   * Supports filtering by: role, account, event type, time range, and pagination.
   *
   * **Graceful degradation (FR-017)**: Returns an empty `PaginatedHistoryResult`
   * (`{ items: [], pageInfo: { hasNextPage: false } }`) when:
   * - The indexer is unavailable
   * - The indexer query returns null
   * - The indexer query throws an error
   *
   * @param contractAddress - Previously registered contract address
   * @param options - Optional filtering and pagination options
   * @returns Paginated history result
   * @throws ConfigurationInvalid if contract not registered or address invalid
   */
  async getHistory(
    contractAddress: string,
    options?: HistoryQueryOptions
  ): Promise<PaginatedHistoryResult> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info('EvmAccessControlService.getHistory', `Querying history for ${contractAddress}`);

    const context = this.getContextOrThrow(contractAddress);

    await this.ensureAbiRoleLabels(context);

    // Check indexer availability
    const indexerAvailable = await this.indexerClient.isAvailable();
    if (!indexerAvailable) {
      logger.warn(
        'EvmAccessControlService.getHistory',
        `Indexer unavailable for ${this.networkConfig.id}: returning empty history`
      );
      return EMPTY_HISTORY_RESULT;
    }

    // Delegate to indexer client
    try {
      const result = await this.indexerClient.queryHistory(
        context.contractAddress,
        options,
        context.roleLabelMap
      );

      if (!result) {
        logger.warn(
          'EvmAccessControlService.getHistory',
          `Indexer returned null for history query on ${context.contractAddress}`
        );
        return EMPTY_HISTORY_RESULT;
      }

      logger.debug(
        'EvmAccessControlService.getHistory',
        `Retrieved ${result.items.length} history event(s) for ${context.contractAddress}`
      );

      return result;
    } catch (error) {
      logger.warn(
        'EvmAccessControlService.getHistory',
        `Failed to query history: ${error instanceof Error ? error.message : String(error)}`
      );
      return EMPTY_HISTORY_RESULT;
    }
  }

  /**
   * Export a point-in-time snapshot of the contract's access control state.
   *
   * Combines `getCurrentRoles()` + `getOwnership()` into a unified `AccessSnapshot`.
   * Ownership is omitted if the contract does not support Ownable (try/catch).
   * Roles default to an empty array if the read fails.
   *
   * **Known limitation**: The unified `AccessSnapshot` type does not include `adminInfo`.
   * Admin information is accessible separately via `getAdminInfo()`. If a future
   * `@openzeppelin/ui-types` update adds `adminInfo` to `AccessSnapshot`, this method
   * should be updated to populate it.
   *
   * @param contractAddress - Previously registered contract address
   * @returns Access control snapshot with roles and optional ownership
   * @throws ConfigurationInvalid if contract not registered or address invalid
   * @throws OperationFailed if the snapshot structure fails validation
   */
  async exportSnapshot(contractAddress: string): Promise<AccessSnapshot> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.exportSnapshot',
      `Exporting snapshot for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    // Read ownership (if supported — omit if contract is not Ownable)
    let ownership: OwnershipInfo | undefined;
    try {
      ownership = await this.getOwnership(context.contractAddress);
    } catch (error) {
      logger.debug(
        'EvmAccessControlService.exportSnapshot',
        `Ownership not available: ${error instanceof Error ? error.message : String(error)}`
      );
      // Contract may not be Ownable — continue without ownership
    }

    // Read roles (fallback to empty array on failure)
    let roles: RoleAssignment[] = [];
    try {
      roles = await this.getCurrentRoles(context.contractAddress);
    } catch (error) {
      logger.debug(
        'EvmAccessControlService.exportSnapshot',
        `Roles not available: ${error instanceof Error ? error.message : String(error)}`
      );
      // Continue with empty roles array
    }

    const snapshot: AccessSnapshot = {
      roles,
      ownership,
    };

    // Validate snapshot structure
    if (!validateSnapshot(snapshot)) {
      const errorMsg = `Invalid snapshot structure for contract ${context.contractAddress}`;
      logger.error('EvmAccessControlService.exportSnapshot', errorMsg);
      throw new OperationFailed(errorMsg, context.contractAddress, 'exportSnapshot');
    }

    logger.debug('EvmAccessControlService.exportSnapshot', 'Snapshot created and validated:', {
      hasOwnership: !!ownership?.owner,
      roleCount: roles.length,
      totalMembers: roles.reduce((sum, r) => sum + r.members.length, 0),
    });

    return snapshot;
  }

  // ── Role Discovery (Phase 11 — US9) ────────────────────────────────────

  /**
   * Discover role IDs from the indexer's historical events.
   *
   * Queries the indexer for all unique role IDs that have appeared in events
   * for the given contract. Results are cached in the contract context — subsequent
   * calls return the cached value without re-querying (`roleDiscoveryAttempted` flag).
   *
   * When `knownRoleIds` were explicitly provided at registration, they are preserved
   * and merged with any newly discovered roles.
   *
   * **Graceful degradation (FR-017)**: Returns an empty array when:
   * - The indexer is unavailable
   * - The indexer query returns null
   * - The indexer query throws an error
   *
   * @param contractAddress - Previously registered contract address
   * @returns Array of known + discovered role IDs (deduplicated)
   * @throws ConfigurationInvalid if contract not registered or address invalid
   */
  async discoverKnownRoleIds(contractAddress: string): Promise<string[]> {
    validateAddress(contractAddress, 'contractAddress');

    logger.info(
      'EvmAccessControlService.discoverKnownRoleIds',
      `Discovering role IDs for ${contractAddress}`
    );

    const context = this.getContextOrThrow(contractAddress);

    // If discovery was already attempted, return the merged known + discovered set
    if (context.roleDiscoveryAttempted) {
      logger.debug(
        'EvmAccessControlService.discoverKnownRoleIds',
        `Returning cached discovery result for ${context.contractAddress}`
      );
      return this.getMergedRoleIds(context);
    }

    // Mark as attempted immediately to prevent retries on failure
    context.roleDiscoveryAttempted = true;

    // Check indexer availability
    const indexerAvailable = await this.indexerClient.isAvailable();
    if (!indexerAvailable) {
      logger.warn(
        'EvmAccessControlService.discoverKnownRoleIds',
        `Indexer unavailable for ${this.networkConfig.id}: role discovery skipped`
      );
      return this.getMergedRoleIds(context);
    }

    // Query indexer for role discovery
    try {
      const discoveredRoles = await this.indexerClient.discoverRoleIds(context.contractAddress);

      if (discoveredRoles && discoveredRoles.length > 0) {
        context.discoveredRoleIds = discoveredRoles;
        logger.info(
          'EvmAccessControlService.discoverKnownRoleIds',
          `Discovered ${discoveredRoles.length} role(s) for ${context.contractAddress}`
        );
      } else {
        logger.debug(
          'EvmAccessControlService.discoverKnownRoleIds',
          `No roles discovered for ${context.contractAddress}`
        );
      }
    } catch (error) {
      logger.warn(
        'EvmAccessControlService.discoverKnownRoleIds',
        `Failed to discover roles: ${error instanceof Error ? error.message : String(error)}`
      );
      // Graceful degradation — continue with whatever we have
    }

    return this.getMergedRoleIds(context);
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
   * Guards admin operations — ensures the contract has `hasTwoStepAdmin` capability.
   *
   * Throws `ConfigurationInvalid` if the contract does not support
   * AccessControlDefaultAdminRules (FR-024). This prevents any on-chain
   * interaction with incompatible contracts.
   *
   * @param contractAddress - The contract address to check
   * @throws ConfigurationInvalid if the contract lacks hasTwoStepAdmin capability
   */
  private async ensureHasTwoStepAdmin(contractAddress: string): Promise<void> {
    const capabilities = await this.getCapabilities(contractAddress);
    if (!capabilities.hasTwoStepAdmin) {
      throw new ConfigurationInvalid(
        'Contract does not support AccessControlDefaultAdminRules (hasTwoStepAdmin is false). ' +
          'Admin operations require a contract with the DefaultAdminRules pattern.',
        contractAddress,
        'contractAddress'
      );
    }
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
   * Delegates to the indexer client's `discoverRoleIds()`. Results are cached
   * in the context's `discoveredRoleIds` and the `roleDiscoveryAttempted` flag
   * prevents retries on failure.
   *
   * @internal
   */
  private async attemptRoleDiscovery(context: EvmAccessControlContext): Promise<string[]> {
    // If discovery was already attempted, return what we have
    if (context.roleDiscoveryAttempted) {
      return this.getMergedRoleIds(context);
    }

    // Mark as attempted to prevent retries
    context.roleDiscoveryAttempted = true;

    // Check indexer availability
    const indexerAvailable = await this.indexerClient.isAvailable();
    if (!indexerAvailable) {
      return this.getMergedRoleIds(context);
    }

    try {
      const discoveredRoles = await this.indexerClient.discoverRoleIds(context.contractAddress);

      if (discoveredRoles && discoveredRoles.length > 0) {
        context.discoveredRoleIds = discoveredRoles;
        logger.info(
          'EvmAccessControlService.attemptRoleDiscovery',
          `Auto-discovered ${discoveredRoles.length} role(s) for ${context.contractAddress}`
        );
      }
    } catch (error) {
      logger.warn(
        'EvmAccessControlService.attemptRoleDiscovery',
        `Role discovery failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return this.getMergedRoleIds(context);
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
