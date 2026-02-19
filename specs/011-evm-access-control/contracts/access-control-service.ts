/**
 * EVM Access Control Service — API Contract
 *
 * This file documents the public API of the EVM Access Control module.
 * It is a reference for implementors, not executable code.
 *
 * The service implements AccessControlService from @openzeppelin/ui-types.
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

import type { EvmCompatibleNetworkConfig, WriteContractParameters } from '../types';

// ---------------------------------------------------------------------------
// Error Classes (from @openzeppelin/ui-types)
// ---------------------------------------------------------------------------

/**
 * ConfigurationInvalid — thrown for validation errors:
 *   - Invalid contract/account address format
 *   - Invalid role ID format
 *   - Contract not registered (call registerContract() first)
 *   - Capability not supported (e.g., calling cancelAdminTransfer without hasTwoStepAdmin)
 *
 * OperationFailed — thrown for execution failures:
 *   - Snapshot validation failure
 */

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Transaction executor callback type.
 * Provided by EvmAdapter to decouple the service from wallet/signing infrastructure.
 */
export type EvmTransactionExecutor = (
  txData: WriteContractParameters,
  executionConfig: ExecutionConfig,
  onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
  runtimeApiKey?: string
) => Promise<OperationResult>;

/**
 * Creates an EvmAccessControlService instance.
 *
 * @param networkConfig - EVM network configuration (includes indexer URL)
 * @param executeTransaction - Callback for transaction execution (provided by EvmAdapter)
 */
export declare function createEvmAccessControlService(
  networkConfig: EvmCompatibleNetworkConfig,
  executeTransaction: EvmTransactionExecutor
): EvmAccessControlService;

// ---------------------------------------------------------------------------
// Service Interface (implements AccessControlService)
// ---------------------------------------------------------------------------

/**
 * EVM-specific extensions beyond the unified AccessControlService interface:
 * - renounceOwnership() — Ownable-specific, Stellar has no equivalent
 * - renounceRole() — AccessControl-specific, Stellar uses revokeRole instead
 * - cancelAdminTransfer() — AccessControlDefaultAdminRules, Stellar has no cancel
 * - changeAdminDelay() — AccessControlDefaultAdminRules, EVM-only concept
 * - rollbackAdminDelay() — AccessControlDefaultAdminRules, EVM-only concept
 *
 * All 13 methods from the unified AccessControlService interface (9 required,
 * 4 optional) are also implemented.
 */
export interface EvmAccessControlService extends AccessControlService {
  // ── Contract Registration ──────────────────────────────────────────────

  /**
   * Register a contract for access control operations.
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
  ): void;

  /**
   * Add additional known role IDs to a registered contract.
   *
   * @param contractAddress - Previously registered contract address
   * @param roleIds - Additional bytes32 role identifiers
   * @returns Merged array of all known role IDs
   * @throws ConfigurationInvalid if contract not registered or role IDs invalid
   */
  addKnownRoleIds(contractAddress: string, roleIds: string[]): string[];

  // ── Capability Detection ───────────────────────────────────────────────

  /**
   * Detect access control capabilities from the contract's ABI.
   *
   * Analyzes ContractSchema.functions for OpenZeppelin patterns:
   * - Ownable / Ownable2Step
   * - AccessControl / AccessControlEnumerable
   * - AccessControlDefaultAdminRules
   *
   * Also checks indexer availability for `supportsHistory`.
   */
  getCapabilities(contractAddress: string): Promise<AccessControlCapabilities>;

  // ── Ownership ──────────────────────────────────────────────────────────

  /**
   * Get current ownership state.
   *
   * On-chain reads: owner(), pendingOwner() (if Ownable2Step)
   * Indexer enrichment: pending transfer initiation timestamp/tx
   *
   * State mapping:
   * - owner !== zeroAddress && no pendingOwner → 'owned'
   * - pendingOwner set → 'pending' (expirationBlock = undefined, no expiration for EVM; see research.md R5)
   * - owner === zeroAddress → 'renounced'
   * - Never returns 'expired' for EVM
   */
  getOwnership(contractAddress: string): Promise<OwnershipInfo>;

