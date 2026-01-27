/**
 * @fileoverview Network configuration exports for Polkadot adapter.
 *
 * Follows the same export pattern as adapter-evm:
 * - polkadotNetworks: All networks
 * - polkadotMainnetNetworks: Mainnet networks only
 * - polkadotTestnetNetworks: Testnet networks only
 * - Individual network exports
 */

import { mainnetNetworks } from './mainnet';
import { testnetNetworks } from './testnet';

// Viem chain definitions (custom Hub chains)
export { polkadotHub, kusamaHub, polkadotHubTestNet } from './chains';

// Viem chain definitions (from viem/chains)
export { moonbeam, moonriver, moonbaseAlpha } from 'viem/chains';

// Individual mainnet networks - Hub networks first, then parachains
export { polkadotHubMainnet, kusamaHubMainnet, moonbeamMainnet, moonriverMainnet } from './mainnet';

// Individual testnet networks - Hub networks first, then parachains
export { polkadotHubTestnet, moonbaseAlphaTestnet } from './testnet';

// Re-export types
export type { TypedPolkadotNetworkConfig } from '../types';

/**
 * All Polkadot mainnet networks.
 * Hub networks appear first (P1), followed by parachain networks (P2).
 */
export const polkadotMainnetNetworks = mainnetNetworks;

/**
 * All Polkadot testnet networks.
 * Hub networks appear first (P1), followed by parachain networks (P2).
 */
export const polkadotTestnetNetworks = testnetNetworks;

/**
 * All Polkadot ecosystem networks as an array.
 * Used by the ecosystem manager for network discovery.
 * Hub networks appear first (P1), followed by parachain networks (P2).
 */
export const polkadotNetworks = [...mainnetNetworks, ...testnetNetworks];
