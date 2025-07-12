import {
  baseSepolia as viemBaseSepolia,
  polygonAmoy as viemPolygonAmoy,
  sepolia as viemSepolia,
} from 'viem/chains';

import { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

export const ethereumSepolia: EvmNetworkConfig = {
  id: 'ethereum-sepolia',
  exportConstName: 'ethereumSepolia',
  name: 'Ethereum Sepolia',
  ecosystem: 'evm',
  network: 'ethereum',
  type: 'testnet',
  isTestnet: true,
  chainId: 11155111,
  rpcUrl: viemSepolia.rpcUrls.default.http[0],
  explorerUrl: 'https://sepolia.etherscan.io',
  apiUrl: 'https://api-sepolia.etherscan.io/api',
  primaryExplorerApiIdentifier: 'etherscan-sepolia',
  icon: 'ethereum',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  viemChain: viemSepolia,
};

export const polygonAmoy: EvmNetworkConfig = {
  id: 'polygon-amoy',
  exportConstName: 'polygonAmoy',
  name: 'Polygon Amoy',
  ecosystem: 'evm',
  network: 'polygon',
  type: 'testnet',
  isTestnet: true,
  chainId: 80002,
  rpcUrl: viemPolygonAmoy.rpcUrls.default.http[0],
  explorerUrl: 'https://amoy.polygonscan.com',
  apiUrl: 'https://api-amoy.polygonscan.com/api',
  primaryExplorerApiIdentifier: 'polygonscan-amoy',
  icon: 'polygon',
  nativeCurrency: {
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
  },
  viemChain: viemPolygonAmoy,
};

export const baseSepolia: EvmNetworkConfig = {
  id: 'base-sepolia',
  exportConstName: 'baseSepolia',
  name: 'Base Sepolia',
  ecosystem: 'evm',
  network: 'base',
  type: 'testnet',
  isTestnet: true,
  chainId: 84532,
  rpcUrl: viemBaseSepolia.rpcUrls.default.http[0],
  explorerUrl: 'https://sepolia.basescan.org',
  apiUrl: 'https://api-sepolia.basescan.org/api',
  primaryExplorerApiIdentifier: 'basescan-sepolia',
  icon: 'base',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  viemChain: viemBaseSepolia,
};

// TODO: Add other EVM testnet networks as needed (e.g., Arbitrum Sepolia)
