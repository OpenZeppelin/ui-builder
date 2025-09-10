/**
 * EVM-specific contract artifacts interface
 * Defines the structure of data needed to load EVM contracts
 */
export interface EvmContractArtifacts {
  /** The deployed contract address (required) */
  contractAddress: string;

  /** Optional manual ABI JSON string (for unverified contracts) */
  contractDefinition?: string;

  /** Optional proxy detection configuration */
  __proxyDetectionOptions?: {
    /** Skip automatic proxy detection */
    skipProxyDetection?: boolean;
  };
}

/**
 * Type guard to check if an object matches EvmContractArtifacts structure
 */
export function isEvmContractArtifacts(obj: unknown): obj is EvmContractArtifacts {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).contractAddress === 'string'
  );
}
