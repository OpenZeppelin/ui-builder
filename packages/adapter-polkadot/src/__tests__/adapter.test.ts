import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NetworkConfig } from '@openzeppelin/ui-types';

import { PolkadotAdapter } from '../adapter';
// Import after mock setup
import * as evmHandler from '../handlers/evm-handler';
import type { TypedPolkadotNetworkConfig } from '../types';

// Mock the EVM handler module
vi.mock('../handlers/evm-handler', () => ({
  loadContract: vi.fn(),
  mapParameterTypeToFieldType: vi.fn(),
  getCompatibleFieldTypes: vi.fn(),
  generateDefaultField: vi.fn(),
  parseInput: vi.fn(),
  formatFunctionResult: vi.fn(),
  isViewFunction: vi.fn(),
  queryViewFunction: vi.fn(),
  isValidAddress: vi.fn(),
}));

const mockPolkadotHubConfig: TypedPolkadotNetworkConfig = {
  id: 'polkadot-hub',
  name: 'Polkadot Hub',
  exportConstName: 'polkadotHub',
  ecosystem: 'polkadot',
  network: 'polkadot-hub',
  type: 'mainnet',
  isTestnet: false,
  chainId: 420420419,
  rpcUrl: 'https://services.polkadothub-rpc.com',
  explorerUrl: 'https://blockscout.polkadot.io',
  apiUrl: 'https://blockscout.polkadot.io/api',
  supportsEtherscanV2: false,
  nativeCurrency: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 18,
  },
  executionType: 'evm',
  networkCategory: 'hub',
  relayChain: 'polkadot',
};

const mockMoonbeamConfig: TypedPolkadotNetworkConfig = {
  id: 'moonbeam',
  name: 'Moonbeam',
  exportConstName: 'moonbeamMainnet',
  ecosystem: 'polkadot',
  network: 'moonbeam',
  type: 'mainnet',
  isTestnet: false,
  chainId: 1284,
  rpcUrl: 'https://rpc.api.moonbeam.network',
  explorerUrl: 'https://moonbeam.moonscan.io',
  apiUrl: 'https://api.etherscan.io/v2/api',
  supportsEtherscanV2: true,
  nativeCurrency: {
    name: 'Glimmer',
    symbol: 'GLMR',
    decimals: 18,
  },
  executionType: 'evm',
  networkCategory: 'parachain',
  relayChain: 'polkadot',
};

describe('PolkadotAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create adapter with valid Polkadot network config', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      expect(adapter).toBeDefined();
      expect(adapter.networkConfig).toEqual(mockPolkadotHubConfig);
    });

    it('should throw error for non-Polkadot ecosystem', () => {
      const invalidConfig = {
        ...mockPolkadotHubConfig,
        ecosystem: 'ethereum' as const,
      };
      expect(() => new PolkadotAdapter(invalidConfig as unknown as NetworkConfig)).toThrow(
        'PolkadotAdapter requires a Polkadot network config'
      );
    });
  });

  describe('networkConfig', () => {
    it('should expose the network configuration', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      const config = adapter.networkConfig as unknown as TypedPolkadotNetworkConfig;
      expect(config.id).toBe('polkadot-hub');
      expect(config.chainId).toBe(420420419);
    });
  });

  describe('getSupportedContractDefinitionProviders', () => {
    it('should return Blockscout for Hub networks', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      const providers = adapter.getSupportedContractDefinitionProviders();
      expect(providers).toContainEqual({ key: 'etherscan', label: 'Blockscout' });
      expect(providers).toContainEqual({ key: 'sourcify', label: 'Sourcify' });
      expect(providers).toContainEqual({ key: 'manual', label: 'Manual' });
    });

    it('should return Moonscan for parachain networks', () => {
      const adapter = new PolkadotAdapter(mockMoonbeamConfig as unknown as NetworkConfig);
      const providers = adapter.getSupportedContractDefinitionProviders();
      expect(providers).toContainEqual({ key: 'etherscan', label: 'Moonscan' });
    });
  });

  describe('EVM handler delegation', () => {
    it('should delegate loadContract to EVM handler', async () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      const mockSchema = { name: 'TestContract', functions: [] };
      vi.mocked(evmHandler.loadContract).mockResolvedValue(mockSchema as never);

      const result = await adapter.loadContract('0x1234567890123456789012345678901234567890');

      expect(evmHandler.loadContract).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        mockPolkadotHubConfig,
        undefined
      );
      expect(result).toEqual(mockSchema);
    });

    it('should delegate mapParameterTypeToFieldType to EVM handler', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      vi.mocked(evmHandler.mapParameterTypeToFieldType).mockReturnValue('number');

      const result = adapter.mapParameterTypeToFieldType('uint256');

      expect(evmHandler.mapParameterTypeToFieldType).toHaveBeenCalledWith('uint256');
      expect(result).toBe('number');
    });

    it('should delegate getCompatibleFieldTypes to EVM handler', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      vi.mocked(evmHandler.getCompatibleFieldTypes).mockReturnValue(['number', 'text']);

      const result = adapter.getCompatibleFieldTypes('uint256');

      expect(evmHandler.getCompatibleFieldTypes).toHaveBeenCalledWith('uint256');
      expect(result).toEqual(['number', 'text']);
    });

    it('should delegate isValidAddress to EVM handler', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      vi.mocked(evmHandler.isValidAddress).mockReturnValue(true);

      const result = adapter.isValidAddress('0x1234567890123456789012345678901234567890');

      expect(evmHandler.isValidAddress).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890'
      );
      expect(result).toBe(true);
    });

    it('should delegate isViewFunction to EVM handler', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      vi.mocked(evmHandler.isViewFunction).mockReturnValue(true);

      const mockFunction = { stateMutability: 'view' };
      const result = adapter.isViewFunction(mockFunction as never);

      expect(evmHandler.isViewFunction).toHaveBeenCalledWith(mockFunction);
      expect(result).toBe(true);
    });
  });

  describe('execution type validation', () => {
    it('should throw for non-EVM execution type on loadContract', async () => {
      const substrateConfig: TypedPolkadotNetworkConfig = {
        ...mockPolkadotHubConfig,
        executionType: 'substrate',
      };
      const adapter = new PolkadotAdapter(substrateConfig as unknown as NetworkConfig);

      await expect(
        adapter.loadContract('0x1234567890123456789012345678901234567890')
      ).rejects.toThrow('Operation not supported for execution type: substrate');
    });

    it('should throw for non-EVM execution type on mapParameterTypeToFieldType', () => {
      const substrateConfig: TypedPolkadotNetworkConfig = {
        ...mockPolkadotHubConfig,
        executionType: 'substrate',
      };
      const adapter = new PolkadotAdapter(substrateConfig as unknown as NetworkConfig);

      expect(() => adapter.mapParameterTypeToFieldType('uint256')).toThrow(
        'Operation not supported for execution type: substrate'
      );
    });
  });
});
