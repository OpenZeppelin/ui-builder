/**
 * Solana-specific contract artifacts interface
 * Defines the structure of data needed to load Solana programs
 */
export interface SolanaContractArtifacts {
  /** The program ID (required) */
  contractAddress: string;

  /** Optional IDL JSON for program interface */
  idl?: string;
}

/**
 * Type guard to check if an object matches SolanaContractArtifacts structure
 */
export function isSolanaContractArtifacts(obj: unknown): obj is SolanaContractArtifacts {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).contractAddress === 'string'
  );
}
