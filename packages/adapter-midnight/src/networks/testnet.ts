import { MidnightNetworkConfig } from '@openzeppelin/ui-builder-types';

export const midnightTestnet: MidnightNetworkConfig = {
  id: 'midnight-testnet',
  exportConstName: 'midnightTestnet',
  name: 'Midnight Testnet',
  ecosystem: 'midnight',
  network: 'midnight-testnet',
  type: 'testnet',
  isTestnet: true,
  // Add Midnight-specific fields here when known
  // explorerUrl: '...',
  // apiUrl: '...',
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
