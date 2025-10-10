import { NetworkStellar } from '@web3icons/react';

import { StellarNetworkConfig } from '@openzeppelin/ui-builder-types';

// Stellar Public Network (Mainnet)
export const stellarPublic: StellarNetworkConfig = {
  id: 'stellar-public',
  exportConstName: 'stellarPublic',
  name: 'Stellar',
  ecosystem: 'stellar',
  network: 'stellar',
  type: 'mainnet',
  isTestnet: false,
  horizonUrl: 'https://horizon.stellar.org',
  sorobanRpcUrl: 'https://mainnet.sorobanrpc.com',
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  explorerUrl: 'https://stellar.expert/explorer/public',
  iconComponent: NetworkStellar,
};
