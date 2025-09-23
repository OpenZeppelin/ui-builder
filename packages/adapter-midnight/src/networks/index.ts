import { MidnightNetworkConfig } from '@openzeppelin/ui-builder-types';

import { midnightTestnet } from './testnet';

// All testnet/devnet networks
export const midnightTestnetNetworks: MidnightNetworkConfig[] = [midnightTestnet];

// All Midnight networks - for now, this is just testnets
export const midnightNetworks: MidnightNetworkConfig[] = [...midnightTestnetNetworks];

// Export individual networks as well
export { midnightTestnet };
