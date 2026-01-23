import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EvmNetworkConfig } from '@openzeppelin/ui-types';
import { appConfigService } from '@openzeppelin/ui-utils';

import { resolveRpcUrl } from '../rpc';

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
  const original = await importOriginal<typeof import('@openzeppelin/ui-utils')>();
  return {
    ...original,
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    appConfigService: {
      getRpcEndpointOverride: vi.fn(),
      getConfig: vi.fn().mockReturnValue({ rpcEndpoints: {} }),
    },
  };
});

describe('resolveRpcUrl', () => {
  beforeEach(() => {
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReset();
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
  });

  it('should throw an error if no valid RPC URL (override or default) is found', () => {
    const networkId = 'no-valid-rpc';
    vi.mocked(appConfigService.getRpcEndpointOverride).mockReturnValue(undefined);
    const config = createMockConfig(networkId, undefined);

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
});
