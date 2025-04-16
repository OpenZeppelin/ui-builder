/**
 * Form Type Definitions for the Core Package
 *
 * NOTE: This file contains only types specific to the core package.
 * Common form types are imported directly from the form-renderer package
 * when needed, rather than being re-exported here.
 * If you see that the types must be used in multiple packages, please consider
 * adding them to the @openzeppelin/transaction-form-types package instead.
 */
// Import using the package name from dependencies
import type { CommonFormProperties } from '@openzeppelin/transaction-form-types/forms';

/**
 * Configuration input used during form creation and editing in the builder
 * This is specific to the core package and extends CommonFormProperties from form-renderer
 */
export interface BuilderFormConfig extends CommonFormProperties {
  /**
   * ID of the contract function this form is for
   */
  functionId: string;

  /**
   * Custom title for the form
   */
  title?: string;

  /**
   * Custom description for the form
   */
  description?: string;

  executionConfig?: ExecutionConfig;
}

/**
 * Generic internal type identifier for execution methods.
 */
export type ExecutionMethodType = 'eoa' | 'relayer' | 'multisig'; // Extendable

/**
 * Detailed information about a supported execution method, provided by the adapter.
 */
export interface ExecutionMethodDetail {
  type: ExecutionMethodType; // The generic type used internally
  name: string; // User-facing display name (e.g., "Safe Multisig")
  description?: string; // Optional description for UI tooltips
  disabled?: boolean; // Allows adapter to disable (e.g., requires extra setup)
}

export interface EoaExecutionConfig {
  method: 'eoa';
  allowAny: boolean;
  specificAddress?: string; // Required if allowAny is false, validated by adapter
}

export interface RelayerExecutionConfig {
  method: 'relayer';
  // Relayer-specific config options TBD. Adapter will validate.
  // Example: relayerUrl?: string;
}

export interface MultisigExecutionConfig {
  method: 'multisig';
  // Generic Multisig Config TBD. Adapter will validate based on the specific
  // multisig type it represents (e.g., Safe, Squads).
  // Example: multisigAddress?: string; requiredSigners?: number;
}

// Union type for the configuration stored in the builder state
export type ExecutionConfig = EoaExecutionConfig | RelayerExecutionConfig | MultisigExecutionConfig;
