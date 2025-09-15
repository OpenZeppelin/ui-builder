export * from './adapter';
export { default } from './adapter'; // Default export for convenience

// Re-export adapter-specific types
export type { MidnightContractArtifacts } from './types/artifacts';
export { isMidnightContractArtifacts } from './types/artifacts';

export { MidnightAdapter } from './adapter';
export {
  midnightNetworks,
  midnightTestnetNetworks,
  // Individual networks
  midnightTestnet,
} from './networks';

// Export adapter configuration
export { midnightAdapterConfig } from './config';
