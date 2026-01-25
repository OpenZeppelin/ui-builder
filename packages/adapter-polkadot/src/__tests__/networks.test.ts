import { describe, expect, it } from 'vitest';

import {
  kusamaHub,
  kusamaHubMainnet,
  mainnetNetworks,
  networks,
  polkadotHub,
  polkadotHubMainnet,
  polkadotHubTestnet,
  polkadotHubTestNet,
  testnetNetworks,
} from '../networks';

describe('Polkadot Hub Network Configurations', () => {
  describe('polkadotHubMainnet', () => {
    it('should have correct chain configuration', () => {
      expect(polkadotHubMainnet.id).toBe('polkadot-hub');
      expect(polkadotHubMainnet.chainId).toBe(420420419);
      expect(polkadotHubMainnet.ecosystem).toBe('polkadot');
      expect(polkadotHubMainnet.executionType).toBe('evm');
      expect(polkadotHubMainnet.networkCategory).toBe('hub');
      expect(polkadotHubMainnet.relayChain).toBe('polkadot');
    });

    it('should have correct native currency', () => {
      expect(polkadotHubMainnet.nativeCurrency.symbol).toBe('DOT');
      expect(polkadotHubMainnet.nativeCurrency.decimals).toBe(18);
    });

    it('should use Blockscout (Etherscan V1 API)', () => {
      expect(polkadotHubMainnet.supportsEtherscanV2).toBe(false);
      expect(polkadotHubMainnet.apiUrl).toContain('blockscout');
    });

    it('should include viem chain definition', () => {
      expect(polkadotHubMainnet.viemChain).toBeDefined();
      expect(polkadotHubMainnet.viemChain).toBe(polkadotHub);
    });
  });

  describe('kusamaHubMainnet', () => {
    it('should have correct chain configuration', () => {
      expect(kusamaHubMainnet.id).toBe('kusama-hub');
      expect(kusamaHubMainnet.chainId).toBe(420420418);
      expect(kusamaHubMainnet.ecosystem).toBe('polkadot');
      expect(kusamaHubMainnet.executionType).toBe('evm');
      expect(kusamaHubMainnet.networkCategory).toBe('hub');
      expect(kusamaHubMainnet.relayChain).toBe('kusama');
    });

    it('should have correct native currency', () => {
      expect(kusamaHubMainnet.nativeCurrency.symbol).toBe('KSM');
      expect(kusamaHubMainnet.nativeCurrency.decimals).toBe(18);
    });

    it('should use Blockscout (Etherscan V1 API)', () => {
      expect(kusamaHubMainnet.supportsEtherscanV2).toBe(false);
    });
  });

  describe('polkadotHubTestnet', () => {
    it('should have correct chain configuration', () => {
      expect(polkadotHubTestnet.id).toBe('polkadot-hub-testnet');
      expect(polkadotHubTestnet.chainId).toBe(420420417);
      expect(polkadotHubTestnet.isTestnet).toBe(true);
      expect(polkadotHubTestnet.type).toBe('testnet');
      expect(polkadotHubTestnet.networkCategory).toBe('hub');
    });

    it('should have correct native currency (PAS)', () => {
      expect(polkadotHubTestnet.nativeCurrency.symbol).toBe('PAS');
      expect(polkadotHubTestnet.nativeCurrency.name).toBe('Paseo');
    });

    it('should include viem chain definition', () => {
      expect(polkadotHubTestnet.viemChain).toBeDefined();
      expect(polkadotHubTestnet.viemChain).toBe(polkadotHubTestNet);
    });
  });
});

describe('Viem Chain Definitions', () => {
  describe('polkadotHub', () => {
    it('should have correct chain ID', () => {
      expect(polkadotHub.id).toBe(420420419);
    });

    it('should have correct native currency', () => {
      expect(polkadotHub.nativeCurrency.symbol).toBe('DOT');
    });
  });

  describe('kusamaHub', () => {
    it('should have correct chain ID', () => {
      expect(kusamaHub.id).toBe(420420418);
    });

    it('should have correct native currency', () => {
      expect(kusamaHub.nativeCurrency.symbol).toBe('KSM');
    });
  });

  describe('polkadotHubTestNet', () => {
    it('should have correct chain ID', () => {
      expect(polkadotHubTestNet.id).toBe(420420417);
    });

    it('should be marked as testnet', () => {
      expect(polkadotHubTestNet.testnet).toBe(true);
    });
  });
});

describe('Network Collections', () => {
  describe('mainnetNetworks', () => {
    it('should contain Hub networks in priority order', () => {
      expect(mainnetNetworks).toHaveLength(2);
      expect(mainnetNetworks[0].id).toBe('polkadot-hub');
      expect(mainnetNetworks[1].id).toBe('kusama-hub');
    });

    it('should only contain mainnet networks', () => {
      mainnetNetworks.forEach((network) => {
        expect(network.isTestnet).toBe(false);
        expect(network.type).toBe('mainnet');
      });
    });
  });

  describe('testnetNetworks', () => {
    it('should contain Hub testnet', () => {
      expect(testnetNetworks).toHaveLength(1);
      expect(testnetNetworks[0].id).toBe('polkadot-hub-testnet');
    });

    it('should only contain testnet networks', () => {
      testnetNetworks.forEach((network) => {
        expect(network.isTestnet).toBe(true);
        expect(network.type).toBe('testnet');
      });
    });
  });

  describe('networks', () => {
    it('should contain all networks indexed by ID', () => {
      expect(networks['polkadot-hub']).toBe(polkadotHubMainnet);
      expect(networks['kusama-hub']).toBe(kusamaHubMainnet);
      expect(networks['polkadot-hub-testnet']).toBe(polkadotHubTestnet);
    });

    it('should have correct number of networks', () => {
      expect(Object.keys(networks)).toHaveLength(3);
    });
  });
});

describe('Network Validation', () => {
  it('all networks should have unique IDs', () => {
    const allNetworks = [...mainnetNetworks, ...testnetNetworks];
    const ids = allNetworks.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all networks should have unique chain IDs', () => {
    const allNetworks = [...mainnetNetworks, ...testnetNetworks];
    const chainIds = allNetworks.map((n) => n.chainId);
    const uniqueChainIds = new Set(chainIds);
    expect(uniqueChainIds.size).toBe(chainIds.length);
  });

  it('all Hub networks should have networkCategory hub', () => {
    const allNetworks = [...mainnetNetworks, ...testnetNetworks];
    allNetworks.forEach((network) => {
      expect(network.networkCategory).toBe('hub');
    });
  });
});
