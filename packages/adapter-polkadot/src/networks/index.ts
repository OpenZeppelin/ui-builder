/**
 * All network configurations indexed by ID.
 */
import { mainnetNetworks } from './mainnet';
import { testnetNetworks } from './testnet';

/**
 * @fileoverview Network configuration exports for Polkadot adapter.
 */

// Viem chain definitions (custom Hub chains)
export { polkadotHub, kusamaHub, polkadotHubTestNet } from './chains';

// Viem chain definitions (from viem/chains)
export { moonbeam, moonriver, moonbaseAlpha } from 'viem/chains';

// Mainnet networks - Hub networks first, then parachains
export {
  polkadotHubMainnet,
  kusamaHubMainnet,
  moonbeamMainnet,
  moonriverMainnet,
  mainnetNetworks,
} from './mainnet';

// Testnet networks - Hub networks first, then parachains
export { polkadotHubTestnet, moonbaseAlphaTestnet, testnetNetworks } from './testnet';

// Re-export types
export type { TypedPolkadotNetworkConfig } from '../types';

export const networks = {
  ...Object.fromEntries(mainnetNetworks.map((n) => [n.id, n])),
  ...Object.fromEntries(testnetNetworks.map((n) => [n.id, n])),
} as const;
