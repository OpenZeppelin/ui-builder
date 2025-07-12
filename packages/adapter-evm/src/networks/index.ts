import { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

import {
  arbitrumMainnet,
  baseMainnet /*, other mainnets */,
  ethereumMainnet,
  polygonMainnet,
} from './mainnet';
import {
  arbitrumSepolia,
  baseSepolia /*, other testnets */,
  ethereumSepolia,
  polygonAmoy,
} from './testnet';

// All mainnet networks
export const evmMainnetNetworks: EvmNetworkConfig[] = [
  ethereumMainnet,
  arbitrumMainnet,
  baseMainnet,
  polygonMainnet,
  // Other mainnet networks...
];

// All testnet networks
export const evmTestnetNetworks: EvmNetworkConfig[] = [
  ethereumSepolia,
  arbitrumSepolia,
  baseSepolia,
  polygonAmoy,
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
  polygonMainnet,
  baseMainnet,
  // Testnet networks
  ethereumSepolia,
  arbitrumSepolia,
  polygonAmoy,
  baseSepolia,
};
