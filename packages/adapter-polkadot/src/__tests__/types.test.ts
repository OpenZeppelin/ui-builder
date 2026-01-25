import { describe, expect, it } from 'vitest';

import type {
  PolkadotExecutionType,
  PolkadotNetworkCategory,
  PolkadotRelayChain,
  TypedPolkadotNetworkConfig,
} from '../types';

describe('Polkadot Types', () => {
  describe('PolkadotExecutionType', () => {
    it('should accept valid execution types', () => {
      const evmType: PolkadotExecutionType = 'evm';
      const substrateType: PolkadotExecutionType = 'substrate';
      expect(evmType).toBe('evm');
      expect(substrateType).toBe('substrate');
    });
  });

  describe('PolkadotNetworkCategory', () => {
    it('should accept valid network categories', () => {
      const hubCategory: PolkadotNetworkCategory = 'hub';
      const parachainCategory: PolkadotNetworkCategory = 'parachain';
      expect(hubCategory).toBe('hub');
      expect(parachainCategory).toBe('parachain');
    });
  });

  describe('PolkadotRelayChain', () => {
    it('should accept valid relay chains', () => {
      const polkadot: PolkadotRelayChain = 'polkadot';
      const kusama: PolkadotRelayChain = 'kusama';
      expect(polkadot).toBe('polkadot');
      expect(kusama).toBe('kusama');
    });
  });

  describe('TypedPolkadotNetworkConfig', () => {
    it('should require all mandatory fields', () => {
      const config: TypedPolkadotNetworkConfig = {
        id: 'polkadot-hub',
        name: 'Polkadot Hub',
        exportConstName: 'polkadotHub',
        ecosystem: 'polkadot',
        network: 'polkadot-hub',
        type: 'mainnet',
        isTestnet: false,
        chainId: 420420419,
        rpcUrl: 'https://services.polkadothub-rpc.com',
        nativeCurrency: {
          name: 'Polkadot',
          symbol: 'DOT',
          decimals: 18,
        },
        executionType: 'evm',
        networkCategory: 'hub',
        relayChain: 'polkadot',
      };

      expect(config.id).toBe('polkadot-hub');
      expect(config.ecosystem).toBe('polkadot');
      expect(config.executionType).toBe('evm');
      expect(config.networkCategory).toBe('hub');
      expect(config.relayChain).toBe('polkadot');
    });

    it('should allow optional fields to be omitted', () => {
      const config: TypedPolkadotNetworkConfig = {
        id: 'test-network',
        name: 'Test Network',
        exportConstName: 'testNetwork',
        ecosystem: 'polkadot',
        network: 'test',
        type: 'testnet',
        isTestnet: true,
        chainId: 12345,
        rpcUrl: 'https://test.rpc.com',
        nativeCurrency: {
          name: 'Test',
          symbol: 'TEST',
          decimals: 18,
        },
        executionType: 'evm',
        networkCategory: 'parachain',
        // relayChain is optional and omitted
      };

      expect(config.relayChain).toBeUndefined();
    });

    it('should support optional explorer fields', () => {
      const config: TypedPolkadotNetworkConfig = {
        id: 'polkadot-hub',
        name: 'Polkadot Hub',
        exportConstName: 'polkadotHubMainnet',
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

      expect(config.explorerUrl).toBe('https://blockscout.polkadot.io');
      expect(config.apiUrl).toBe('https://blockscout.polkadot.io/api');
      expect(config.supportsEtherscanV2).toBe(false);
    });
  });
});
