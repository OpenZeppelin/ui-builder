/**
 * Access Control Types
 *
 * Chain-agnostic types for access control capabilities, ownership, roles, and history.
 * These types are used across adapters to provide a consistent interface for access control operations.
 */

import type { ExecutionConfig } from '../execution';
import type { TransactionStatusUpdate, TxStatus } from '../transactions/status';

/**
 * Capabilities of an access control contract
 */
export interface AccessControlCapabilities {
  /** Whether the contract implements Ownable */
  hasOwnable: boolean;
  /** Whether the contract supports two-step transfer with expiration (e.g. Stellar Ownable) */
  hasTwoStepOwnable: boolean;
  /** Whether the contract implements AccessControl */
  hasAccessControl: boolean;
  /** Whether the contract supports two-step admin transfer with expiration (e.g. Stellar AccessControl) */
  hasTwoStepAdmin: boolean;
  /** Whether roles can be enumerated directly (vs requiring event reconstruction) */
  hasEnumerableRoles: boolean;
  /** Whether historical data is available (via indexer or similar) */
  supportsHistory: boolean;
  /** Whether the contract has been verified against OpenZeppelin interfaces */
  verifiedAgainstOZInterfaces: boolean;
  /** Optional notes about capabilities or limitations */
  notes?: string[];
}

/**
 * Ownership state enumeration for two-step Ownable contracts
 *
 * - 'owned': Contract has an active owner with no pending transfer
 * - 'pending': Ownership transfer initiated, awaiting acceptance
 * - 'expired': Previous transfer attempt expired without completion
 * - 'renounced': Contract has no owner (ownership was renounced)
 */
export type OwnershipState = 'owned' | 'pending' | 'expired' | 'renounced';

/**
 * Pending ownership transfer details for two-step Ownable contracts
 *
 * Contains information about an initiated but not yet accepted ownership transfer.
 */
export interface PendingOwnershipTransfer {
  /** Address designated to receive ownership */
  pendingOwner: string;
  /** Block/ledger number by which transfer must be accepted */
  expirationBlock: number;
  /** ISO8601 timestamp of transfer initiation (from indexer) */
  initiatedAt?: string;
  /** Transaction ID of the initiation (from indexer) */
  initiatedTxId?: string;
  /** Block/ledger number at which transfer was initiated (from indexer) */
  initiatedBlock?: number;
}

/**
 * Ownership information
 *
 * Extended to support two-step Ownable contracts with pending transfer state.
 *
 * @example Owned state (basic)
 * ```typescript
 * { owner: '0xABC...123', state: 'owned' }
 * ```
 *
 * @example Pending state
 * ```typescript
 * {
 *   owner: '0xABC...123',
 *   state: 'pending',
 *   pendingTransfer: {
 *     pendingOwner: '0xDEF...456',
 *     expirationBlock: 12345678,
 *     initiatedAt: '2025-12-10T10:30:00Z',
 *   }
 * }
 * ```
 *
 * @example Renounced state
 * ```typescript
 * { owner: null, state: 'renounced' }
 * ```
 */
export interface OwnershipInfo {
  /** The current owner address, or null if no owner */
  owner: string | null;
  /** Current ownership state (optional for backward compatibility) */
  state?: OwnershipState;
  /** Pending transfer details (present when state is 'pending') */
  pendingTransfer?: PendingOwnershipTransfer;
}

/**
 * Admin state enumeration for two-step AccessControl admin transfer
 *
 * - 'active': Contract has an active admin with no pending transfer
 * - 'pending': Admin transfer initiated, awaiting acceptance
 * - 'expired': Previous transfer attempt expired without completion
 * - 'renounced': Contract has no admin (admin role was renounced)
 */
export type AdminState = 'active' | 'pending' | 'expired' | 'renounced';

/**
 * Pending admin transfer details for two-step AccessControl contracts
 *
 * Contains information about an initiated but not yet accepted admin transfer.
 */
export interface PendingAdminTransfer {
  /** Address designated to receive admin role */
  pendingAdmin: string;
  /** Block/ledger number by which transfer must be accepted */
  expirationBlock: number;
  /** ISO8601 timestamp of transfer initiation (from indexer) */
  initiatedAt?: string;
  /** Transaction ID of the initiation (from indexer) */
  initiatedTxId?: string;
  /** Block/ledger number at which transfer was initiated (from indexer) */
  initiatedBlock?: number;
}

