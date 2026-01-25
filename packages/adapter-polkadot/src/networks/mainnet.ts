/**
 * @fileoverview Mainnet network configurations for Polkadot adapter.
 */

import type { TypedPolkadotNetworkConfig } from '../types';
import { kusamaHub, polkadotHub } from './chains';

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
  rpcUrl: 'https://services.polkadothub-rpc.com',
  explorerUrl: 'https://blockscout.polkadot.io',
  apiUrl: 'https://blockscout.polkadot.io/api',
  supportsEtherscanV2: false,
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
 */
export const kusamaHubMainnet: TypedPolkadotNetworkConfig = {
  id: 'kusama-hub',
  name: 'Kusama Hub',
  exportConstName: 'kusamaHubMainnet',
  ecosystem: 'polkadot',
  network: 'kusama-hub',
  type: 'mainnet',
  isTestnet: false,
  chainId: 420420418,
  rpcUrl: 'https://kusama-asset-hub-eth-rpc.polkadot.io',
  explorerUrl: 'https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io',
  apiUrl: 'https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/api',
  supportsEtherscanV2: false,
  nativeCurrency: {
    name: 'Kusama',
    symbol: 'KSM',
    decimals: 18,
  },
  viemChain: kusamaHub,
  executionType: 'evm',
  networkCategory: 'hub',
  relayChain: 'kusama',
};

/**
 * All mainnet network configurations in priority order.
 * Hub networks first (P1), then parachains (P2) will be added later.
 */
export const mainnetNetworks = [polkadotHubMainnet, kusamaHubMainnet] as const;
