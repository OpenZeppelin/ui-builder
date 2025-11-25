/**
 * Contract adapter interfaces and types
 * Re-exports base adapter types and defines combined types.
 * @packageDocumentation
 */
import type { ContractAdapter } from './base';
import type { ContractStateCapabilities } from './contract-state';

// Re-export all types from base
export * from './base';

// Re-export contract state capabilities
export * from './contract-state';

// Re-export adapter configuration types
export * from './config';

// Re-export UI enhancements
export * from './ui-enhancements';

// Re-export export bootstrapping types
export * from './export';

// Re-export access control types
export * from './access-control';

// Re-export access control error types
export * from './access-control-errors';

/**
 * Combined adapter interface with all capabilities
 *
 * This type represents a full-featured adapter that implements both the base
 * ContractAdapter interface and additional capabilities like contract state querying.
 */
export type FullContractAdapter = ContractAdapter & ContractStateCapabilities;
