import {
  arbitrum as viemArbitrum,
  base as viemBase,
  mainnet as viemMainnet,
  polygon as viemPolygon,
} from 'viem/chains';

import { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

export const ethereumMainnet: EvmNetworkConfig = {
  id: 'ethereum-mainnet',
  exportConstName: 'ethereumMainnet',
  name: 'Ethereum',
  ecosystem: 'evm',
  network: 'ethereum',
  type: 'mainnet',
  isTestnet: false,
  chainId: 1,
  rpcUrl: viemMainnet.rpcUrls.default.http[0],
  explorerUrl: 'https://etherscan.io',
  apiUrl: 'https://api.etherscan.io/api',
  primaryExplorerApiIdentifier: 'etherscan-mainnet',
  icon: 'ethereum',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  viemChain: viemMainnet,
};

export const polygonMainnet: EvmNetworkConfig = {
  id: 'polygon-mainnet',
  exportConstName: 'polygonMainnet',
  name: 'Polygon',
  ecosystem: 'evm',
  network: 'polygon',
  type: 'mainnet',
  isTestnet: false,
  chainId: 137,
  rpcUrl: viemPolygon.rpcUrls.default.http[0],
  explorerUrl: 'https://polygonscan.com',
  apiUrl: 'https://api.polygonscan.com/api',
  primaryExplorerApiIdentifier: 'polygonscan-mainnet',
  icon: 'polygon',
  nativeCurrency: {
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
  },
  viemChain: viemPolygon,
};

export const baseMainnet: EvmNetworkConfig = {
  id: 'base-mainnet',
  exportConstName: 'baseMainnet',
  name: 'Base',
  ecosystem: 'evm',
  network: 'base',
  type: 'mainnet',
  isTestnet: false,
  chainId: 8453,
  rpcUrl: viemBase.rpcUrls.default.http[0],
  explorerUrl: 'https://basescan.org',
  apiUrl: 'https://api.basescan.org/api',
  primaryExplorerApiIdentifier: 'basescan-mainnet',
  icon: 'base',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  viemChain: viemBase,
};

export const arbitrumMainnet: EvmNetworkConfig = {
  id: 'arbitrum-mainnet',
  exportConstName: 'arbitrumMainnet',
  name: 'Arbitrum One',
  ecosystem: 'evm',
  network: 'arbitrum',
  type: 'mainnet',
  isTestnet: false,
  chainId: 42161,
  rpcUrl: viemArbitrum.rpcUrls.default.http[0],
  explorerUrl: 'https://arbiscan.io',
  apiUrl: 'https://api.arbiscan.io/api',
  primaryExplorerApiIdentifier: 'arbiscan-mainnet',
  icon: 'arbitrum',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  viemChain: viemArbitrum,
};

// TODO: Add other EVM mainnet networks with their public RPCs and viemChain objects
