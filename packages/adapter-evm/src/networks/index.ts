import { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

import { baseMainnet /*, other mainnets */, ethereumMainnet, polygonMainnet } from './mainnet';
import { baseSepolia /*, other testnets */, ethereumSepolia, polygonAmoy } from './testnet';

// All mainnet networks
export const evmMainnetNetworks: EvmNetworkConfig[] = [
  ethereumMainnet,
  baseMainnet,
  polygonMainnet,
  // Other mainnet networks...
];

// All testnet networks
export const evmTestnetNetworks: EvmNetworkConfig[] = [
  ethereumSepolia,
  baseSepolia,
  polygonAmoy,
  // Other testnet networks...
];

// All EVM networks
// NOTE: The wagmi integration automatically uses all networks defined here that have a `viemChain` property.
// This ensures that adding a new network to mainnet.ts or testnet.ts automatically makes it available in wagmi.
// Only networks with `viemChain` (from viem/chains) are supported to ensure wagmi compatibility.
export const evmNetworks: EvmNetworkConfig[] = [...evmMainnetNetworks, ...evmTestnetNetworks];

// Export individual networks as well for direct import if needed
export {
  ethereumMainnet,
  polygonMainnet,
  baseMainnet,
  ethereumSepolia,
  polygonAmoy,
  baseSepolia,
  // Other networks...
};
