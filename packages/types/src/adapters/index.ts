/**
 * Contract adapter interfaces
 * @packageDocumentation
 */
import type { ContractAdapter } from './base';
import type { ContractStateCapabilities } from './contract-state';

export * from './base';
export * from './contract-state';

/**
 * Combined adapter interface with all capabilities
 *
 * This type represents a full-featured adapter that implements both the base
 * ContractAdapter interface and additional capabilities like contract state querying.
 */
export type FullContractAdapter = ContractAdapter & ContractStateCapabilities;
