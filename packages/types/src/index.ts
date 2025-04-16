/**
 * Transaction Form Types
 *
 * This is the main entry point for all shared type definitions used across
 * the Transaction Form Builder ecosystem.
 *
 * For most use cases, you should import directly from specific namespaces:
 * - '@openzeppelin/transaction-form-types/adapters'
 * - '@openzeppelin/transaction-form-types/contracts'
 * - '@openzeppelin/transaction-form-types/forms'
 */
import * as adapters from './adapters';
import * as contracts from './contracts';
import * as forms from './forms';

export { adapters, contracts, forms };

// Re-export some commonly used types for convenience
export type { ContractAdapter } from './adapters';
export type { ChainType, ContractSchema, ContractFunction } from './contracts';
export type { FieldType, FormFieldType, FormValues } from './forms';
