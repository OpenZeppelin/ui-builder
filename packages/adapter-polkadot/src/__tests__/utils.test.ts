import { describe, expect, it } from 'vitest';

import {
  kusamaHubMainnet,
  moonbaseAlphaTestnet,
  moonbeamMainnet,
  moonriverMainnet,
  polkadotHubMainnet,
  polkadotHubTestnet,
} from '../networks';
import {
  getMainnetNetworks,
  getNetworkByChainId,
  getNetworkById,
  getNetworksByCategory,
  getNetworksByRelayChain,
  getTestnetNetworks,
  isHubNetwork,
  isParachainNetwork,
} from '../utils';

describe('Utility Functions', () => {
  describe('getNetworksByCategory', () => {
    it('should return all hub networks', () => {
      const hubNetworks = getNetworksByCategory('hub');

      expect(hubNetworks.length).toBe(3);
      expect(hubNetworks).toContainEqual(polkadotHubMainnet);
      expect(hubNetworks).toContainEqual(kusamaHubMainnet);
      expect(hubNetworks).toContainEqual(polkadotHubTestnet);
    });

    it('should return all parachain networks', () => {
      const parachainNetworks = getNetworksByCategory('parachain');

      expect(parachainNetworks.length).toBe(3);
      expect(parachainNetworks).toContainEqual(moonbeamMainnet);
      expect(parachainNetworks).toContainEqual(moonriverMainnet);
      expect(parachainNetworks).toContainEqual(moonbaseAlphaTestnet);
    });
  });

  describe('getNetworksByRelayChain', () => {
    it('should return all Polkadot relay chain networks', () => {
      const polkadotNetworks = getNetworksByRelayChain('polkadot');

      expect(polkadotNetworks.length).toBeGreaterThanOrEqual(2);
      expect(polkadotNetworks).toContainEqual(polkadotHubMainnet);
      expect(polkadotNetworks).toContainEqual(moonbeamMainnet);
    });

    it('should return all Kusama relay chain networks', () => {
      const kusamaNetworks = getNetworksByRelayChain('kusama');

      expect(kusamaNetworks.length).toBeGreaterThanOrEqual(2);
      expect(kusamaNetworks).toContainEqual(kusamaHubMainnet);
      expect(kusamaNetworks).toContainEqual(moonriverMainnet);
    });
  });

  describe('isHubNetwork', () => {
    it('should return true for hub networks', () => {
      expect(isHubNetwork(polkadotHubMainnet)).toBe(true);
      expect(isHubNetwork(kusamaHubMainnet)).toBe(true);
      expect(isHubNetwork(polkadotHubTestnet)).toBe(true);
    });

    it('should return false for parachain networks', () => {
      expect(isHubNetwork(moonbeamMainnet)).toBe(false);
      expect(isHubNetwork(moonriverMainnet)).toBe(false);
      expect(isHubNetwork(moonbaseAlphaTestnet)).toBe(false);
    });
  });

  describe('isParachainNetwork', () => {
    it('should return true for parachain networks', () => {
      expect(isParachainNetwork(moonbeamMainnet)).toBe(true);
      expect(isParachainNetwork(moonriverMainnet)).toBe(true);
      expect(isParachainNetwork(moonbaseAlphaTestnet)).toBe(true);
    });

    it('should return false for hub networks', () => {
      expect(isParachainNetwork(polkadotHubMainnet)).toBe(false);
      expect(isParachainNetwork(kusamaHubMainnet)).toBe(false);
      expect(isParachainNetwork(polkadotHubTestnet)).toBe(false);
    });
  });

  describe('getMainnetNetworks', () => {
    it('should return only mainnet networks', () => {
      const mainnets = getMainnetNetworks();

      expect(mainnets.every((n) => !n.isTestnet)).toBe(true);
      expect(mainnets.length).toBe(4); // 2 hub + 2 parachain mainnets
    });
  });

  describe('getTestnetNetworks', () => {
    it('should return only testnet networks', () => {
      const testnets = getTestnetNetworks();

      expect(testnets.every((n) => n.isTestnet)).toBe(true);
      expect(testnets.length).toBe(2); // 1 hub + 1 parachain testnet
    });
  });

  describe('getNetworkByChainId', () => {
    it('should find network by chain ID', () => {
      expect(getNetworkByChainId(420420419)).toEqual(polkadotHubMainnet);
      expect(getNetworkByChainId(1284)).toEqual(moonbeamMainnet);
      expect(getNetworkByChainId(1285)).toEqual(moonriverMainnet);
    });

    it('should return undefined for unknown chain ID', () => {
      expect(getNetworkByChainId(999999)).toBeUndefined();
    });
  });

  describe('getNetworkById', () => {
    it('should find network by ID', () => {
      expect(getNetworkById('polkadot-hub')).toEqual(polkadotHubMainnet);
      expect(getNetworkById('polkadot-moonbeam-mainnet')).toEqual(moonbeamMainnet);
    });

    it('should return undefined for unknown ID', () => {
      expect(getNetworkById('unknown-network')).toBeUndefined();
    });
  });
});
