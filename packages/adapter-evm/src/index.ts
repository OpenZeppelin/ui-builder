// Re-export the main adapter class
export { EvmAdapter } from './adapter';

// Export RainbowKit customization types
export * from './wallet/rainbowkit/types';

// Optionally re-export types if they need to be accessible directly
// export * from './types';

export {
  evmNetworks,
  evmMainnetNetworks,
  evmTestnetNetworks,
  // Individual networks
  ethereumMainnet,
  arbitrumMainnet,
  polygonMainnet,
  polygonZkEvmMainnet,
  baseMainnet,
  bscMainnet,
  optimismMainnet,
  avalancheMainnet,
  zkSyncEraMainnet,
  ethereumSepolia,
  arbitrumSepolia,
  polygonAmoy,
  polygonZkEvmCardona,
  baseSepolia,
  bscTestnet,
  optimismSepolia,
  avalancheFuji,
  zkSyncEraSepolia,
  // ... other individual network exports
} from './networks';

// Export adapter configuration
export { evmAdapterConfig } from './config';

export type { WriteContractParameters } from './types';
export type { EvmRelayerTransactionOptions } from './transaction/relayer';
