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
  // Other testnet networks...
];

// All EVM networks
// NOTE: The wagmi integration automatically uses all networks defined here that have a `viemChain` property.
// This ensures that adding a new network to mainnet.ts or testnet.ts automatically makes it available to wagmi.
export const evmNetworks: EvmNetworkConfig[] = [...evmMainnetNetworks, ...evmTestnetNetworks];

// Export individual networks for direct import
export {
  // Mainnet networks
  arbitrumMainnet,
  avalancheMainnet,
  baseMainnet,
  bscMainnet,
  ethereumMainnet,
  optimismMainnet,
  polygonMainnet,
  polygonZkEvmMainnet,
  // Testnet networks
  arbitrumSepolia,
  avalancheFuji,
  baseSepolia,
  bscTestnet,
  ethereumSepolia,
  optimismSepolia,
  polygonAmoy,
  polygonZkEvmCardona,
};
