/**
 * Contract Definition Storage and Persistence Types
 *
 * These types support chain-agnostic contract definition storage and comparison functionality
 * while allowing chain-specific implementations in adapters.
 */

/**
 * Metadata associated with a contract definition
 */
export interface ContractDefinitionMetadata {
  /** Block explorer URL where definition was fetched from */
  fetchedFrom?: string;
  /** Contract name from verification data */
  contractName?: string;
  /** Compiler version used for contract */
  compilerVersion?: string;
  /** Contract verification status */
  verificationStatus?: 'verified' | 'unverified' | 'unknown';
  /** When the definition was fetched */
  fetchTimestamp?: Date;
  /** Error message if fetch failed */
  fetchError?: string;
  /** SHA-256 hash of the raw contract definition for quick comparison */
  definitionHash?: string;
}

/**
 * Result of comparing two contract definitions (raw ABI, IDL, etc.)
 */
export interface ContractDefinitionComparisonResult {
  /** Whether the definitions are functionally identical */
  identical: boolean;
  /** List of differences between the definitions */
  differences: ContractDefinitionDifference[];
  /** Overall severity of differences */
  severity: 'none' | 'minor' | 'major' | 'breaking';
  /** Human-readable summary of the comparison */
  summary: string;
}

/**
 * A specific difference between two contract definitions (raw ABI, IDL, etc.)
 */
export interface ContractDefinitionDifference {
  /** Type of change */
  type: 'added' | 'removed' | 'modified';
  /** Section of definition that changed (chain-specific: function, event, etc.) */
  section: string;
  /** Name of the changed element */
  name: string;
  /** Detailed description of the change */
  details: string;
  /** Impact level of this change */
  impact: 'low' | 'medium' | 'high';
  /** Original signature (for removed/modified items) */
  oldSignature?: string;
  /** New signature (for added/modified items) */
  newSignature?: string;
}

/**
 * Result of contract definition validation (raw ABI, IDL, etc.)
 */
export interface ContractDefinitionValidationResult {
  /** Whether the definition is structurally valid */
  valid: boolean;
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
  /** Normalized definition if validation passed */
  normalizedDefinition?: unknown; // Chain-agnostic - actual type depends on chain
}
