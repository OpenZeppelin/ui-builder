/**
 * @fileoverview Mainnet network configurations for Polkadot adapter.
 */

import { NetworkMoonbeam, NetworkPolkadot } from '@web3icons/react';
import { moonbeam, moonriver } from 'viem/chains';

import type { TypedPolkadotNetworkConfig } from '../types';
import { polkadotHub } from './chains';

/**
 * Polkadot Hub mainnet configuration.
 * Chain ID: 420420419, Currency: DOT, Explorer: Blockscout
 */
export const polkadotHubMainnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-hub',
  name: 'Polkadot Hub',
  exportConstName: 'polkadotHubMainnet',
  ecosystem: 'polkadot',
  network: 'polkadot-hub',
  type: 'mainnet',
  isTestnet: false,
  chainId: 420420419,
  rpcUrl: 'https://services.polkadothub-rpc.com/mainnet',
  explorerUrl: 'https://blockscout.polkadot.io',
  apiUrl: 'https://blockscout.polkadot.io/api',
  supportsEtherscanV2: false,
  iconComponent: NetworkPolkadot,
  nativeCurrency: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 18,
  },
  viemChain: polkadotHub,
  executionType: 'evm',
  networkCategory: 'hub',
  relayChain: 'polkadot',
};

/**
 * Kusama Hub mainnet configuration.
 * Chain ID: 420420418, Currency: KSM, Explorer: Blockscout
 *
 * NOTE: Temporarily disabled - The official RPC endpoint DNS
 * (kusama-asset-hub-eth-rpc.polkadot.io) does not resolve as of Jan 2026.
 * Re-enable once the Kusama Hub EVM RPC service is publicly available.
 * @see https://kusama.network/smart-contracts for updates
 */
// export const kusamaHubMainnet: TypedPolkadotNetworkConfig = {
//   id: 'kusama-hub',
//   name: 'Kusama Hub',
//   exportConstName: 'kusamaHubMainnet',
//   ecosystem: 'polkadot',
//   network: 'kusama-hub',
//   type: 'mainnet',
//   isTestnet: false,
//   chainId: 420420418,
//   rpcUrl: 'https://kusama-asset-hub-eth-rpc.polkadot.io',
//   explorerUrl: 'https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io',
//   apiUrl: 'https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/api',
//   supportsEtherscanV2: false,
//   iconComponent: NetworkPolkadot, // Kusama uses Polkadot icon as fallback (canary network)
//   nativeCurrency: {
//     name: 'Kusama',
//     symbol: 'KSM',
//     decimals: 18,
//   },
//   viemChain: kusamaHub,
//   executionType: 'evm',
//   networkCategory: 'hub',
//   relayChain: 'kusama',
// };

// ============================================================================
// PARACHAIN NETWORKS (P2)
// ============================================================================

/**
 * Moonbeam mainnet configuration.
 * Chain ID: 1284, Currency: GLMR, Explorer: Moonscan
 */
export const moonbeamMainnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-moonbeam-mainnet',
  name: 'Moonbeam',
  exportConstName: 'moonbeamMainnet',
  ecosystem: 'polkadot',
  network: 'moonbeam',
  type: 'mainnet',
  isTestnet: false,
  chainId: 1284,
  rpcUrl: 'https://rpc.api.moonbeam.network',
  explorerUrl: 'https://moonbeam.moonscan.io',
  apiUrl: 'https://api-moonbeam.moonscan.io/api',
  supportsEtherscanV2: true,
  primaryExplorerApiIdentifier: 'etherscan-v2',
  iconComponent: NetworkMoonbeam,
  nativeCurrency: {
    name: 'Glimmer',
    symbol: 'GLMR',
    decimals: 18,
  },
  viemChain: moonbeam,
  executionType: 'evm',
  networkCategory: 'parachain',
  relayChain: 'polkadot',
};

/**
 * Moonriver mainnet configuration.
 * Chain ID: 1285, Currency: MOVR, Explorer: Moonscan
 */
export const moonriverMainnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-moonriver-mainnet',
  name: 'Moonriver',
  exportConstName: 'moonriverMainnet',
  ecosystem: 'polkadot',
  network: 'moonriver',
  type: 'mainnet',
  isTestnet: false,
  chainId: 1285,
  rpcUrl: 'https://rpc.api.moonriver.moonbeam.network',
  explorerUrl: 'https://moonriver.moonscan.io',
  apiUrl: 'https://api-moonriver.moonscan.io/api',
  supportsEtherscanV2: true,
  primaryExplorerApiIdentifier: 'etherscan-v2',
  iconComponent: NetworkMoonbeam, // Moonriver uses Moonbeam icon (same ecosystem)
  nativeCurrency: {
    name: 'Moonriver',
    symbol: 'MOVR',
    decimals: 18,
  },
  viemChain: moonriver,
  executionType: 'evm',
  networkCategory: 'parachain',
  relayChain: 'kusama',
};

/**
 * All mainnet network configurations in priority order.
 * Hub networks first (P1), then parachains (P2).
 *
 * NOTE: kusamaHubMainnet temporarily excluded - RPC not available yet.
 */
export const mainnetNetworks = [
  polkadotHubMainnet,
  // kusamaHubMainnet, // Temporarily disabled - RPC DNS not resolving
  moonbeamMainnet,
  moonriverMainnet,
] as const;
