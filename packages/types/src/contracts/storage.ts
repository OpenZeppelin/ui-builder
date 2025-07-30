/**
 * Contract Schema Storage and Persistence Types
 *
 * These types support chain-agnostic contract schema storage and comparison functionality
 * while allowing chain-specific implementations in adapters.
 */

/**
 * Metadata associated with a contract schema
 */
export interface ContractSchemaMetadata {
  /** Block explorer URL where schema was fetched from */
  fetchedFrom?: string;
  /** Contract name from verification data */
  contractName?: string;
  /** Compiler version used for contract */
  compilerVersion?: string;
  /** Contract verification status */
  verificationStatus?: 'verified' | 'unverified' | 'unknown';
  /** When the schema was fetched */
  fetchTimestamp?: Date;
  /** Error message if fetch failed */
  fetchError?: string;
}

/**
 * Result of comparing two contract schemas
 */
export interface ContractSchemaComparisonResult {
  /** Whether the schemas are functionally identical */
  identical: boolean;
  /** List of differences between the schemas */
  differences: ContractSchemaDifference[];
  /** Overall severity of differences */
  severity: 'none' | 'minor' | 'major' | 'breaking';
  /** Human-readable summary of the comparison */
  summary: string;
}

/**
 * A specific difference between two contract schemas
 */
export interface ContractSchemaDifference {
  /** Type of change */
  type: 'added' | 'removed' | 'modified';
  /** Section of schema that changed (chain-specific: function, event, etc.) */
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
 * Result of contract schema validation
 */
export interface ContractSchemaValidationResult {
  /** Whether the schema is structurally valid */
  valid: boolean;
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
  /** Normalized schema if validation passed */
  normalizedSchema?: unknown; // Chain-agnostic - actual type depends on chain
}
