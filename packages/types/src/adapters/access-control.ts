/**
 * Access Control Types
 *
 * Chain-agnostic types for access control capabilities, ownership, roles, and history.
 * These types are used across adapters to provide a consistent interface for access control operations.
 */

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
   * Grant a role to an account
   * @param contractAddress The contract address
   * @param roleId The role identifier
   * @param account The account to grant the role to
   * @returns Promise resolving to operation result
   */
  grantRole(contractAddress: string, roleId: string, account: string): Promise<OperationResult>;

  /**
   * Revoke a role from an account
   * @param contractAddress The contract address
   * @param roleId The role identifier
   * @param account The account to revoke the role from
   * @returns Promise resolving to operation result
   */
  revokeRole(contractAddress: string, roleId: string, account: string): Promise<OperationResult>;

  /**
   * Transfer ownership of the contract
   * @param contractAddress The contract address
   * @param newOwner The new owner address
   * @returns Promise resolving to operation result
   */
  transferOwnership(contractAddress: string, newOwner: string): Promise<OperationResult>;

  /**
   * Export a snapshot of current access control state
   * @param contractAddress The contract address
   * @returns Promise resolving to access snapshot
   */
  exportSnapshot(contractAddress: string): Promise<AccessSnapshot>;

  /**
   * Get history of role changes (if supported)
   * @param contractAddress The contract address
   * @param options Optional filtering options
   * @returns Promise resolving to array of history entries, or empty array if not supported
   */
  getHistory(
    contractAddress: string,
    options?: {
      roleId?: string;
      account?: string;
      limit?: number;
    }
  ): Promise<HistoryEntry[]>;
}