/**
 * Admin information for AccessControl contracts
 *
 * Extended to support two-step admin transfer with pending transfer state.
 *
 * @example Active state (basic)
 * ```typescript
 * { admin: 'GABC...123', state: 'active' }
 * ```
 *
 * @example Pending state
 * ```typescript
 * {
 *   admin: 'GABC...123',
 *   state: 'pending',
 *   pendingTransfer: {
 *     pendingAdmin: 'GDEF...456',
 *     expirationBlock: 12345678,
 *     initiatedAt: '2025-12-10T10:30:00Z',
 *   }
 * }
 * ```
 *
 * @example Renounced state
 * ```typescript
 * { admin: null, state: 'renounced' }
 * ```
 */
export interface AdminInfo {
  /** The current admin address, or null if no admin */
  admin: string | null;
  /** Current admin state (optional for backward compatibility) */
  state?: AdminState;
  /** Pending transfer details (present when state is 'pending') */
  pendingTransfer?: PendingAdminTransfer;
}

/**
 * Role identifier
 */
export interface RoleIdentifier {
  /** Stable identifier for the role (e.g., name, bytes, symbol rendered to string) */
  id: string;
  /** Optional human-friendly label for the role */
  label?: string;
}

/**
 * Role assignment with members
 */
export interface RoleAssignment {
  /** The role identifier */
  role: RoleIdentifier;
  /** Array of addresses/accounts that have this role */
  members: string[];
}

/**
 * Enriched role member with grant metadata
 * Used when historical data is available via indexer
 */
export interface EnrichedRoleMember {
  /** The member's address */
  address: string;
  /** ISO8601 timestamp of when the role was granted (undefined if indexer unavailable) */
  grantedAt?: string;
  /** Transaction ID of the grant operation */
  grantedTxId?: string;
  /** Block/ledger number of the grant operation */
  grantedLedger?: number;
}

/**
 * Enriched role assignment with detailed member information
 * Includes grant timestamps when indexer data is available
 */
export interface EnrichedRoleAssignment {
  /** The role identifier */
  role: RoleIdentifier;
  /** Array of enriched member information */
  members: EnrichedRoleMember[];
}

/**
 * Snapshot of access control state at a point in time
 */
export interface AccessSnapshot {
  /** Array of role assignments */
  roles: RoleAssignment[];
  /** Optional ownership information */
  ownership?: OwnershipInfo;
}

/**
 * Change type for history events
 *
 * - GRANTED: Role was granted to an account
 * - REVOKED: Role was revoked from an account
 * - OWNERSHIP_TRANSFER_STARTED: Two-step ownership transfer initiated
 * - OWNERSHIP_TRANSFER_COMPLETED: Two-step ownership transfer accepted
 * - ADMIN_TRANSFER_INITIATED: Two-step admin transfer initiated
 * - ADMIN_TRANSFER_COMPLETED: Two-step admin transfer accepted
 */
export type HistoryChangeType =
  | 'GRANTED'
  | 'REVOKED'
  | 'OWNERSHIP_TRANSFER_STARTED'
  | 'OWNERSHIP_TRANSFER_COMPLETED'
  | 'ADMIN_TRANSFER_INITIATED'
  | 'ADMIN_TRANSFER_COMPLETED';

/**
 * History entry for role changes (adapter-specific, when history is supported)
 */
export interface HistoryEntry {
  /** The role that was changed */
  role: RoleIdentifier;
  /** The account that was granted or revoked */
  account: string;
  /** Type of change */
  changeType: HistoryChangeType;
  /** Transaction identifier */
  txId: string;
  /** Optional timestamp (ISO8601 format) */
  timestamp?: string;
  /** Optional ledger/sequence number */
  ledger?: number;
}

/**
 * Pagination info for cursor-based pagination
 */
export interface PageInfo {
  /** Whether there are more items after the current page */
  hasNextPage: boolean;
  /** Cursor to use for fetching the next page */
  endCursor?: string;
}

/**
 * Paginated result for history queries
 */
export interface PaginatedHistoryResult {
  /** Array of history entries */
  items: HistoryEntry[];
  /** Pagination information */
  pageInfo: PageInfo;
}

/**
 * Options for querying history with pagination
 */
export interface HistoryQueryOptions {
  /** Filter by role identifier */
  roleId?: string;
  /** Filter by account address */
  account?: string;
  /** Filter by change type (grant, revoke, or ownership transfer) */
  changeType?: HistoryChangeType;
  /** Filter by transaction ID (exact match) */
  txId?: string;
  /** Filter by timestamp - return events on or after this time (format: 'YYYY-MM-DDTHH:mm:ss', no timezone) */
  timestampFrom?: string;
  /** Filter by timestamp - return events on or before this time (format: 'YYYY-MM-DDTHH:mm:ss', no timezone) */
  timestampTo?: string;
  /** Filter by ledger/block number (exact match) */
  ledger?: number;
  /** Maximum number of items to return (page size) */
  limit?: number;
  /** Cursor for fetching the next page */
  cursor?: string;
}

