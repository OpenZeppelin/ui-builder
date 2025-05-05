import { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

export const ethereumSepolia: EvmNetworkConfig = {
  id: 'ethereum-sepolia',
  name: 'Ethereum Sepolia (Testnet)',
  ecosystem: 'evm',
  network: 'ethereum',
  type: 'testnet',
  isTestnet: true,
  chainId: 11155111,
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Replace with actual or ENV variable
  explorerUrl: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const polygonAmoy: EvmNetworkConfig = {
  id: 'polygon-amoy',
  name: 'Polygon Amoy (Testnet)',
  ecosystem: 'evm',
  network: 'polygon',
  type: 'testnet',
  isTestnet: true,
  chainId: 80002,
  rpcUrl: 'https://polygon-amoy.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Replace with actual or ENV variable
  explorerUrl: 'https://www.oklink.com/amoy', // Amoy explorer
  nativeCurrency: {
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
  },
};

// TODO: Add other EVM testnet networks as needed (e.g., Arbitrum Sepolia)
