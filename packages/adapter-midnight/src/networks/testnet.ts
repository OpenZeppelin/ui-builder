import { MidnightNetworkConfig } from '@openzeppelin/transaction-form-types';

// Placeholder for Midnight Devnet (or Testnet)
export const midnightDevnet: MidnightNetworkConfig = {
  id: 'midnight-devnet',
  exportConstName: 'midnightDevnet',
  name: 'Midnight Devnet (Placeholder)',
  ecosystem: 'midnight',
  network: 'midnight',
  type: 'devnet', // Assuming 'devnet' initially
  isTestnet: true,
  // Add Midnight-specific fields here when known
  // explorerUrl: '...',
};

// Placeholder for a potential Midnight Testnet
export const midnightTestnet: MidnightNetworkConfig = {
  id: 'midnight-testnet',
  exportConstName: 'midnightTestnet',
  name: 'Midnight Testnet (Placeholder)',
  ecosystem: 'midnight',
  network: 'midnight',
  type: 'testnet',
  isTestnet: true,
  // Add Midnight-specific fields here when known
  // explorerUrl: '...',
  // apiUrl: '...',
};
