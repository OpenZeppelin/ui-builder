/**
 * EVM-specific contract artifacts interface
 * Defines the structure of data needed to load EVM contracts
 */
import type { EvmContractDefinitionProviderKey } from './providers';

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

  /** Optional forced provider for this load attempt (session-scoped override) */
  __forcedProvider?: EvmContractDefinitionProviderKey;
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
