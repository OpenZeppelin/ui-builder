/**
 * Stellar-specific contract artifacts interface
 * Defines the structure of data needed to load Stellar contracts
 */
export interface StellarContractArtifacts {
  /** The deployed contract ID (required, C...) */
  contractAddress: string;
}

/**
 * Type guard to check if an object matches StellarContractArtifacts structure
 */
export function isStellarContractArtifacts(obj: unknown): obj is StellarContractArtifacts {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).contractAddress === 'string'
  );
}
