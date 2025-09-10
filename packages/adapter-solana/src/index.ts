// Re-export the main adapter class
export { SolanaAdapter } from './adapter';

// Re-export adapter-specific types
export type { SolanaContractArtifacts } from './types/artifacts';
export { isSolanaContractArtifacts } from './types/artifacts';

export {
  solanaNetworks,
  solanaMainnetNetworks,
  solanaTestnetNetworks,
  // Individual networks
  solanaMainnetBeta,
  solanaDevnet,
  solanaTestnet,
} from './networks';

// Export adapter configuration
export { solanaAdapterConfig } from './config';
