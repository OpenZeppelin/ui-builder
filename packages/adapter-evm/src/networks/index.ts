import { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

import { ethereumMainnet, polygonMainnet /*, other mainnets */ } from './mainnet';
import { ethereumSepolia, polygonAmoy /*, other testnets */ } from './testnet';

// All mainnet networks
export const evmMainnetNetworks: EvmNetworkConfig[] = [
  ethereumMainnet,
  polygonMainnet,
  // Other mainnet networks...
];

// All testnet networks
export const evmTestnetNetworks: EvmNetworkConfig[] = [
  ethereumSepolia,
  polygonAmoy,
  // Other testnet networks...
];

// All EVM networks
export const evmNetworks: EvmNetworkConfig[] = [...evmMainnetNetworks, ...evmTestnetNetworks];

// Export individual networks as well for direct import if needed
export {
  ethereumMainnet,
  polygonMainnet,
  ethereumSepolia,
  polygonAmoy,
  // Other networks...
};
