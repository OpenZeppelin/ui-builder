import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EvmNetworkConfig } from '@openzeppelin/ui-types';
import { appConfigService } from '@openzeppelin/ui-utils';

import { resolveRpcUrl } from '../rpc';

// Adjust path as needed

// Helper to create a mock EvmNetworkConfig
const createMockConfig = (id: string, rpcUrl?: string, name?: string): EvmNetworkConfig => ({
  id,
  name: name || `Test ${id}`,
  ecosystem: 'evm',
  network: 'test-network',
  type: 'testnet',
  isTestnet: true,
  exportConstName: id.replace(/-/g, ''),
  chainId: 12345, // Arbitrary chainId for testing
  rpcUrl: rpcUrl || '', // Allow undefined or empty for testing error cases
  nativeCurrency: { name: 'TestETH', symbol: 'TETH', decimals: 18 },
  primaryExplorerApiIdentifier: `${id}-explorer`,
  apiUrl: `https://api.${id}.com`,
});

// Mock the appConfigService from the correct package
vi.mock('@openzeppelin/ui-utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@openzeppelin/ui-utils')>(); // Ensure correct type for original
  return {
    ...original,
    logger: {
      // Provide mock implementations for all logger methods used or default them
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      // Add other methods if your code uses them, or a more generic mock
    },
    appConfigService: {
      getRpcEndpointOverride: vi.fn(),
      // Mock other methods of appConfigService if they were to be called by resolveRpcUrl or its dependencies
      // For resolveRpcUrl, only getRpcEndpointOverride is directly relevant.
      getConfig: vi.fn().mockReturnValue({ rpcEndpoints: {} }), // Provide a minimal getConfig mock
    },
  };
});

describe('resolveRpcUrl', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure test isolation
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReset();
    // Reset getConfig mock if it needs to change per test, or set a default good enough for all
    vi.mocked(appConfigService.getConfig).mockReturnValue({ rpcEndpoints: {} });
  });

  it('should use RPC override from AppConfigService if available (string)', () => {
    const networkId = 'mainnet-test-override';
    const overrideRpcUrl = 'https://appconfig-override.rpc.com';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(overrideRpcUrl);

    const config = createMockConfig(networkId, 'https://default.rpc.com');
    expect(resolveRpcUrl(config)).toBe(overrideRpcUrl);
  });

  it('should use RPC override from AppConfigService if available (object with http)', () => {
    const networkId = 'mainnet-test-object-override';
    const overrideRpcUrl = 'https://appconfig-object.rpc.com';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue({ http: overrideRpcUrl });

    const config = createMockConfig(networkId, 'https://default.rpc.com');
    expect(resolveRpcUrl(config)).toBe(overrideRpcUrl);
  });

  it('should fall back to networkConfig.rpcUrl if no override is available', () => {
    const networkId = 'mainnet-test-fallback';
    const defaultRpcUrl = 'https://default-from-config.rpc.com';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(undefined);

    const config = createMockConfig(networkId, defaultRpcUrl);
    expect(resolveRpcUrl(config)).toBe(defaultRpcUrl);
  });

  it('should fall back to networkConfig.rpcUrl if override is invalid URL', () => {
    const networkId = 'mainnet-test-invalid-override';
    const defaultRpcUrl = 'https://default-valid.rpc.com';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue('invalid-url');

    const config = createMockConfig(networkId, defaultRpcUrl);
    expect(resolveRpcUrl(config)).toBe(defaultRpcUrl);
    // Optionally, check if logger.warn was called (requires logger mock setup)
  });

  it('should throw an error if no valid RPC URL (override or default) is found', () => {
    const networkId = 'no-valid-rpc';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(undefined);
    const config = createMockConfig(networkId, undefined); // No default RPC

    expect(() => resolveRpcUrl(config)).toThrowError(
      `No valid RPC URL configured for network Test ${networkId} (ID: ${networkId}).`
    );
  });

  it('should throw an error if default RPC is invalid and no override is found', () => {
    const networkId = 'invalid-default-rpc';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(undefined);
    const config = createMockConfig(networkId, 'not-a-url');

    expect(() => resolveRpcUrl(config)).toThrowError(
      `No valid RPC URL configured for network Test ${networkId} (ID: ${networkId}).`
    );
  });

  it('should use override even if default is invalid', () => {
    const networkId = 'override-wins-over-invalid-default';
    const overrideRpcUrl = 'https://good-override.rpc.com';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(overrideRpcUrl);

    const config = createMockConfig(networkId, 'bad-default-url');
    expect(resolveRpcUrl(config)).toBe(overrideRpcUrl);
  });

  // The following tests are no longer valid as resolveRpcUrl does not directly access env vars.
  // Environment variable overrides are handled by AppConfigService.
  /*
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
  */
});
