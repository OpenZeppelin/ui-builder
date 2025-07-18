import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TypedEvmNetworkConfig } from '../../types';
import { shouldUseV2Api, testEtherscanV2Connection } from '../etherscan-v2';

// Mock the dependencies
vi.mock('../../configuration/explorer', () => ({
  resolveExplorerConfig: vi.fn(),
}));

vi.mock('@openzeppelin/contracts-ui-builder-utils', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Etherscan V2 API', () => {
  const mockNetworkConfig: TypedEvmNetworkConfig = {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    ecosystem: 'evm',
    network: 'ethereum',
    type: 'mainnet',
    isTestnet: false,
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/test',
    explorerUrl: 'https://etherscan.io',
    supportsEtherscanV2: true,
    exportConstName: 'ethereumMainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('shouldUseV2Api', () => {
    it('should return true if network supports V2 and no user config', () => {
      expect(shouldUseV2Api(mockNetworkConfig)).toBe(true);
    });

    it('should return true for networks that support V2 API', () => {
      expect(shouldUseV2Api(mockNetworkConfig)).toBe(true);
    });

    it('should return false for networks without V2 support even with user preference', () => {
      const networkWithoutV2 = { ...mockNetworkConfig, supportsEtherscanV2: false };
      expect(shouldUseV2Api(networkWithoutV2)).toBe(false);
    });
  });

  describe('testEtherscanV2Connection', () => {
    it('should allow testing connection without API key when network does not require it', async () => {
      const networkWithoutKeyRequired: TypedEvmNetworkConfig = {
        ...mockNetworkConfig,
        requiresExplorerApiKey: false,
      };

      const mockResponse = {
        status: '1',
        result: '0x1234567',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await testEtherscanV2Connection(networkWithoutKeyRequired);

      expect(result.success).toBe(true);
      expect(result.latency).toBeDefined();
      expect(result.error).toBeUndefined();

      // Verify API call was made without API key
      const fetchCall = vi.mocked(global.fetch).mock.calls[0][0] as string;
      expect(fetchCall).not.toContain('apikey=');
    });

    it('should require API key for testing when network requires it', async () => {
      const result = await testEtherscanV2Connection(mockNetworkConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is required for testing connection to this explorer');
    });

    it('should test with API key when provided', async () => {
      const mockResponse = {
        status: '1',
        result: '0x1234567',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await testEtherscanV2Connection(mockNetworkConfig, 'test-api-key');

      expect(result.success).toBe(true);
      expect(result.latency).toBeDefined();

      // Verify API call was made with API key
      const fetchCall = vi.mocked(global.fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain('apikey=test-api-key');
    });
  });
});
