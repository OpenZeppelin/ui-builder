// Re-export the main adapter class
export { EvmAdapter } from './adapter';

// Export RainbowKit customization types
export * from './wallet/rainbowkit/types';

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
export { isEvmContractArtifacts } from '@openzeppelin/ui-builder-adapter-evm-core';

// Export adapter-specific types
export type { EvmRelayerTransactionOptions } from './transaction/relayer';

// Export abi module for comparison functionality
export { abiComparisonService } from './abi';
