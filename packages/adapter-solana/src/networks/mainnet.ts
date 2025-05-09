import { SolanaNetworkConfig } from '@openzeppelin/transaction-form-types';

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
  icon: 'solana',
};

// Add other Solana mainnet networks if applicable
