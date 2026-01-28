import type { TypedEvmNetworkConfig } from '@openzeppelin/ui-builder-adapter-evm-core';

import {
  arbitrumMainnet,
  avalancheMainnet,
  baseMainnet,
  bscMainnet,
  ethereumMainnet,
  lineaMainnet,
  optimismMainnet,
  polygonMainnet,
  polygonZkEvmMainnet,
  scrollMainnet,
  zkSyncEraMainnet,
} from './mainnet';
import {
  arbitrumSepolia,
  avalancheFuji,
  baseSepolia,
  bscTestnet,
  ethereumSepolia,
  lineaSepolia,
  monadTestnet,
  optimismSepolia,
  polygonAmoy,
  polygonZkEvmCardona,
  scrollSepolia,
  zksyncSepoliaTestnet,
} from './testnet';

// All mainnet networks
export const evmMainnetNetworks: TypedEvmNetworkConfig[] = [
  ethereumMainnet,
  arbitrumMainnet,
  baseMainnet,
  polygonMainnet,
  polygonZkEvmMainnet,
  bscMainnet,
  optimismMainnet,
  avalancheMainnet,
  lineaMainnet,
  scrollMainnet,
  zkSyncEraMainnet,
  // Other mainnet networks...
];

// All testnet networks
export const evmTestnetNetworks: TypedEvmNetworkConfig[] = [
  ethereumSepolia,
  arbitrumSepolia,
  baseSepolia,
  polygonAmoy,
  polygonZkEvmCardona,
  bscTestnet,
  optimismSepolia,
  avalancheFuji,
  lineaSepolia,
  scrollSepolia,
  zksyncSepoliaTestnet,
  monadTestnet,
  // Other testnet networks...
];

// All EVM networks
// NOTE: The wagmi integration automatically uses all networks defined here that have a `viemChain` property.
// This ensures that adding a new network to mainnet.ts or testnet.ts automatically makes it available to wagmi.
export const evmNetworks: TypedEvmNetworkConfig[] = [...evmMainnetNetworks, ...evmTestnetNetworks];

// Export individual networks for direct import
export {
  // Mainnet networks
  ethereumMainnet,
  arbitrumMainnet,
  baseMainnet,
  polygonMainnet,
  polygonZkEvmMainnet,
  bscMainnet,
  optimismMainnet,
  avalancheMainnet,
  lineaMainnet,
  scrollMainnet,
  zkSyncEraMainnet,
  // Testnet networks
  ethereumSepolia,
  arbitrumSepolia,
  baseSepolia,
  polygonAmoy,
  polygonZkEvmCardona,
  bscTestnet,
  optimismSepolia,
  avalancheFuji,
  lineaSepolia,
  scrollSepolia,
  zksyncSepoliaTestnet,
  monadTestnet,
};
