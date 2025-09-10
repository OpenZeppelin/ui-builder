import { StellarNetworkConfig } from '@openzeppelin/contracts-ui-builder-types';

// Stellar Testnet
export const stellarTestnet: StellarNetworkConfig = {
  id: 'stellar-testnet',
  exportConstName: 'stellarTestnet',
  name: 'Stellar Testnet',
  ecosystem: 'stellar',
  network: 'stellar',
  type: 'testnet',
  isTestnet: true,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  explorerUrl: 'https://stellar.expert/explorer/testnet',
  icon: 'stellar',
};
