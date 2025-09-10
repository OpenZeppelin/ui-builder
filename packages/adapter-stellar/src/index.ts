// Re-export the main adapter class
export { StellarAdapter } from './adapter';

// Re-export adapter-specific types
export type { StellarContractArtifacts } from './types/artifacts';
export { isStellarContractArtifacts } from './types/artifacts';

export {
  stellarNetworks,
  stellarMainnetNetworks,
  stellarTestnetNetworks,
  // Individual networks
  stellarPublic,
  stellarTestnet,
} from './networks';

// Export adapter configuration
export { stellarAdapterConfig } from './config';
