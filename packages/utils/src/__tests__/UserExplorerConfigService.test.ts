import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserExplorerConfigService } from '../UserExplorerConfigService';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// Set up localStorage mock globally for this test file
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('UserExplorerConfigService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset any mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('saveUserExplorerConfig', () => {
    it('should save explorer configuration to localStorage', () => {
      const networkId = 'ethereum-mainnet';
      const config = {
        explorerUrl: 'https://etherscan.io',
        apiUrl: 'https://api.etherscan.io/api',
        apiKey: 'test-api-key',
        name: 'Custom Etherscan',
        isCustom: true,
      };

      UserExplorerConfigService.saveUserExplorerConfig(networkId, config);

      const stored = localStorage.getItem(`tfb_explorer_config_${networkId}`);
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(config);
    });

    it('should emit explorer-config-changed event when saving', () => {
      const networkId = 'ethereum-mainnet';
      const config = {
        explorerUrl: 'https://etherscan.io',
        apiKey: 'test-api-key',
        name: 'Custom Explorer',
        isCustom: true,
      };

      const listener = vi.fn();
      const unsubscribe = UserExplorerConfigService.subscribe(networkId, listener);

      UserExplorerConfigService.saveUserExplorerConfig(networkId, config);

      expect(listener).toHaveBeenCalledWith({
        type: 'explorer-config-changed',
        networkId,
        config,
      });

      unsubscribe();
    });
  });

  describe('getUserExplorerConfig', () => {
    it('should retrieve stored explorer configuration', () => {
      const networkId = 'polygon-mainnet';
      const config = {
        explorerUrl: 'https://polygonscan.com',
        apiUrl: 'https://api.polygonscan.com/api',
        apiKey: 'polygon-api-key',
        name: 'PolygonScan',
        isCustom: true,
      };

      localStorage.setItem(`tfb_explorer_config_${networkId}`, JSON.stringify(config));

      const retrieved = UserExplorerConfigService.getUserExplorerConfig(networkId);
      expect(retrieved).toEqual(config);
    });

    it('should return null if no configuration exists', () => {
      const retrieved = UserExplorerConfigService.getUserExplorerConfig('non-existent-network');
      expect(retrieved).toBeNull();
    });

    it('should return null if stored data is invalid JSON', () => {
      const networkId = 'invalid-network';
      localStorage.setItem(`tfb_explorer_config_${networkId}`, 'invalid-json');

      const retrieved = UserExplorerConfigService.getUserExplorerConfig(networkId);
      expect(retrieved).toBeNull();
    });
  });

  describe('clearUserExplorerConfig', () => {
    it('should remove explorer configuration from localStorage', () => {
      const networkId = 'ethereum-sepolia';
      const config = {
        apiKey: 'test-key',
        name: 'Test',
        isCustom: true,
      };

      localStorage.setItem(`tfb_explorer_config_${networkId}`, JSON.stringify(config));

      UserExplorerConfigService.clearUserExplorerConfig(networkId);

      const stored = localStorage.getItem(`tfb_explorer_config_${networkId}`);
      expect(stored).toBeNull();
    });

    it('should emit explorer-config-cleared event when clearing', () => {
      const networkId = 'ethereum-mainnet';
      const listener = vi.fn();
      const unsubscribe = UserExplorerConfigService.subscribe(networkId, listener);

      UserExplorerConfigService.clearUserExplorerConfig(networkId);

      expect(listener).toHaveBeenCalledWith({
        type: 'explorer-config-cleared',
        networkId,
      });

      unsubscribe();
    });
  });

  describe('clearAllUserExplorerConfigs', () => {
    it('should remove all explorer configurations', () => {
      // Set up multiple configs
      localStorage.setItem(
        'tfb_explorer_config_network1',
        JSON.stringify({ apiKey: 'key1', name: 'Explorer 1', isCustom: true })
      );
      localStorage.setItem(
        'tfb_explorer_config_network2',
        JSON.stringify({ apiKey: 'key2', name: 'Explorer 2', isCustom: true })
      );
      localStorage.setItem('other_key', 'should not be removed');

      UserExplorerConfigService.clearAllUserExplorerConfigs();

      expect(localStorage.getItem('tfb_explorer_config_network1')).toBeNull();
      expect(localStorage.getItem('tfb_explorer_config_network2')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('should not be removed');
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should allow subscribing to specific network events', () => {
      const networkId = 'ethereum-mainnet';
      const listener = vi.fn();
      const unsubscribe = UserExplorerConfigService.subscribe(networkId, listener);

      const config = { apiKey: 'test', name: 'Test', isCustom: true };
      UserExplorerConfigService.saveUserExplorerConfig(networkId, config);

      expect(listener).toHaveBeenCalledTimes(1);

      // Should not receive events for other networks
      UserExplorerConfigService.saveUserExplorerConfig('other-network', config);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
    });

    it('should allow subscribing to all network events with wildcard', () => {
      const listener = vi.fn();
      const unsubscribe = UserExplorerConfigService.subscribe('*', listener);

      const config = { apiKey: 'test', name: 'Test', isCustom: true };
      UserExplorerConfigService.saveUserExplorerConfig('network1', config);
      UserExplorerConfigService.saveUserExplorerConfig('network2', config);

      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it('should stop receiving events after unsubscribe', () => {
      const networkId = 'ethereum-mainnet';
      const listener = vi.fn();
      const unsubscribe = UserExplorerConfigService.subscribe(networkId, listener);

      const config = { apiKey: 'test', name: 'Test', isCustom: true };
      UserExplorerConfigService.saveUserExplorerConfig(networkId, config);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      UserExplorerConfigService.saveUserExplorerConfig(networkId, config);
      expect(listener).toHaveBeenCalledTimes(1); // Should not increase
    });
  });
});
