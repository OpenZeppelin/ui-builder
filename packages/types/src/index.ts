/**
 * Transaction Form Types
 *
 * This is the main entry point for all shared type definitions used across
 * the Transaction Form Builder ecosystem.
 *
 * For most use cases, you should import directly from specific namespaces:
 * - '@openzeppelin/transaction-form-types/common'
 * - '@openzeppelin/transaction-form-types/contracts'
 * - '@openzeppelin/transaction-form-types/forms'
 * - '@openzeppelin/transaction-form-types/networks'
 */
import * as common from './common';
import * as contracts from './contracts';
import * as forms from './forms';

export { common, contracts, forms };

// Re-export some commonly used types for convenience
export type { Ecosystem, NetworkType, EcosystemDefinition } from './common/ecosystem';
export type { ContractSchema, ContractFunction } from './contracts';
export type { FieldType, FormFieldType, FormValues } from './forms';

export * from './adapters';
export * from './common';
export * from './contracts';
export * from './forms';
// export * from './transactions'; // Will be uncommented when this module exists
export * from './networks';
