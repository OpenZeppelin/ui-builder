import { polygonAmoy as viemPolygonAmoy, sepolia as viemSepolia } from 'viem/chains';

import { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

export const ethereumSepolia = {
  id: 'ethereum-sepolia',
  name: 'Ethereum Sepolia',
  ecosystem: 'evm',
  network: 'ethereum',
  type: 'testnet',
  isTestnet: true,
  chainId: 11155111,
  rpcUrl: 'https://ethereum-sepolia.rpc.subquery.network/public', // Public RPC for Sepolia
  explorerUrl: 'https://sepolia.etherscan.io',
  apiUrl: 'https://api-sepolia.etherscan.io/api',
  icon: 'ethereum',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  viemChain: viemSepolia,
} as EvmNetworkConfig;

export const polygonAmoy = {
  id: 'polygon-amoy',
  name: 'Polygon Amoy',
  ecosystem: 'evm',
  network: 'polygon',
  type: 'testnet',
  isTestnet: true,
  chainId: 80002,
  rpcUrl: 'https://rpc-amoy.polygon.technology', // Public RPC for Polygon Amoy
  explorerUrl: 'https://www.oklink.com/amoy', // Amoy explorer
  apiUrl: 'https://api-amoy.polygonscan.com/api',
  icon: 'polygon',
  nativeCurrency: {
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
  },
  viemChain: viemPolygonAmoy,
} as EvmNetworkConfig;

// TODO: Add other EVM testnet networks as needed (e.g., Arbitrum Sepolia)
