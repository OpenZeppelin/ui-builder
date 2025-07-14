import { StellarNetworkConfig } from '@openzeppelin/contracts-ui-builder-types';

// Placeholder for Stellar Public Network (Mainnet)
export const stellarPublic: StellarNetworkConfig = {
  id: 'stellar-public',
  exportConstName: 'stellarPublic',
  name: 'Stellar',
  ecosystem: 'stellar',
  network: 'stellar',
  type: 'mainnet',
  isTestnet: false,
  horizonUrl: 'https://horizon.stellar.org',
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  explorerUrl: 'https://stellar.expert/explorer/public',
  icon: 'stellar',
};
