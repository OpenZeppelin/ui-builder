/**
 * Access Control Error Types
 *
 * Chain-agnostic error classes for access control operations.
 * These errors can be used across any adapter (EVM, Stellar, Solana, Midnight, etc.)
 * that implements access control functionality.
 *
 * Each error type provides specific context for debugging and user-friendly error messages.
 */

/**
 * Base class for all Access Control errors
 *
 * This abstract class serves as the foundation for all access control-related errors.
 * It provides a common structure with optional contract address context.
 */
export abstract class AccessControlError extends Error {
  constructor(
    message: string,
    public readonly contractAddress?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when a contract does not implement required interfaces
 *
 * This error indicates that a contract is missing necessary access control functionality
 * or has a partial/incompatible implementation.
 *
 * @example
 * ```typescript
 * throw new UnsupportedContractFeatures(
 *   'Contract missing required Ownable methods',
 *   contractAddress,
 *   ['transfer_ownership', 'renounce_ownership']
 * );
 * ```
 *
 * Common use cases:
 * - Contract missing Ownable or AccessControl methods
 * - Contract has partial implementation that doesn't conform to standards
 * - Contract is a custom access control implementation not compatible with expected interfaces
 */
export class UnsupportedContractFeatures extends AccessControlError {
  constructor(
    message: string,
    contractAddress?: string,
    public readonly missingFeatures?: string[]
  ) {
    super(message, contractAddress);
  }
}

/**
 * Error thrown when the caller lacks required permissions for an operation
 *
 * This error indicates an authorization failure where the calling account doesn't
 * have the necessary permissions to execute the requested operation.
 *
 * @example
 * ```typescript
 * throw new PermissionDenied(
 *   'Caller is not an admin',
 *   contractAddress,
 *   'ADMIN_ROLE',
 *   callerAddress
 * );
 * ```
 *
 * Common use cases:
 * - Attempting to grant/revoke roles without admin rights
 * - Trying to transfer ownership without being the owner
 * - Executing operations that require specific role membership
 */
export class PermissionDenied extends AccessControlError {
  constructor(
    message: string,
    contractAddress?: string,
    public readonly requiredRole?: string,
    public readonly callerAddress?: string
  ) {
    super(message, contractAddress);
  }
}

/**
 * Error thrown when an indexer is required but not available
 *
 * This error indicates that an operation requires indexer support (e.g., for historical data),
 * but the indexer is not configured, unreachable, or not functioning properly.
 *
 * @example
 * ```typescript
 * throw new IndexerUnavailable(
 *   'History queries require indexer support',
 *   contractAddress,
 *   networkId,
 *   indexerEndpoint
 * );
 * ```
 *
 * Common use cases:
 * - No indexer endpoint configured in network config
 * - Indexer endpoint is unreachable or returning errors
 * - Indexer health check fails
 * - Network doesn't have indexer support
 */
export class IndexerUnavailable extends AccessControlError {
  constructor(
    message: string,
    contractAddress?: string,
    public readonly networkId?: string,
    public readonly endpointUrl?: string
  ) {
    super(message, contractAddress);
  }
}

/**
 * Error thrown when configuration is invalid or incomplete
 *
 * This error indicates a problem with the configuration provided to access control operations,
 * such as invalid addresses, missing required config, or malformed parameters.
 *
 * @example
 * ```typescript
 * throw new ConfigurationInvalid(
 *   'Contract not registered',
 *   contractAddress,
 *   'contractAddress',
 *   providedAddress
 * );
 * ```
 *
 * Common use cases:
 * - Invalid contract address format
 * - Missing required network configuration
 * - Invalid role identifier
 * - Malformed indexer endpoint
 * - Contract not registered before use
 */
export class ConfigurationInvalid extends AccessControlError {
  constructor(
    message: string,
    contractAddress?: string,
    public readonly configField?: string,
    public readonly providedValue?: unknown
  ) {
    super(message, contractAddress);
  }
}

/**
 * Error thrown when an operation fails during execution
 *
 * This error indicates a runtime failure during an access control operation.
 * It includes the operation name and can chain the underlying cause for debugging.
 *
 * @example
 * ```typescript
 * try {
 *   // ... operation code
 * } catch (err) {
 *   throw new OperationFailed(
 *     'Failed to read ownership',
 *     contractAddress,
 *     'readOwnership',
 *     err as Error
 *   );
 * }
 * ```
 *
 * Common use cases:
 * - Transaction assembly fails
 * - RPC call returns an error
 * - Transaction simulation fails
 * - On-chain read operation fails
 * - GraphQL query to indexer fails
 * - Snapshot validation fails
 */
export class OperationFailed extends AccessControlError {
  constructor(
    message: string,
    contractAddress?: string,
    public readonly operation?: string,
    public readonly cause?: Error
  ) {
    super(message, contractAddress);
  }
}
