// Re-export the main adapter class
export { EvmAdapter } from './adapter';

// Export RainbowKit customization types (re-exported from core via rainbowkit/index.ts)
export type {
  AppInfo,
  RainbowKitConnectButtonProps,
  RainbowKitProviderProps,
  RainbowKitKitConfig,
  RainbowKitCustomizations,
} from './wallet/rainbowkit';
export { isRainbowKitCustomizations, extractRainbowKitCustomizations } from './wallet/rainbowkit';

// Export EVM networks
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
  lineaMainnet,
  scrollMainnet,
  zkSyncEraMainnet,
  ethereumSepolia,
  arbitrumSepolia,
  polygonAmoy,
  polygonZkEvmCardona,
  baseSepolia,
  bscTestnet,
  optimismSepolia,
  avalancheFuji,
  lineaSepolia,
  scrollSepolia,
  zksyncSepoliaTestnet,
  // ... other individual network exports
} from './networks';

// Export adapter configuration
export { evmAdapterConfig } from './config';

// Re-export core types for public API compatibility
export type {
  TypedEvmNetworkConfig,
  WriteContractParameters,
  EvmContractArtifacts,
} from '@openzeppelin/ui-builder-adapter-evm-core';
export {
  isEvmContractArtifacts,
  abiComparisonService,
} from '@openzeppelin/ui-builder-adapter-evm-core';

// Export adapter-specific types
export type { EvmRelayerTransactionOptions } from '@openzeppelin/ui-builder-adapter-evm-core';
