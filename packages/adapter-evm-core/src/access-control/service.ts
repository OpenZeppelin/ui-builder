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
  ExecutionConfig,
  HistoryQueryOptions,
  OperationResult,
  OwnershipInfo,
  PaginatedHistoryResult,
  RoleAssignment,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/ui-types';
import { ConfigurationInvalid } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { EvmCompatibleNetworkConfig, WriteContractParameters } from '../types';
import { detectAccessControlCapabilities } from './feature-detection';
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

  constructor(
    networkConfig: EvmCompatibleNetworkConfig,
    executeTransaction: EvmTransactionExecutor
  ) {
    this.networkConfig = networkConfig;
    this.executeTransaction = executeTransaction;
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

  // ── Ownership (stub — implemented in Phase 4) ─────────────────────────

  async getOwnership(_contractAddress: string): Promise<OwnershipInfo> {
    throw new Error('Not implemented — will be added in Phase 4 (US2)');
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

  // ── Admin (stub — implemented in Phase 4/7) ───────────────────────────

  async getAdminInfo(_contractAddress: string): Promise<AdminInfo> {
    throw new Error('Not implemented — will be added in Phase 4 (US2)');
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

  // ── Roles (stub — implemented in Phase 5/8) ──────────────────────────

  async getCurrentRoles(_contractAddress: string): Promise<RoleAssignment[]> {
    throw new Error('Not implemented — will be added in Phase 5 (US3)');
  }

  async getCurrentRolesEnriched(_contractAddress: string): Promise<EnrichedRoleAssignment[]> {
    throw new Error('Not implemented — will be added in Phase 5 (US3)');
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
   * A full availability check (HTTP health check) will be added when the indexer
   * client is implemented in Phase 4 (US2).
   */
  private hasIndexerEndpoint(): boolean {
    return !!this.networkConfig.accessControlIndexerUrl;
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