  /**
   * Initiate ownership transfer.
   *
   * - Ownable: single-step transferOwnership(newOwner)
   * - Ownable2Step: transferOwnership(newOwner) — sets pendingOwner
   *
   * @param expirationBlock - Ignored for EVM (no expiration). Pass undefined (or 0 as temporary sentinel before PR-1).
   */
  transferOwnership(
    contractAddress: string,
    newOwner: string,
    expirationBlock: number,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Accept pending ownership transfer (Ownable2Step only).
   * Must be called by the pendingOwner.
   */
  acceptOwnership(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Renounce ownership (Ownable).
   * Assembles renounceOwnership() transaction.
   * After execution, ownership queries return state 'renounced'.
   *
   * EVM-specific extension — not part of the unified AccessControlService interface
   * or the Stellar adapter.
   *
   * @throws ConfigurationInvalid if contract is not registered or doesn't have Ownable capability
   */
  renounceOwnership(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  // ── Admin (AccessControlDefaultAdminRules) ─────────────────────────────

  /**
   * Get current default admin state.
   *
   * On-chain reads: defaultAdmin(), pendingDefaultAdmin(), defaultAdminDelay()
   * Indexer enrichment: pending transfer initiation timestamp/tx
   *
   * State mapping:
   * - defaultAdmin !== zeroAddress && no pending → 'active'
   * - pendingDefaultAdmin set → 'pending' (expirationBlock = acceptSchedule)
   * - defaultAdmin === zeroAddress → 'renounced'
   * - Never returns 'expired' for EVM
   */
  getAdminInfo(contractAddress: string): Promise<AdminInfo>;

  /**
   * Initiate default admin transfer.
   * Assembles beginDefaultAdminTransfer(newAdmin) transaction.
   *
   * @param expirationBlock - Not used as deadline for EVM; the contract's built-in
   *   delay determines the accept schedule. Pass undefined (or 0 as temporary sentinel before PR-1).
   */
  transferAdminRole(
    contractAddress: string,
    newAdmin: string,
    expirationBlock: number,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Accept pending default admin transfer.
   * Must be called by the pending admin after the accept schedule.
   */
  acceptAdminTransfer(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Cancel pending default admin transfer.
   * Must be called by the current default admin.
   */
  cancelAdminTransfer(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Change the default admin transfer delay.
   * Assembles changeDefaultAdminDelay(newDelay) transaction.
   */
  changeAdminDelay(
    contractAddress: string,
    newDelay: number,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Rollback a pending admin delay change.
   * Assembles rollbackDefaultAdminDelay() transaction.
   */
  rollbackAdminDelay(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  // ── Roles ──────────────────────────────────────────────────────────────

  /**
   * Get current role assignments.
   *
   * Strategy:
   * 1. If AccessControlEnumerable: enumerate on-chain via getRoleMember()
   * 2. If indexer available: query RoleMembership entities
   * 3. Fall back to hasRole() checks for known accounts
   */
  getCurrentRoles(contractAddress: string): Promise<RoleAssignment[]>;

  /**
   * Get enriched role assignments with grant metadata from indexer.
   * Falls back to getCurrentRoles() without enrichment if indexer unavailable.
   */
  getCurrentRolesEnriched(contractAddress: string): Promise<EnrichedRoleAssignment[]>;

  /**
   * Grant a role. Assembles grantRole(role, account) transaction.
   */
  grantRole(
    contractAddress: string,
    roleId: string,
    account: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Revoke a role. Assembles revokeRole(role, account) transaction.
   */
  revokeRole(
    contractAddress: string,
    roleId: string,
    account: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Renounce own role. Assembles renounceRole(role, callerAddress) transaction.
   */
  renounceRole(
    contractAddress: string,
    roleId: string,
    account: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  // ── History & Snapshots ────────────────────────────────────────────────

  /** Query historical events with pagination and filtering. */
  getHistory(
    contractAddress: string,
    options?: HistoryQueryOptions
  ): Promise<PaginatedHistoryResult>;

  /** Export current access control state snapshot. */
  exportSnapshot(contractAddress: string): Promise<AccessSnapshot>;

  // ── Role Discovery ─────────────────────────────────────────────────────

  /**
   * Discover role IDs from indexer historical events.
   * Results are cached. Returns empty array if indexer unavailable.
   */
  discoverKnownRoleIds(contractAddress: string): Promise<string[]>;

  // ── Lifecycle ──────────────────────────────────────────────────────────

  /** Clean up resources (clear caches, contract contexts). */
  dispose(): void;
}
