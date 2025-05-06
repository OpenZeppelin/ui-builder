import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

import { resolveRpcUrl } from '../rpc';

// Adjust path as needed

// Helper to create a mock EvmNetworkConfig
const createMockConfig = (id: string, rpcUrl?: string): EvmNetworkConfig => ({
  id,
  name: `Test ${id}`,
  ecosystem: 'evm',
  network: 'test-network',
  type: 'testnet',
  isTestnet: true,
  chainId: 1337,
  rpcUrl: rpcUrl || 'https://default-public.rpc.com', // Default public RPC for the mock
  nativeCurrency: { name: 'TETH', symbol: 'TETH', decimals: 18 },
  apiUrl: 'https://api.etherscan.io/api',
  icon: 'ethereum',
});

describe('resolveRpcUrl', () => {
  afterEach(() => {
    // Clean up any environment stubs after each test
    vi.unstubAllEnvs();
  });

  it('should use VITE_RPC_URL_<NETWORK_ID> if set', () => {
    const networkId = 'ethereum-mainnet';
    const envRpcUrl = 'https://env-override.rpc.com';
    vi.stubEnv(`VITE_RPC_URL_ETHEREUM_MAINNET`, envRpcUrl);

    const config = createMockConfig(networkId, 'https://config.rpc.com');
    expect(resolveRpcUrl(config)).toBe(envRpcUrl);
  });

  it('should correctly format NETWORK_ID with hyphens for env var lookup', () => {
    const networkId = 'some-test-network';
    const envRpcUrl = 'https://hyphen-test.rpc.com';
    vi.stubEnv(`VITE_RPC_URL_SOME_TEST_NETWORK`, envRpcUrl);

    const config = createMockConfig(networkId, 'https://config.rpc.com');
    expect(resolveRpcUrl(config)).toBe(envRpcUrl);
  });

  it('should use networkConfig.rpcUrl if no specific environment variable is set', () => {
    const networkId = 'ethereum-sepolia';
    const configRpcUrl = 'https://sepolia-public.rpc.com';
    const config = createMockConfig(networkId, configRpcUrl);

    // No need to delete, unstubAllEnvs handles cleanup
    expect(resolveRpcUrl(config)).toBe(configRpcUrl);
  });

  it('should throw an error if rpcUrl is missing in config and no env var is set', () => {
    const networkId = 'missing-rpc-config';
    // Create a config where rpcUrl is explicitly undefined, cast to bypass type check for test
    const config = {
      ...createMockConfig(networkId, 'http://dummy.com'), // provide a dummy for base object creation
      rpcUrl: undefined as unknown as string, // Then force undefined
    };

    expect(() => resolveRpcUrl(config)).toThrowError(
      `Could not resolve RPC URL for network: ${config.name}. Please ensure networkConfig.rpcUrl is set or provide the VITE_RPC_URL_MISSING_RPC_CONFIG environment variable.`
    );
  });

  it('should handle network IDs with different casings for env var lookup (e.g. all caps)', () => {
    const networkIdInConfig = 'allcapsnet-lower'; // e.g., from a file
    const networkIdForEnv = 'ALLCAPSNET_LOWER'; // The key format
    const envRpcUrl = 'https://allcaps.rpc.com';
    vi.stubEnv(`VITE_RPC_URL_${networkIdForEnv}`, envRpcUrl);

    // networkConfig.id is used to derive the env var key, so it should match the intended lookup pattern
    const config = createMockConfig(networkIdInConfig, 'https://config.rpc.com');
    expect(resolveRpcUrl(config)).toBe(envRpcUrl);
  });
});
