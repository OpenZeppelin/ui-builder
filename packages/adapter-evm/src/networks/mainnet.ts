import {
  arbitrum as viemArbitrum,
  avalanche as viemAvalanche,
  base as viemBase,
  bsc as viemBsc,
  mainnet as viemMainnet,
  optimism as viemOptimism,
  polygon as viemPolygon,
  polygonZkEvm as viemPolygonZkEvm,
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
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  viemChain: viemPolygon,
};

export const polygonZkEvmMainnet: EvmNetworkConfig = {
  id: 'polygon-zkevm-mainnet',
  exportConstName: 'polygonZkEvmMainnet',
  name: 'Polygon zkEVM',
  ecosystem: 'evm',
  network: 'polygon-zkevm',
  type: 'mainnet',
  isTestnet: false,
  chainId: 1101,
  rpcUrl: viemPolygonZkEvm.rpcUrls.default.http[0],
  explorerUrl: 'https://zkevm.polygonscan.com',
  apiUrl: 'https://api-zkevm.polygonscan.com/api',
  primaryExplorerApiIdentifier: 'polygonscan-zkevm',
  icon: 'polygon',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  viemChain: viemPolygonZkEvm,
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

export const bscMainnet: EvmNetworkConfig = {
  id: 'bsc-mainnet',
  exportConstName: 'bscMainnet',
  name: 'BNB Smart Chain',
  ecosystem: 'evm',
  network: 'bsc',
  type: 'mainnet',
  isTestnet: false,
  chainId: 56,
  rpcUrl: viemBsc.rpcUrls.default.http[0],
  explorerUrl: 'https://bscscan.com',
  apiUrl: 'https://api.bscscan.com/api',
  primaryExplorerApiIdentifier: 'bscscan-mainnet',
  icon: 'bsc',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  viemChain: viemBsc,
};

export const optimismMainnet: EvmNetworkConfig = {
  id: 'optimism-mainnet',
  exportConstName: 'optimismMainnet',
  name: 'OP Mainnet',
  ecosystem: 'evm',
  network: 'optimism',
  type: 'mainnet',
  isTestnet: false,
  chainId: 10,
  rpcUrl: viemOptimism.rpcUrls.default.http[0],
  explorerUrl: 'https://optimistic.etherscan.io',
  apiUrl: 'https://api-optimistic.etherscan.io/api',
  primaryExplorerApiIdentifier: 'optimistic-etherscan-mainnet',
  icon: 'optimism',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  viemChain: viemOptimism,
};

export const avalancheMainnet: EvmNetworkConfig = {
  id: 'avalanche-mainnet',
  exportConstName: 'avalancheMainnet',
  name: 'Avalanche C-Chain',
  ecosystem: 'evm',
  network: 'avalanche',
  type: 'mainnet',
  isTestnet: false,
  chainId: 43114,
  rpcUrl: viemAvalanche.rpcUrls.default.http[0],
  explorerUrl: 'https://subnets.avax.network/c-chain',
  apiUrl: 'https://api.avascan.info/v2',
  primaryExplorerApiIdentifier: 'avascan-mainnet',
  icon: 'avalanche',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  viemChain: viemAvalanche,
};

// TODO: Add other EVM mainnet networks with their public RPCs and viemChain objects