/**
 * Result of an operation (grant, revoke, transfer)
 */
export interface OperationResult {
  /** Transaction/operation identifier */
  id: string;
}

/**
 * Service interface for access control operations
 */
export interface AccessControlService {
  /**
   * Get the capabilities of the contract
   * @param contractAddress The contract address to check
   * @returns Promise resolving to capabilities
   */
  getCapabilities(contractAddress: string): Promise<AccessControlCapabilities>;

  /**
   * Get the current owner of the contract
   * @param contractAddress The contract address
   * @returns Promise resolving to ownership information
   */
  getOwnership(contractAddress: string): Promise<OwnershipInfo>;

  /**
   * Get current role assignments
   * @param contractAddress The contract address
   * @returns Promise resolving to array of role assignments
   */
  getCurrentRoles(contractAddress: string): Promise<RoleAssignment[]>;

  /**
   * Get current role assignments with enriched member information
   *
   * Returns role assignments with metadata about when each member was granted
   * the role. If the indexer is unavailable, gracefully degrades to returning
   * members without timestamp information.
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to array of enriched role assignments
   */
  getCurrentRolesEnriched(contractAddress: string): Promise<EnrichedRoleAssignment[]>;

  /**
   * Grant a role to an account
   * @param contractAddress The contract address
   * @param roleId The role identifier
   * @param account The account to grant the role to
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result
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
   * Revoke a role from an account
   * @param contractAddress The contract address
   * @param roleId The role identifier
   * @param account The account to revoke the role from
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result
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
   * Transfer ownership of the contract
   *
   * For two-step Ownable contracts (e.g., Stellar), the expirationBlock parameter
   * specifies when the pending transfer expires. The pending owner must call
   * acceptOwnership() before this block/ledger to complete the transfer.
   *
   * @param contractAddress The contract address
   * @param newOwner The new owner address
   * @param expirationBlock For two-step transfers: the block/ledger number by which the transfer
   *   must be accepted. Required for chains with two-step Ownable (e.g., Stellar).
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result
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
   * Accept a pending ownership transfer (two-step transfer)
   *
   * Must be called by the pending owner (the address specified in transferOwnership)
   * before the expiration block/ledger. Only applicable for contracts that support
   * two-step ownership transfer (check `hasTwoStepOwnable` capability).
   *
   * The on-chain contract validates:
   * 1. Caller is the pending owner
   * 2. Transfer has not expired
   *
   * @param contractAddress The contract address
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result with transaction ID
   */
  acceptOwnership?(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Get the current admin and admin transfer state of an AccessControl contract
   *
   * Retrieves the current admin and checks for pending two-step admin transfers.
   * Only applicable for contracts that support two-step admin transfer
   * (check `hasTwoStepAdmin` capability).
   *
   * @param contractAddress The contract address
   * @returns Promise resolving to admin information with state
   */
  getAdminInfo?(contractAddress: string): Promise<AdminInfo>;

  /**
   * Initiate an admin role transfer (two-step transfer)
   *
   * For two-step AccessControl contracts, this initiates a transfer that must be
   * accepted by the pending admin before the expiration ledger. Only applicable
   * for contracts that support two-step admin transfer (check `hasTwoStepAdmin` capability).
   *
   * @param contractAddress The contract address
   * @param newAdmin The new admin address
   * @param expirationBlock The block/ledger number by which the transfer must be accepted
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result with transaction ID
   */
  transferAdminRole?(
    contractAddress: string,
    newAdmin: string,
    expirationBlock: number,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Accept a pending admin transfer (two-step transfer)
   *
   * Must be called by the pending admin (the address specified in transferAdminRole)
   * before the expiration block/ledger. Only applicable for contracts that support
   * two-step admin transfer (check `hasTwoStepAdmin` capability).
   *
   * The on-chain contract validates:
   * 1. Caller is the pending admin
   * 2. Transfer has not expired
   *
   * @param contractAddress The contract address
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result with transaction ID
   */
  acceptAdminTransfer?(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Export a snapshot of current access control state
   * @param contractAddress The contract address
   * @returns Promise resolving to access snapshot
   */
  exportSnapshot(contractAddress: string): Promise<AccessSnapshot>;

  /**
   * Get history of role changes (if supported)
   *
   * Supports cursor-based pagination. Use `pageInfo.endCursor` from the response
   * as the `cursor` option in subsequent calls to fetch more pages.
   *
   * @param contractAddress The contract address
   * @param options Optional filtering and pagination options
   * @returns Promise resolving to paginated history result, or empty result if not supported
   */
  getHistory(
    contractAddress: string,
    options?: HistoryQueryOptions
  ): Promise<PaginatedHistoryResult>;
}
