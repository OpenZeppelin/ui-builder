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
  /** Whether the contract implements AccessControl */
  hasAccessControl: boolean;
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
 * Ownership information
 */
export interface OwnershipInfo {
  /** The current owner address, or null if no owner */
  owner: string | null;
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
 * History entry for role changes (adapter-specific, when history is supported)
 */
export interface HistoryEntry {
  /** The role that was changed */
  role: RoleIdentifier;
  /** The account that was granted or revoked */
  account: string;
  /** Type of change */
  changeType: 'GRANTED' | 'REVOKED';
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
 * Change type for filtering history events
 */
export type HistoryChangeType = 'GRANTED' | 'REVOKED' | 'TRANSFERRED';

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
   * @param contractAddress The contract address
   * @param newOwner The new owner address
   * @param executionConfig Execution configuration specifying method (eoa, relayer, etc.)
   * @param onStatusChange Optional callback for status updates
   * @param runtimeApiKey Optional session-only API key for methods like Relayer
   * @returns Promise resolving to operation result
   */
  transferOwnership(
    contractAddress: string,
    newOwner: string,
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
