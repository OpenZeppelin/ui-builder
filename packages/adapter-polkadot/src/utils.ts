/**
 * @fileoverview Utility functions for the Polkadot adapter.
 *
 * Provides helpers for filtering and querying Polkadot network configurations
 * by category, relay chain, and other criteria.
 */

import { polkadotNetworks } from './networks';
import type {
  PolkadotNetworkCategory,
  PolkadotRelayChain,
  TypedPolkadotNetworkConfig,
} from './types';

/**
 * Get all networks matching a specific category.
 *
 * @param category - The network category to filter by ('hub' or 'parachain')
 * @returns Array of networks matching the category
 *
 * @example
 * ```typescript
 * import { getNetworksByCategory } from '@openzeppelin/ui-builder-adapter-polkadot';
 *
 * const hubNetworks = getNetworksByCategory('hub');
 * // Returns: [polkadotHubMainnet, kusamaHubMainnet, polkadotHubTestnet]
 *
 * const parachains = getNetworksByCategory('parachain');
 * // Returns: [moonbeamMainnet, moonriverMainnet, moonbaseAlphaTestnet]
 * ```
 */
export function getNetworksByCategory(
  category: PolkadotNetworkCategory
): TypedPolkadotNetworkConfig[] {
  return polkadotNetworks.filter((network) => network.networkCategory === category);
}

/**
 * Get all networks connected to a specific relay chain.
 *
 * @param relayChain - The relay chain to filter by ('polkadot' or 'kusama')
 * @returns Array of networks connected to the relay chain
 *
 * @example
 * ```typescript
 * import { getNetworksByRelayChain } from '@openzeppelin/ui-builder-adapter-polkadot';
 *
 * const polkadotNetworks = getNetworksByRelayChain('polkadot');
 * // Returns: [polkadotHubMainnet, moonbeamMainnet, ...]
 *
 * const kusamaNetworks = getNetworksByRelayChain('kusama');
 * // Returns: [kusamaHubMainnet, moonriverMainnet]
 * ```
 */
export function getNetworksByRelayChain(
  relayChain: PolkadotRelayChain
): TypedPolkadotNetworkConfig[] {
  return polkadotNetworks.filter((network) => network.relayChain === relayChain);
}

/**
 * Type guard to check if a network is a Hub network.
 *
 * @param network - The network configuration to check
 * @returns True if the network is a Hub network
 *
 * @example
 * ```typescript
 * import { isHubNetwork, polkadotHubMainnet, moonbeamMainnet } from '@openzeppelin/ui-builder-adapter-polkadot';
 *
 * isHubNetwork(polkadotHubMainnet); // true
 * isHubNetwork(moonbeamMainnet);    // false
 * ```
 */
export function isHubNetwork(network: TypedPolkadotNetworkConfig): boolean {
  return network.networkCategory === 'hub';
}

/**
 * Type guard to check if a network is a parachain network.
 *
 * @param network - The network configuration to check
 * @returns True if the network is a parachain network
 *
 * @example
 * ```typescript
 * import { isParachainNetwork, polkadotHubMainnet, moonbeamMainnet } from '@openzeppelin/ui-builder-adapter-polkadot';
 *
 * isParachainNetwork(polkadotHubMainnet); // false
 * isParachainNetwork(moonbeamMainnet);    // true
 * ```
 */
export function isParachainNetwork(network: TypedPolkadotNetworkConfig): boolean {
  return network.networkCategory === 'parachain';
}

/**
 * Get all mainnet networks.
 *
 * @returns Array of mainnet network configurations
 */
export function getMainnetNetworks(): TypedPolkadotNetworkConfig[] {
  return polkadotNetworks.filter((network) => !network.isTestnet);
}

/**
 * Get all testnet networks.
 *
 * @returns Array of testnet network configurations
 */
export function getTestnetNetworks(): TypedPolkadotNetworkConfig[] {
  return polkadotNetworks.filter((network) => network.isTestnet);
}

/**
 * Find a network by its chain ID.
 *
 * @param chainId - The EVM chain ID to search for
 * @returns The network configuration, or undefined if not found
 */
export function getNetworkByChainId(chainId: number): TypedPolkadotNetworkConfig | undefined {
  return polkadotNetworks.find((network) => network.chainId === chainId);
}

/**
 * Find a network by its ID.
 *
 * @param id - The network ID to search for (e.g., 'polkadot-hub-mainnet')
 * @returns The network configuration, or undefined if not found
 */
export function getNetworkById(id: string): TypedPolkadotNetworkConfig | undefined {
  return polkadotNetworks.find((network) => network.id === id);
}
