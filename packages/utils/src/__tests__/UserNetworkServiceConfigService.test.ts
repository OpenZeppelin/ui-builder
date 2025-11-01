import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UserNetworkServiceConfigService,
  userNetworkServiceConfigService,
} from '../UserNetworkServiceConfigService';

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

describe('UserNetworkServiceConfigService', () => {
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

  describe('save', () => {
    it('should save configuration to localStorage with correct key format', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const config = { rpcUrl: 'https://sepolia.infura.io/v3/test-key' };

      UserNetworkServiceConfigService.save(networkId, serviceId, config);

      const stored = localStorage.getItem('tfb_service_config_rpc__ethereum-sepolia');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(config);
    });

    it('should handle multiple services for the same network', () => {
      const networkId = 'ethereum-sepolia';
      const rpcConfig = { rpcUrl: 'https://sepolia.infura.io/v3/test-key' };
      const explorerConfig = { apiKey: 'test-api-key', useV2Api: true };

      UserNetworkServiceConfigService.save(networkId, 'rpc', rpcConfig);
      UserNetworkServiceConfigService.save(networkId, 'explorer', explorerConfig);

      const rpcStored = localStorage.getItem('tfb_service_config_rpc__ethereum-sepolia');
      const explorerStored = localStorage.getItem('tfb_service_config_explorer__ethereum-sepolia');

      expect(JSON.parse(rpcStored!)).toEqual(rpcConfig);
      expect(JSON.parse(explorerStored!)).toEqual(explorerConfig);
    });

    it('should handle multiple networks with the same service', () => {
      const serviceId = 'rpc';
      const sepoliaConfig = { rpcUrl: 'https://sepolia.infura.io/v3/test-key' };
      const mainnetConfig = { rpcUrl: 'https://mainnet.infura.io/v3/test-key' };

      UserNetworkServiceConfigService.save('ethereum-sepolia', serviceId, sepoliaConfig);
      UserNetworkServiceConfigService.save('ethereum-mainnet', serviceId, mainnetConfig);

      const sepoliaStored = localStorage.getItem('tfb_service_config_rpc__ethereum-sepolia');
      const mainnetStored = localStorage.getItem('tfb_service_config_rpc__ethereum-mainnet');

      expect(JSON.parse(sepoliaStored!)).toEqual(sepoliaConfig);
      expect(JSON.parse(mainnetStored!)).toEqual(mainnetConfig);
    });

    it('should overwrite existing configuration when saving again', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const initialConfig = { rpcUrl: 'https://sepolia.infura.io/v3/old-key' };
      const updatedConfig = { rpcUrl: 'https://sepolia.infura.io/v3/new-key' };

      UserNetworkServiceConfigService.save(networkId, serviceId, initialConfig);
      UserNetworkServiceConfigService.save(networkId, serviceId, updatedConfig);

      const stored = localStorage.getItem('tfb_service_config_rpc__ethereum-sepolia');
      expect(JSON.parse(stored!)).toEqual(updatedConfig);
    });
  });

  describe('get', () => {
    it('should retrieve saved configuration', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const config = { rpcUrl: 'https://sepolia.infura.io/v3/test-key' };

      UserNetworkServiceConfigService.save(networkId, serviceId, config);
      const retrieved = UserNetworkServiceConfigService.get(networkId, serviceId);

      expect(retrieved).toEqual(config);
    });

    it('should return null for non-existent configuration', () => {
      const retrieved = UserNetworkServiceConfigService.get(
        'ethereum-sepolia',
        'nonexistent-service'
      );
      expect(retrieved).toBeNull();
    });

    it('should return null for non-existent network', () => {
      const retrieved = UserNetworkServiceConfigService.get('nonexistent-network', 'rpc');
      expect(retrieved).toBeNull();
    });

    it('should handle complex configuration objects', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'explorer';
      const config = {
        apiKey: 'test-api-key',
        useV2Api: true,
        applyToAllNetworks: false,
        explorerUrl: 'https://sepolia.etherscan.io',
        apiUrl: 'https://api.etherscan.io/api',
      };

      UserNetworkServiceConfigService.save(networkId, serviceId, config);
      const retrieved = UserNetworkServiceConfigService.get(networkId, serviceId);

      expect(retrieved).toEqual(config);
    });
  });

  describe('clear', () => {
    it('should remove configuration from localStorage', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const config = { rpcUrl: 'https://sepolia.infura.io/v3/test-key' };

      UserNetworkServiceConfigService.save(networkId, serviceId, config);
      expect(UserNetworkServiceConfigService.get(networkId, serviceId)).toBeTruthy();

      UserNetworkServiceConfigService.clear(networkId, serviceId);
      expect(UserNetworkServiceConfigService.get(networkId, serviceId)).toBeNull();
    });

    it('should only clear the specified network-service combination', () => {
      const networkId = 'ethereum-sepolia';
      const rpcConfig = { rpcUrl: 'https://sepolia.infura.io/v3/test-key' };
      const explorerConfig = { apiKey: 'test-api-key' };

      UserNetworkServiceConfigService.save(networkId, 'rpc', rpcConfig);
      UserNetworkServiceConfigService.save(networkId, 'explorer', explorerConfig);

      UserNetworkServiceConfigService.clear(networkId, 'rpc');

      expect(UserNetworkServiceConfigService.get(networkId, 'rpc')).toBeNull();
      expect(UserNetworkServiceConfigService.get(networkId, 'explorer')).toEqual(explorerConfig);
    });

    it('should handle clearing non-existent configuration gracefully', () => {
      expect(() => {
        UserNetworkServiceConfigService.clear('nonexistent-network', 'rpc');
      }).not.toThrow();
    });
  });

  describe('subscribe', () => {
    it('should call listener when configuration changes', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const config = { rpcUrl: 'https://sepolia.infura.io/v3/test-key' };
      const listener = vi.fn();

      const unsubscribe = UserNetworkServiceConfigService.subscribe(networkId, serviceId, listener);
      UserNetworkServiceConfigService.save(networkId, serviceId, config);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        type: 'service-config-changed',
        networkId,
        serviceId,
        config,
      });

      unsubscribe();
    });

    it('should call listener when configuration is cleared', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const config = { rpcUrl: 'https://sepolia.infura.io/v3/test-key' };
      const listener = vi.fn();

      UserNetworkServiceConfigService.save(networkId, serviceId, config);
      const unsubscribe = UserNetworkServiceConfigService.subscribe(networkId, serviceId, listener);
      UserNetworkServiceConfigService.clear(networkId, serviceId);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        type: 'service-config-cleared',
        networkId,
        serviceId,
      });

      unsubscribe();
    });

    it('should support wildcard network subscription', () => {
      const serviceId = 'rpc';
      const listener = vi.fn();

      const unsubscribe = UserNetworkServiceConfigService.subscribe('*', serviceId, listener);
      UserNetworkServiceConfigService.save('ethereum-sepolia', serviceId, {
        rpcUrl: 'https://sepolia.infura.io/v3/test-key',
      });
      UserNetworkServiceConfigService.save('ethereum-mainnet', serviceId, {
        rpcUrl: 'https://mainnet.infura.io/v3/test-key',
      });

      expect(listener).toHaveBeenCalledTimes(2);
      unsubscribe();
    });

    it('should support wildcard service subscription', () => {
      const networkId = 'ethereum-sepolia';
      const listener = vi.fn();

      const unsubscribe = UserNetworkServiceConfigService.subscribe(networkId, '*', listener);
      UserNetworkServiceConfigService.save(networkId, 'rpc', { rpcUrl: 'https://test.com' });
      UserNetworkServiceConfigService.save(networkId, 'explorer', { apiKey: 'test-key' });

      expect(listener).toHaveBeenCalledTimes(2);
      unsubscribe();
    });

    it('should support wildcard network and service subscription', () => {
      const listener = vi.fn();

      const unsubscribe = UserNetworkServiceConfigService.subscribe('*', '*', listener);
      UserNetworkServiceConfigService.save('ethereum-sepolia', 'rpc', {
        rpcUrl: 'https://test.com',
      });
      UserNetworkServiceConfigService.save('ethereum-mainnet', 'explorer', {
        apiKey: 'test-key',
      });

      expect(listener).toHaveBeenCalledTimes(2);
      unsubscribe();
    });

    it('should stop calling listener after unsubscribe', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const listener = vi.fn();

      const unsubscribe = UserNetworkServiceConfigService.subscribe(networkId, serviceId, listener);
      UserNetworkServiceConfigService.save(networkId, serviceId, {
        rpcUrl: 'https://test.com',
      });

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      UserNetworkServiceConfigService.save(networkId, serviceId, {
        rpcUrl: 'https://test2.com',
      });

      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should handle multiple listeners for the same network-service', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = UserNetworkServiceConfigService.subscribe(
        networkId,
        serviceId,
        listener1
      );
      const unsubscribe2 = UserNetworkServiceConfigService.subscribe(
        networkId,
        serviceId,
        listener2
      );

      UserNetworkServiceConfigService.save(networkId, serviceId, {
        rpcUrl: 'https://test.com',
      });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      unsubscribe1();
      unsubscribe2();
    });

    it('should handle errors in listener gracefully', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      const unsubscribe1 = UserNetworkServiceConfigService.subscribe(
        networkId,
        serviceId,
        errorListener
      );
      const unsubscribe2 = UserNetworkServiceConfigService.subscribe(
        networkId,
        serviceId,
        normalListener
      );

      // Should not throw, and normal listener should still be called
      expect(() => {
        UserNetworkServiceConfigService.save(networkId, serviceId, {
          rpcUrl: 'https://test.com',
        });
      }).not.toThrow();

      expect(normalListener).toHaveBeenCalledTimes(1);

      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('userNetworkServiceConfigService singleton', () => {
    it('should be an instance of UserNetworkServiceConfigService', () => {
      expect(userNetworkServiceConfigService).toBe(UserNetworkServiceConfigService);
    });

    it('should have all static methods available', () => {
      expect(typeof userNetworkServiceConfigService.save).toBe('function');
      expect(typeof userNetworkServiceConfigService.get).toBe('function');
      expect(typeof userNetworkServiceConfigService.clear).toBe('function');
      expect(typeof userNetworkServiceConfigService.subscribe).toBe('function');
    });
  });

  describe('key format', () => {
    it('should use correct key format in localStorage', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      const config = { rpcUrl: 'https://sepolia.infura.io/v3/test-key' };

      UserNetworkServiceConfigService.save(networkId, serviceId, config);

      const expectedKey = 'tfb_service_config_rpc__ethereum-sepolia';
      expect(localStorage.getItem(expectedKey)).toBeTruthy();
    });

    it('should handle special characters in network and service IDs', () => {
      const networkId = 'network-with-dashes';
      const serviceId = 'service_with_underscores';
      const config = { test: 'value' };

      UserNetworkServiceConfigService.save(networkId, serviceId, config);

      const expectedKey = 'tfb_service_config_service_with_underscores__network-with-dashes';
      expect(localStorage.getItem(expectedKey)).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle localStorage.setItem errors gracefully', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        UserNetworkServiceConfigService.save('ethereum-sepolia', 'rpc', {
          rpcUrl: 'https://test.com',
        });
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage.getItem errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const result = UserNetworkServiceConfigService.get('ethereum-sepolia', 'rpc');
      expect(result).toBeNull();

      localStorage.getItem = originalGetItem;
    });

    it('should handle JSON.parse errors gracefully', () => {
      const networkId = 'ethereum-sepolia';
      const serviceId = 'rpc';
      // Store invalid JSON
      localStorage.setItem('tfb_service_config_rpc__ethereum-sepolia', 'invalid-json');

      const result = UserNetworkServiceConfigService.get(networkId, serviceId);
      expect(result).toBeNull();
    });

    it('should handle localStorage.removeItem errors gracefully', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        UserNetworkServiceConfigService.clear('ethereum-sepolia', 'rpc');
      }).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });
});
