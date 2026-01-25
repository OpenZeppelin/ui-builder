/**
 * All network configurations indexed by ID.
 */
import { mainnetNetworks } from './mainnet';
import { testnetNetworks } from './testnet';

/**
 * @fileoverview Network configuration exports for Polkadot adapter.
 */

// Viem chain definitions
export { polkadotHub, kusamaHub, polkadotHubTestNet } from './chains';

// Mainnet networks
export { polkadotHubMainnet, kusamaHubMainnet, mainnetNetworks } from './mainnet';

// Testnet networks
export { polkadotHubTestnet, testnetNetworks } from './testnet';

// Re-export types
export type { TypedPolkadotNetworkConfig } from '../types';

export const networks = {
  ...Object.fromEntries(mainnetNetworks.map((n) => [n.id, n])),
  ...Object.fromEntries(testnetNetworks.map((n) => [n.id, n])),
} as const;
