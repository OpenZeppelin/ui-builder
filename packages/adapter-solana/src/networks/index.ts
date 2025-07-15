import { SolanaNetworkConfig } from '@openzeppelin/contracts-ui-builder-types';

import { solanaMainnetBeta } from './mainnet';
import { solanaDevnet, solanaTestnet } from './testnet';

// All mainnet networks
export const solanaMainnetNetworks: SolanaNetworkConfig[] = [solanaMainnetBeta];

// All testnet/devnet networks
export const solanaTestnetNetworks: SolanaNetworkConfig[] = [solanaDevnet, solanaTestnet];

// All Solana networks
export const solanaNetworks: SolanaNetworkConfig[] = [
  ...solanaMainnetNetworks,
  ...solanaTestnetNetworks,
];

// Export individual networks as well
export { solanaMainnetBeta, solanaDevnet, solanaTestnet };
