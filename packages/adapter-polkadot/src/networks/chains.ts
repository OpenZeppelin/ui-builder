/**
 * @fileoverview Custom viem chain definitions for Polkadot Hub networks.
 *
 * These chains are not yet available in viem/chains and need custom definitions.
 * The configuration format is compatible with both Wagmi v2 and v3.
 *
 * @see https://docs.polkadot.com/smart-contracts/libraries/wagmi/
 */

import { defineChain } from 'viem';

/**
 * Polkadot Hub mainnet chain definition.
 * Chain ID: 420420419
 */
export const polkadotHub = defineChain({
  id: 420420419,
  name: 'Polkadot Hub',
  nativeCurrency: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://services.polkadothub-rpc.com/mainnet'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout.polkadot.io',
    },
  },
});

/**
 * Kusama Hub mainnet chain definition.
 * Chain ID: 420420418
 *
 * NOTE: Temporarily disabled - The official RPC endpoint DNS
 * (kusama-asset-hub-eth-rpc.polkadot.io) does not resolve as of Jan 2026.
 * Re-enable once the Kusama Hub EVM RPC service is publicly available.
 * @see https://kusama.network/smart-contracts for updates
 */
// export const kusamaHub = defineChain({
//   id: 420420418,
//   name: 'Kusama Hub',
//   nativeCurrency: {
//     name: 'Kusama',
//     symbol: 'KSM',
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: {
//       http: ['https://kusama-asset-hub-eth-rpc.polkadot.io'],
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: 'Blockscout',
//       url: 'https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io',
//     },
//   },
// });

/**
 * Polkadot Hub TestNet chain definition.
 * Chain ID: 420420417
 *
 * Per official Polkadot documentation:
 * @see https://docs.polkadot.com/smart-contracts/libraries/wagmi/
 */
export const polkadotHubTestNet = defineChain({
  id: 420420417,
  name: 'Polkadot Hub TestNet',
  nativeCurrency: {
    name: 'Paseo',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://services.polkadothub-rpc.com/testnet'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Routescan',
      url: 'https://polkadot.testnet.routescan.io',
    },
  },
  testnet: true,
});
