import { MidnightNetworkConfig } from '@openzeppelin/transaction-form-types';

import { midnightMainnet } from './mainnet';
import { midnightDevnet } from './testnet';

// All mainnet networks
export const midnightMainnetNetworks: MidnightNetworkConfig[] = [midnightMainnet];

// All testnet/devnet networks
export const midnightTestnetNetworks: MidnightNetworkConfig[] = [midnightDevnet];

// All Midnight networks
export const midnightNetworks: MidnightNetworkConfig[] = [
  ...midnightMainnetNetworks,
  ...midnightTestnetNetworks,
];

// Export individual networks as well
export { midnightMainnet, midnightDevnet };
