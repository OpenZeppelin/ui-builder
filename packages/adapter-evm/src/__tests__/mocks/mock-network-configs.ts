import type { TypedEvmNetworkConfig } from '@openzeppelin/ui-builder-adapter-evm-core';

/**
 * Mock EVM Network Configuration for testing purposes.
 */
export const mockEvmNetworkConfig: TypedEvmNetworkConfig = {
  id: 'test-evm-mocknet',
  exportConstName: 'mockEvmNetworkConfig',
  name: 'Test EVM Mocknet',
  ecosystem: 'evm',
  network: 'ethereum', // Can be any mock string
  type: 'testnet',
  isTestnet: true,
  chainId: 1337, // Common local testnet chain ID
  rpcUrl: 'http://localhost:8545', // Mock RPC URL
  nativeCurrency: { name: 'TestETH', symbol: 'TETH', decimals: 18 },
  apiUrl: 'https://api.etherscan.io/api', // Mock API URL
  viemChain: undefined, // Optional viem Chain object
};

// Add mocks for other ecosystems here if needed later
// export const mockSolanaNetworkConfig: SolanaNetworkConfig = { ... };
