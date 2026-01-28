/**
 * @fileoverview Testnet network configurations for Polkadot adapter.
 */

import { NetworkMoonbeam, NetworkPolkadot } from '@web3icons/react';
import { moonbaseAlpha } from 'viem/chains';

import type { TypedPolkadotNetworkConfig } from '../types';
import { polkadotHubTestNet } from './chains';

/**
 * Polkadot Hub testnet configuration.
 * Chain ID: 420420417, Currency: PAS (Paseo), Explorer: Routescan
 *
 * Note: Uses Routescan's Etherscan-compatible V1 API (not Etherscan V2).
 * API key format: rs_* (Routescan-specific)
 */
export const polkadotHubTestnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-hub-testnet',
  name: 'Polkadot Hub TestNet',
  exportConstName: 'polkadotHubTestnet',
  ecosystem: 'polkadot',
  network: 'polkadot-hub-testnet',
  type: 'testnet',
  isTestnet: true,
  chainId: 420420417,
  rpcUrl: 'https://services.polkadothub-rpc.com/testnet',
  explorerUrl: 'https://polkadot.testnet.routescan.io',
  apiUrl: 'https://api.routescan.io/v2/network/testnet/evm/420420417/etherscan/api',
  supportsEtherscanV2: false, // Uses Routescan API directly, not unified Etherscan V2
  primaryExplorerApiIdentifier: 'routescan',
  iconComponent: NetworkPolkadot,
  nativeCurrency: {
    name: 'Paseo',
    symbol: 'PAS',
    decimals: 18,
  },
  viemChain: polkadotHubTestNet,
  executionType: 'evm',
  networkCategory: 'hub',
  relayChain: 'polkadot',
};

// ============================================================================
// PARACHAIN TESTNETS (P2)
// ============================================================================

/**
 * Moonbase Alpha testnet configuration.
 * Chain ID: 1287, Currency: DEV, Explorer: Moonscan
 */
export const moonbaseAlphaTestnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-moonbase-alpha-testnet',
  name: 'Moonbase Alpha',
  exportConstName: 'moonbaseAlphaTestnet',
  ecosystem: 'polkadot',
  network: 'moonbase-alpha',
  type: 'testnet',
  isTestnet: true,
  chainId: 1287,
  rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
  explorerUrl: 'https://moonbase.moonscan.io',
  apiUrl: 'https://api-moonbase.moonscan.io/api',
  supportsEtherscanV2: true,
  primaryExplorerApiIdentifier: 'etherscan-v2',
  iconComponent: NetworkMoonbeam,
  nativeCurrency: {
    name: 'DEV',
    symbol: 'DEV',
    decimals: 18,
  },
  viemChain: moonbaseAlpha,
  executionType: 'evm',
  networkCategory: 'parachain',
  relayChain: undefined, // Testnet, no relay chain
};

/**
 * All testnet network configurations in priority order.
 * Hub networks first (P1), then parachains (P2).
 */
export const testnetNetworks = [polkadotHubTestnet, moonbaseAlphaTestnet] as const;
