import { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

export const ethereumMainnet: EvmNetworkConfig = {
  id: 'ethereum-mainnet',
  name: 'Ethereum Mainnet',
  ecosystem: 'evm',
  network: 'ethereum',
  type: 'mainnet',
  isTestnet: false,
  chainId: 1,
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Replace with actual or ENV variable
  explorerUrl: 'https://etherscan.io',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const polygonMainnet: EvmNetworkConfig = {
  id: 'polygon-mainnet',
  name: 'Polygon Mainnet',
  ecosystem: 'evm',
  network: 'polygon',
  type: 'mainnet',
  isTestnet: false,
  chainId: 137,
  rpcUrl: 'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Replace with actual or ENV variable
  explorerUrl: 'https://polygonscan.com',
  nativeCurrency: {
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
  },
};

// TODO: Add other EVM mainnet networks as needed (e.g., Arbitrum, Optimism)
