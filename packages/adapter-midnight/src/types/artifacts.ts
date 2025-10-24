/**
 * Midnight-specific contract artifacts interface
 * Defines the structure of data needed to load Midnight contracts
 */
export interface MidnightContractArtifacts {
  /** The deployed contract address (required, Bech32m format) */
  contractAddress: string;

  /** Unique identifier for private state instance (required) */
  privateStateId: string;

  /** TypeScript interface definition from contract.d.ts (required) */
  contractDefinition: string;

  /** Optional compiled contract code from contract.cjs */
  contractModule?: string;

  /** Optional witness functions for zero-knowledge proofs */
  witnessCode?: string;

  /** Optional verifier keys for ZK proofs (from keys directory) */
  verifierKeys?: Record<string, unknown>;

  /** Optional original ZIP data for auto-save functionality */
  originalZipData?: string;
}

/**
 * Type guard to check if an object matches MidnightContractArtifacts structure
 */
export function isMidnightContractArtifacts(obj: unknown): obj is MidnightContractArtifacts {
  const record = obj as Record<string, unknown>;
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof record.contractAddress === 'string' &&
    typeof record.privateStateId === 'string' &&
    typeof record.contractDefinition === 'string'
  );
}
