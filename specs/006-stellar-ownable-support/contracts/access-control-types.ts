/**
 * API Contracts: Stellar Ownable Two-Step Transfer
 *
 * Type definitions for the extended AccessControlService interface
 * supporting two-step ownership transfer with ledger-based expiration.
 *
 * NOTE: This is a design document. Actual types will be implemented in:
 * - packages/types/src/adapters/access-control.ts
 */

import type {
  ExecutionConfig,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/ui-builder-types';

// ============================================================================
// Ownership State Types
// ============================================================================

/**
 * Ownership state enumeration
 */
export type OwnershipState = 'owned' | 'pending' | 'expired' | 'renounced';

/**
 * Pending ownership transfer details
 */
export interface PendingOwnershipTransfer {
  /** Address designated to receive ownership */
  pendingOwner: string;
  /** Ledger sequence by which transfer must be accepted */
  expirationLedger: number;
  /** ISO8601 timestamp of transfer initiation (from indexer) */
  initiatedAt?: string;
  /** Transaction ID of the initiation (from indexer) */
  initiatedTxId?: string;
  /** Ledger at which transfer was initiated (from indexer) */
  initiatedLedger?: number;
}

/**
 * Extended ownership information with pending state support
 *
 * @example Owned state
 * ```typescript
 * {
 *   owner: 'GABC...XYZ',
 *   state: 'owned',
 * }
 * ```
 *
 * @example Pending state
 * ```typescript
 * {
 *   owner: 'GABC...XYZ',
 *   state: 'pending',
 *   pendingTransfer: {
 *     pendingOwner: 'GDEF...UVW',
 *     expirationLedger: 12345678,
 *     initiatedAt: '2025-12-10T10:30:00Z',
 *   }
 * }
 * ```
 *
 * @example Expired state
 * ```typescript
 * {
 *   owner: 'GABC...XYZ',
 *   state: 'expired',
 * }
 * ```
 */
export interface OwnershipInfo {
  /** Current owner address, or null if no owner */
  owner: string | null;
  /** Current ownership state */
  state: OwnershipState;
  /** Pending transfer details (present when state is 'pending') */
  pendingTransfer?: PendingOwnershipTransfer;
}

// ============================================================================
// Capabilities Extension
// ============================================================================

/**
 * Extended access control capabilities with two-step Ownable support
 */
export interface AccessControlCapabilities {
  /** Whether the contract implements Ownable (get_owner) */
  hasOwnable: boolean;
  /** Whether the contract supports two-step transfer with expiration */
  hasTwoStepOwnable: boolean;
  /** Whether the contract implements AccessControl */
  hasAccessControl: boolean;
  /** Whether roles can be enumerated directly */
  hasEnumerableRoles: boolean;
  /** Whether historical data is available via indexer */
  supportsHistory: boolean;
  /** Whether verified against OpenZeppelin interfaces */
  verifiedAgainstOZInterfaces: boolean;
  /** Optional notes about capabilities or limitations */
  notes?: string[];
}

// ============================================================================
// Service Method Signatures
// ============================================================================

/**
 * Result of an ownership operation
 */
export interface OperationResult {
  /** Transaction/operation identifier */
  id: string;
}

/**
 * Options for transfer ownership operation
 */
export interface TransferOwnershipOptions {
  /** New owner address */
  newOwner: string;
  /** Ledger sequence by which transfer must be accepted */
  expirationLedger: number;
}

/**
 * Extended AccessControlService interface for Stellar Ownable
 *
 * Note: This extends the existing AccessControlService with
 * two-step transfer specific methods.
 */
export interface StellarOwnableService {
  /**
   * Get ownership information including pending transfer state
   *
   * @param contractAddress - The contract address
   * @returns Promise resolving to extended ownership information
   *
   * @example
   * ```typescript
   * const ownership = await service.getOwnership('CABC...XYZ');
   * if (ownership.state === 'pending') {
   *   console.log(`Pending owner: ${ownership.pendingTransfer?.pendingOwner}`);
   *   console.log(`Expires at ledger: ${ownership.pendingTransfer?.expirationLedger}`);
   * }
   * ```
   */
  getOwnership(contractAddress: string): Promise<OwnershipInfo>;

  /**
   * Initiate two-step ownership transfer
   *
   * @param contractAddress - The contract address
   * @param newOwner - Address to transfer ownership to
   * @param expirationLedger - Ledger by which transfer must be accepted
   * @param executionConfig - Execution configuration
   * @param onStatusChange - Optional callback for status updates
   * @param runtimeApiKey - Optional API key for relayer
   * @returns Promise resolving to operation result
   *
   * @throws ConfigurationInvalid if expirationLedger has already passed
   *
   * @example
   * ```typescript
   * const currentLedger = await service.getCurrentLedger();
   * const expirationLedger = currentLedger + 8640; // ~12 hours
   *
   * const result = await service.transferOwnership(
   *   contractAddress,
   *   newOwnerAddress,
   *   expirationLedger,
   *   executionConfig
   * );
   * ```
   */
  transferOwnership(
    contractAddress: string,
    newOwner: string,
    expirationLedger: number,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Accept pending ownership transfer
   *
   * Must be called by the pending owner before expiration.
   *
   * @param contractAddress - The contract address
   * @param executionConfig - Execution configuration
   * @param onStatusChange - Optional callback for status updates
   * @param runtimeApiKey - Optional API key for relayer
   * @returns Promise resolving to operation result
   *
   * @example
   * ```typescript
   * // Called by the pending owner
   * const result = await service.acceptOwnership(
   *   contractAddress,
   *   executionConfig
   * );
   * ```
   */
  acceptOwnership(
    contractAddress: string,
    executionConfig: ExecutionConfig,
    onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<OperationResult>;

  /**
   * Get current ledger sequence number
   *
   * Used for calculating appropriate expiration ledgers.
   *
   * @returns Promise resolving to current ledger sequence
   *
   * @example
   * ```typescript
   * const currentLedger = await service.getCurrentLedger();
   * // Set expiration to ~1 hour from now (~720 ledgers at 5s/ledger)
   * const expirationLedger = currentLedger + 720;
   * ```
   */
  getCurrentLedger(): Promise<number>;

  /**
   * Validate expiration ledger before transfer
   *
   * Checks that the expiration ledger is in the future.
   *
   * @param expirationLedger - The expiration ledger to validate
   * @returns Promise resolving to validation result
   */
  validateExpirationLedger(expirationLedger: number): Promise<{
    valid: boolean;
    currentLedger: number;
    error?: string;
  }>;
}

// ============================================================================
// Indexer Event Types
// ============================================================================

/**
 * Indexer event type enumeration (extended)
 */
export type AccessControlEventType =
  | 'ROLE_GRANTED'
  | 'ROLE_REVOKED'
  | 'OWNERSHIP_TRANSFER_INITIATED'
  | 'OWNERSHIP_TRANSFER_COMPLETED';

/**
 * Ownership transfer initiation event from indexer
 */
export interface OwnershipTransferInitiatedEvent {
  /** Previous owner at time of initiation */
  previousOwner: string;
  /** Pending owner address */
  newOwner: string;
  /** Ledger sequence for expiration */
  liveUntilLedger: number;
  /** Transaction hash */
  txHash: string;
  /** ISO8601 timestamp */
  timestamp: string;
  /** Ledger sequence of event */
  blockHeight: number;
}

/**
 * Ownership transfer completion event from indexer
 */
export interface OwnershipTransferCompletedEvent {
  /** Previous owner */
  previousOwner: string;
  /** New owner */
  newOwner: string;
  /** Transaction hash */
  txHash: string;
  /** ISO8601 timestamp */
  timestamp: string;
  /** Ledger sequence of event */
  blockHeight: number;
}
