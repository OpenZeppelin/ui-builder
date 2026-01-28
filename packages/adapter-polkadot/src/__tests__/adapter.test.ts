import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NetworkConfig } from '@openzeppelin/ui-types';

import { PolkadotAdapter } from '../adapter';
// Import evm module for mocking
import * as evmModule from '../evm';
import type { TypedPolkadotNetworkConfig } from '../types';
// Import wallet exports to verify they're available
import { polkadotChains, PolkadotWalletUiRoot } from '../wallet';

// Mock the EVM module
vi.mock('../evm', () => ({
  loadContract: vi.fn(),
  loadContractWithMetadata: vi.fn(),
  compareContractDefinitions: vi.fn(),
  validateContractDefinition: vi.fn(),
  hashContractDefinition: vi.fn(),
  getSupportedExecutionMethods: vi.fn(),
  validateExecutionConfig: vi.fn(),
  getNetworkServiceForms: vi.fn(),
  validateNetworkServiceConfig: vi.fn(),
  testNetworkServiceConnection: vi.fn(),
  getEvmCurrentBlock: vi.fn(),
  getEvmExplorerAddressUrl: vi.fn(),
  getEvmExplorerTxUrl: vi.fn(),
  mapEvmParamTypeToFieldType: vi.fn(),
  getEvmCompatibleFieldTypes: vi.fn(),
  generateEvmDefaultField: vi.fn(),
  getEvmTypeMappingInfo: vi.fn(),
  isViewFunction: vi.fn(),
  queryViewFunction: vi.fn(),
  formatEvmTransactionData: vi.fn(),
  signAndBroadcast: vi.fn(),
  waitForTransactionConfirmation: vi.fn(),
  getRelayers: vi.fn(),
  getRelayer: vi.fn(),
  formatEvmFunctionResult: vi.fn(),
  getAvailableUiKits: vi.fn(),
  getContractDefinitionInputs: vi.fn(),
  getUiLabels: vi.fn(),
  getWritableFunctions: vi.fn(),
  filterAutoQueryableFunctions: vi.fn(),
  supportsWalletConnection: vi.fn(),
  getRelayerOptionsComponent: vi.fn(),
  isValidEvmAddress: vi.fn(),
  validateRpcEndpoint: vi.fn(),
  testRpcConnection: vi.fn(),
  validateExplorerConfig: vi.fn(),
  testExplorerConnection: vi.fn(),
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

  describe('EVM module delegation', () => {
    it('should delegate loadContract to EVM module', async () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      const mockSchema = { name: 'TestContract', functions: [] };
      vi.mocked(evmModule.loadContract).mockResolvedValue(mockSchema as never);

      const result = await adapter.loadContract('0x1234567890123456789012345678901234567890');

      expect(evmModule.loadContract).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        mockPolkadotHubConfig,
        undefined
      );
      expect(result).toEqual(mockSchema);
    });

    it('should delegate mapParameterTypeToFieldType to EVM module', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      vi.mocked(evmModule.mapEvmParamTypeToFieldType).mockReturnValue('number');

      const result = adapter.mapParameterTypeToFieldType('uint256');

      expect(evmModule.mapEvmParamTypeToFieldType).toHaveBeenCalledWith('uint256');
      expect(result).toBe('number');
    });

    it('should delegate getCompatibleFieldTypes to EVM module', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      vi.mocked(evmModule.getEvmCompatibleFieldTypes).mockReturnValue(['number', 'text']);

      const result = adapter.getCompatibleFieldTypes('uint256');

      expect(evmModule.getEvmCompatibleFieldTypes).toHaveBeenCalledWith('uint256');
      expect(result).toEqual(['number', 'text']);
    });

    it('should delegate isValidAddress to EVM module', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      vi.mocked(evmModule.isValidEvmAddress).mockReturnValue(true);

      const result = adapter.isValidAddress('0x1234567890123456789012345678901234567890');

      expect(evmModule.isValidEvmAddress).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890'
      );
      expect(result).toBe(true);
    });

    it('should delegate isViewFunction to EVM module', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      vi.mocked(evmModule.isViewFunction).mockReturnValue(true);

      const mockFunction = { stateMutability: 'view' };
      const result = adapter.isViewFunction(mockFunction as never);

      expect(evmModule.isViewFunction).toHaveBeenCalledWith(mockFunction);
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

describe('Module Exports', () => {
  describe('PolkadotAdapter export', () => {
    it('should export PolkadotAdapter class', () => {
      expect(PolkadotAdapter).toBeDefined();
      expect(typeof PolkadotAdapter).toBe('function');
    });

    it('should be instantiable with valid config', () => {
      const adapter = new PolkadotAdapter(mockPolkadotHubConfig as unknown as NetworkConfig);
      expect(adapter).toBeInstanceOf(PolkadotAdapter);
    });
  });

  describe('Wallet component exports', () => {
    it('should export PolkadotWalletUiRoot component', () => {
      expect(PolkadotWalletUiRoot).toBeDefined();
      expect(typeof PolkadotWalletUiRoot).toBe('function');
    });

    it('should export polkadotChains array', () => {
      expect(polkadotChains).toBeDefined();
      expect(Array.isArray(polkadotChains)).toBe(true);
      expect(polkadotChains.length).toBeGreaterThan(0);
    });

    it('should include all Polkadot ecosystem chains', () => {
      // Verify Hub chains are present
      const chainIds = polkadotChains.map((c) => c.id);
      expect(chainIds).toContain(420420419); // polkadotHub
      // expect(chainIds).toContain(420420418); // kusamaHub - Temporarily disabled, RPC DNS not resolving
      expect(chainIds).toContain(420420417); // polkadotHubTestNet

      // Verify Parachain chains are present
      expect(chainIds).toContain(1284); // moonbeam
      expect(chainIds).toContain(1285); // moonriver
      expect(chainIds).toContain(1287); // moonbaseAlpha
    });
  });
});
