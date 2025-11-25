/**
 * Access Control Error Utilities
 *
 * Chain-agnostic helper functions for working with access control errors.
 * These utilities can be used across any adapter that implements access control.
 *
 * Note: These utilities work with the AccessControlError types from @openzeppelin/ui-builder-types
 * but don't import them directly to avoid circular dependencies.
 */

/**
 * Base interface for access control errors (matches the class in types package)
 */
interface AccessControlErrorLike extends Error {
  readonly contractAddress?: string;
}

/**
 * Type guard to check if an error is an AccessControlError
 *
 * @param error The error to check
 * @returns True if the error has the AccessControlError structure
 *
 * @example
 * ```typescript
 * try {
 *   await service.grantRole(...);
 * } catch (error) {
 *   if (isAccessControlError(error)) {
 *     console.log('Access control error:', error.contractAddress);
 *   }
 * }
 * ```
 */
export function isAccessControlError(error: unknown): error is AccessControlErrorLike {
  return (
    error instanceof Error &&
    'contractAddress' in error &&
    (typeof (error as AccessControlErrorLike).contractAddress === 'string' ||
      (error as AccessControlErrorLike).contractAddress === undefined)
  );
}

/**
 * Helper to safely extract error message from unknown error type
 *
 * @param error The error to extract message from
 * @returns The error message string
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   logger.error('Operation failed:', message);
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Helper to create a user-friendly error message with full context
 *
 * This function formats an AccessControlError into a readable multi-line message
 * that includes all relevant context (contract address, roles, operations, etc.).
 *
 * @param error The AccessControlError to format
 * @returns Formatted error message string with all context
 *
 * @example
 * ```typescript
 * import { PermissionDenied } from '@openzeppelin/ui-builder-types';
 * import { formatAccessControlError } from '@openzeppelin/ui-builder-utils';
 *
 * try {
 *   await service.grantRole(...);
 * } catch (error) {
 *   if (error instanceof PermissionDenied) {
 *     const formatted = formatAccessControlError(error);
 *     showErrorToUser(formatted);
 *   }
 * }
 * ```
 *
 * Output format:
 * ```
 * [ErrorName] Error message
 * Contract: 0x123...
 * [Additional context based on error type]
 * ```
 */
export function formatAccessControlError(error: AccessControlErrorLike): string {
  let message = `[${error.name}] ${error.message}`;

  if (error.contractAddress) {
    message += `\nContract: ${error.contractAddress}`;
  }

  // Check for specific error types by name and format accordingly
  // This avoids importing the actual classes and keeps utils independent
  const errorWithProperties = error as AccessControlErrorLike & {
    requiredRole?: string;
    callerAddress?: string;
    networkId?: string;
    endpointUrl?: string;
    configField?: string;
    providedValue?: unknown;
    operation?: string;
    cause?: Error;
    missingFeatures?: string[];
  };

  if (error.name === 'PermissionDenied') {
    if (errorWithProperties.requiredRole) {
      message += `\nRequired Role: ${errorWithProperties.requiredRole}`;
    }
    if (errorWithProperties.callerAddress) {
      message += `\nCaller: ${errorWithProperties.callerAddress}`;
    }
  } else if (error.name === 'IndexerUnavailable') {
    if (errorWithProperties.networkId) {
      message += `\nNetwork: ${errorWithProperties.networkId}`;
    }
    if (errorWithProperties.endpointUrl) {
      message += `\nEndpoint: ${errorWithProperties.endpointUrl}`;
    }
  } else if (error.name === 'ConfigurationInvalid') {
    if (errorWithProperties.configField) {
      message += `\nInvalid Field: ${errorWithProperties.configField}`;
    }
    if (errorWithProperties.providedValue !== undefined) {
      message += `\nProvided Value: ${JSON.stringify(errorWithProperties.providedValue)}`;
    }
  } else if (error.name === 'OperationFailed') {
    if (errorWithProperties.operation) {
      message += `\nOperation: ${errorWithProperties.operation}`;
    }
    if (errorWithProperties.cause) {
      message += `\nCause: ${errorWithProperties.cause.message}`;
    }
  } else if (error.name === 'UnsupportedContractFeatures') {
    if (errorWithProperties.missingFeatures && Array.isArray(errorWithProperties.missingFeatures)) {
      message += `\nMissing Features: ${errorWithProperties.missingFeatures.join(', ')}`;
    }
  }

  return message;
}
