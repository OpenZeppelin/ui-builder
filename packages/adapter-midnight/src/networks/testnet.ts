import type { MidnightNetworkConfig } from '@openzeppelin/ui-builder-types';

export const midnightTestnet: MidnightNetworkConfig = {
  id: 'midnight-testnet',
  exportConstName: 'midnightTestnet',
  name: 'Midnight Testnet',
  ecosystem: 'midnight',
  network: 'midnight-testnet',
  type: 'testnet',
  isTestnet: true,
  networkId: { 2: 'TestNet' },
  // Midnight Testnet RPC endpoints
  rpcEndpoints: {
    default: 'https://rpc.testnet-02.midnight.network',
  },
  // Indexer endpoints (used by the query provider)
  indexerUri: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
  indexerWsUri: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
  // TODO: Add explorer URL when available
  // explorerUrl: '...',
};

// Has been deprecated in favor of midnightTestnet
// export const midnightDevnet: MidnightNetworkConfig = {
//   id: 'midnight-devnet',
//   exportConstName: 'midnightDevnet',
//   name: 'Midnight Devnet',
//   ecosystem: 'midnight',
//   network: 'midnight-devnet',
//   type: 'devnet',
//   isTestnet: true,
//   // Add Midnight-specific fields here when known
//   // explorerUrl: '...',
// };
