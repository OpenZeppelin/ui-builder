import { mainnet as viemMainnet, polygon as viemPolygon } from 'viem/chains';

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
  rpcUrl: 'https://eth.llamarpc.com', // Public RPC for Ethereum Mainnet
  explorerUrl: 'https://etherscan.io',
  apiUrl: 'https://api.etherscan.io/api',
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
  rpcUrl: 'https://polygon-rpc.com', // Public RPC for Polygon Mainnet
  explorerUrl: 'https://polygonscan.com',
  apiUrl: 'https://api.polygonscan.com/api',
  icon: 'polygon',
  nativeCurrency: {
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
  },
  viemChain: viemPolygon,
};

// TODO: Add other EVM mainnet networks with their public RPCs and viemChain objects
