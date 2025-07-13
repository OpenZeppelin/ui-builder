import { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

import {
  arbitrumMainnet,
  avalancheMainnet,
  baseMainnet,
  bscMainnet,
  ethereumMainnet,
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
  optimismSepolia,
  polygonAmoy,
  polygonZkEvmCardona,
  scrollSepolia,
  zkSyncEraSepolia,
} from './testnet';

// All mainnet networks
export const evmMainnetNetworks: EvmNetworkConfig[] = [
  ethereumMainnet,
  arbitrumMainnet,
  baseMainnet,
  polygonMainnet,
  polygonZkEvmMainnet,
  bscMainnet,
  optimismMainnet,
  avalancheMainnet,
  scrollMainnet,
  zkSyncEraMainnet,
  // Other mainnet networks...
];

// All testnet networks
export const evmTestnetNetworks: EvmNetworkConfig[] = [
  ethereumSepolia,
  arbitrumSepolia,
  baseSepolia,
  polygonAmoy,
  polygonZkEvmCardona,
  bscTestnet,
  optimismSepolia,
  avalancheFuji,
  scrollSepolia,
  zkSyncEraSepolia,
  // Other testnet networks...
];

// All EVM networks
// NOTE: The wagmi integration automatically uses all networks defined here that have a `viemChain` property.
// This ensures that adding a new network to mainnet.ts or testnet.ts automatically makes it available to wagmi.
export const evmNetworks: EvmNetworkConfig[] = [...evmMainnetNetworks, ...evmTestnetNetworks];

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
  scrollSepolia,
  zkSyncEraSepolia,
};
