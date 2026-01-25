import { moonbaseAlpha, moonbeam, moonriver } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import {
  kusamaHub,
  kusamaHubMainnet,
  mainnetNetworks,
  moonbaseAlphaTestnet,
  moonbeamMainnet,
  moonriverMainnet,
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

describe('Moonbeam Parachain Network Configurations', () => {
  describe('moonbeamMainnet', () => {
    it('should have correct chain configuration', () => {
      expect(moonbeamMainnet.id).toBe('polkadot-moonbeam-mainnet');
      expect(moonbeamMainnet.chainId).toBe(1284);
      expect(moonbeamMainnet.ecosystem).toBe('polkadot');
      expect(moonbeamMainnet.executionType).toBe('evm');
      expect(moonbeamMainnet.networkCategory).toBe('parachain');
      expect(moonbeamMainnet.relayChain).toBe('polkadot');
    });

    it('should have correct native currency (GLMR)', () => {
      expect(moonbeamMainnet.nativeCurrency.symbol).toBe('GLMR');
      expect(moonbeamMainnet.nativeCurrency.name).toBe('Glimmer');
      expect(moonbeamMainnet.nativeCurrency.decimals).toBe(18);
    });

    it('should use Moonscan (Etherscan V2 compatible)', () => {
      expect(moonbeamMainnet.supportsEtherscanV2).toBe(true);
      expect(moonbeamMainnet.apiUrl).toBe('https://api-moonbeam.moonscan.io/api');
      expect(moonbeamMainnet.explorerUrl).toBe('https://moonbeam.moonscan.io');
    });

    it('should include viem chain definition from viem/chains', () => {
      expect(moonbeamMainnet.viemChain).toBeDefined();
      expect(moonbeamMainnet.viemChain).toBe(moonbeam);
    });
  });

  describe('moonriverMainnet', () => {
    it('should have correct chain configuration', () => {
      expect(moonriverMainnet.id).toBe('polkadot-moonriver-mainnet');
      expect(moonriverMainnet.chainId).toBe(1285);
      expect(moonriverMainnet.ecosystem).toBe('polkadot');
      expect(moonriverMainnet.executionType).toBe('evm');
      expect(moonriverMainnet.networkCategory).toBe('parachain');
      expect(moonriverMainnet.relayChain).toBe('kusama');
    });

    it('should have correct native currency (MOVR)', () => {
      expect(moonriverMainnet.nativeCurrency.symbol).toBe('MOVR');
      expect(moonriverMainnet.nativeCurrency.name).toBe('Moonriver');
      expect(moonriverMainnet.nativeCurrency.decimals).toBe(18);
    });

    it('should use Moonscan (Etherscan V2 compatible)', () => {
      expect(moonriverMainnet.supportsEtherscanV2).toBe(true);
      expect(moonriverMainnet.apiUrl).toBe('https://api-moonriver.moonscan.io/api');
      expect(moonriverMainnet.explorerUrl).toBe('https://moonriver.moonscan.io');
    });

    it('should include viem chain definition from viem/chains', () => {
      expect(moonriverMainnet.viemChain).toBeDefined();
      expect(moonriverMainnet.viemChain).toBe(moonriver);
    });
  });

  describe('moonbaseAlphaTestnet', () => {
    it('should have correct chain configuration', () => {
      expect(moonbaseAlphaTestnet.id).toBe('polkadot-moonbase-alpha-testnet');
      expect(moonbaseAlphaTestnet.chainId).toBe(1287);
      expect(moonbaseAlphaTestnet.isTestnet).toBe(true);
      expect(moonbaseAlphaTestnet.type).toBe('testnet');
      expect(moonbaseAlphaTestnet.ecosystem).toBe('polkadot');
      expect(moonbaseAlphaTestnet.executionType).toBe('evm');
      expect(moonbaseAlphaTestnet.networkCategory).toBe('parachain');
    });

    it('should have no relay chain (testnet)', () => {
      expect(moonbaseAlphaTestnet.relayChain).toBeUndefined();
    });

    it('should have correct native currency (DEV)', () => {
      expect(moonbaseAlphaTestnet.nativeCurrency.symbol).toBe('DEV');
      expect(moonbaseAlphaTestnet.nativeCurrency.name).toBe('DEV');
      expect(moonbaseAlphaTestnet.nativeCurrency.decimals).toBe(18);
    });

    it('should use Moonscan (Etherscan V2 compatible)', () => {
      expect(moonbaseAlphaTestnet.supportsEtherscanV2).toBe(true);
      expect(moonbaseAlphaTestnet.apiUrl).toBe('https://api-moonbase.moonscan.io/api');
      expect(moonbaseAlphaTestnet.explorerUrl).toBe('https://moonbase.moonscan.io');
    });

    it('should include viem chain definition from viem/chains', () => {
      expect(moonbaseAlphaTestnet.viemChain).toBeDefined();
      expect(moonbaseAlphaTestnet.viemChain).toBe(moonbaseAlpha);
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
    it('should contain Hub networks before parachains (priority order)', () => {
      expect(mainnetNetworks).toHaveLength(4);
      // Hub networks first (P1)
      expect(mainnetNetworks[0].id).toBe('polkadot-hub');
      expect(mainnetNetworks[0].networkCategory).toBe('hub');
      expect(mainnetNetworks[1].id).toBe('kusama-hub');
      expect(mainnetNetworks[1].networkCategory).toBe('hub');
      // Parachains after (P2)
      expect(mainnetNetworks[2].id).toBe('polkadot-moonbeam-mainnet');
      expect(mainnetNetworks[2].networkCategory).toBe('parachain');
      expect(mainnetNetworks[3].id).toBe('polkadot-moonriver-mainnet');
      expect(mainnetNetworks[3].networkCategory).toBe('parachain');
    });

    it('should only contain mainnet networks', () => {
      mainnetNetworks.forEach((network) => {
        expect(network.isTestnet).toBe(false);
        expect(network.type).toBe('mainnet');
      });
    });
  });

  describe('testnetNetworks', () => {
    it('should contain Hub testnet before parachain testnets (priority order)', () => {
      expect(testnetNetworks).toHaveLength(2);
      // Hub testnets first (P1)
      expect(testnetNetworks[0].id).toBe('polkadot-hub-testnet');
      expect(testnetNetworks[0].networkCategory).toBe('hub');
      // Parachain testnets after (P2)
      expect(testnetNetworks[1].id).toBe('polkadot-moonbase-alpha-testnet');
      expect(testnetNetworks[1].networkCategory).toBe('parachain');
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
      // Hub networks
      expect(networks['polkadot-hub']).toBe(polkadotHubMainnet);
      expect(networks['kusama-hub']).toBe(kusamaHubMainnet);
      expect(networks['polkadot-hub-testnet']).toBe(polkadotHubTestnet);
      // Parachain networks
      expect(networks['polkadot-moonbeam-mainnet']).toBe(moonbeamMainnet);
      expect(networks['polkadot-moonriver-mainnet']).toBe(moonriverMainnet);
      expect(networks['polkadot-moonbase-alpha-testnet']).toBe(moonbaseAlphaTestnet);
    });

    it('should have correct number of networks', () => {
      expect(Object.keys(networks)).toHaveLength(6);
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

  it('all networks should have valid networkCategory', () => {
    const allNetworks = [...mainnetNetworks, ...testnetNetworks];
    allNetworks.forEach((network) => {
      expect(['hub', 'parachain']).toContain(network.networkCategory);
    });
  });

  it('Hub networks should use Blockscout (V1 API)', () => {
    const hubNetworks = [...mainnetNetworks, ...testnetNetworks].filter(
      (n) => n.networkCategory === 'hub'
    );
    hubNetworks.forEach((network) => {
      expect(network.supportsEtherscanV2).toBe(false);
    });
  });

  it('Moonbeam parachain networks should use Moonscan (V2 API)', () => {
    const parachainNetworks = [...mainnetNetworks, ...testnetNetworks].filter(
      (n) => n.networkCategory === 'parachain'
    );
    parachainNetworks.forEach((network) => {
      expect(network.supportsEtherscanV2).toBe(true);
      expect(network.apiUrl).toContain('moonscan.io');
    });
  });
});
