import { StellarNetworkConfig } from '@openzeppelin/transaction-form-types';

import { stellarPublic } from './mainnet';
import { stellarTestnet } from './testnet';

// All mainnet networks
export const stellarMainnetNetworks: StellarNetworkConfig[] = [stellarPublic];

// All testnet networks
export const stellarTestnetNetworks: StellarNetworkConfig[] = [stellarTestnet];

// All Stellar networks
export const stellarNetworks: StellarNetworkConfig[] = [
  ...stellarMainnetNetworks,
  ...stellarTestnetNetworks,
];

// Export individual networks as well
export { stellarPublic, stellarTestnet };
