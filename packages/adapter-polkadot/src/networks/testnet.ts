/**
 * @fileoverview Testnet network configurations for Polkadot adapter.
 */

import type { TypedPolkadotNetworkConfig } from '../types';
import { polkadotHubTestNet } from './chains';

/**
 * Polkadot Hub testnet configuration.
 * Chain ID: 420420417, Currency: PAS (Paseo), Explorer: Routescan
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
  apiUrl: 'https://polkadot.testnet.routescan.io/api',
  supportsEtherscanV2: false,
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

/**
 * All testnet network configurations in priority order.
 * Hub networks first (P1), then parachains (P2) will be added later.
 */
export const testnetNetworks = [polkadotHubTestnet] as const;
