import { NetworkSolana } from '@web3icons/react';

import { SolanaNetworkConfig } from '@openzeppelin/ui-builder-types';

// Placeholder for Solana Mainnet Beta
export const solanaMainnetBeta: SolanaNetworkConfig = {
  id: 'solana-mainnet-beta',
  exportConstName: 'solanaMainnetBeta',
  name: 'Solana',
  ecosystem: 'solana',
  network: 'solana',
  type: 'mainnet',
  isTestnet: false,
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',
  explorerUrl: 'https://explorer.solana.com',
  iconComponent: NetworkSolana,
};

// Add other Solana mainnet networks if applicable
