import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UiKitConfiguration, UiKitName } from '@openzeppelin/ui-types';

import { CustomAccountDisplay, CustomConnectButton } from '../../components';
import { getResolvedWalletComponents } from '../uiKitService';

// Mock the stellar-wallets-kit before any imports that might use it
vi.mock('@creit.tech/stellar-wallets-kit', () => ({
  StellarWalletsKit: vi.fn(),
  WalletNetwork: {
    PUBLIC: 'PUBLIC',
    TESTNET: 'TESTNET',
  },
  allowAllModules: vi.fn(() => ({})),
}));

// Mock the filterWalletComponents module
vi.mock('../filterWalletComponents', () => ({
  filterWalletComponents: vi.fn((components, exclusions) => {
    // Simple mock implementation
    if (!components || Object.keys(components).length === 0) return undefined;
    if (exclusions.length === 0) return components;

    const filtered: Record<string, unknown> = {};
    for (const key in components) {
      if (!exclusions.includes(key)) {
        filtered[key] = components[key];
      }
    }
    return Object.keys(filtered).length > 0 ? filtered : undefined;
  }),
  getComponentExclusionsFromConfig: vi.fn((config) => {
    return config?.components?.exclude || [];
  }),
}));

describe('uiKitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getResolvedWalletComponents', () => {
    it('should return undefined for "none" kit', () => {
      const config: UiKitConfiguration = {
        kitName: 'none',
        kitConfig: {},
      };

      const result = getResolvedWalletComponents(config);
      expect(result).toBeUndefined();
    });

    it('should return custom components for "custom" kit', () => {
      const config: UiKitConfiguration = {
        kitName: 'custom',
        kitConfig: {},
      };

      const result = getResolvedWalletComponents(config);

      expect(result).toBeDefined();
      expect(result?.ConnectButton).toBe(CustomConnectButton);
      expect(result?.AccountDisplay).toBe(CustomAccountDisplay);
      expect(result?.NetworkSwitcher).toBeUndefined(); // Stellar doesn't have NetworkSwitcher
    });

    it('should return built-in UI components for "stellar-wallets-kit" kit', () => {
      const config: UiKitConfiguration = {
        kitName: 'stellar-wallets-kit',
        kitConfig: {},
      };

      const result = getResolvedWalletComponents(config);

      expect(result).toBeDefined();
      expect(result?.ConnectButton).toBeDefined();
      expect(result?.ConnectButton?.name).toBe('StellarWalletsKitConnectButton');
      expect(result?.AccountDisplay).toBeUndefined(); // Kit handles account display internally
      expect(result?.NetworkSwitcher).toBeUndefined();
    });

    it('should apply component exclusions', () => {
      const config: UiKitConfiguration = {
        kitName: 'custom',
        kitConfig: {
          components: {
            exclude: ['AccountDisplay'],
          },
        },
      };

      const result = getResolvedWalletComponents(config);

      expect(result).toBeDefined();
      expect(result?.ConnectButton).toBe(CustomConnectButton);
      expect(result?.AccountDisplay).toBeUndefined();
    });

    it('should handle all components being excluded', () => {
      const config: UiKitConfiguration = {
        kitName: 'custom',
        kitConfig: {
          components: {
            exclude: ['ConnectButton', 'AccountDisplay'],
          },
        },
      };

      const result = getResolvedWalletComponents(config);
      expect(result).toBeUndefined();
    });

    it('should return undefined for unsupported kit name', () => {
      const config: UiKitConfiguration = {
        kitName: 'unsupported-kit' as UiKitName,
        kitConfig: {},
      };

      const result = getResolvedWalletComponents(config);
      expect(result).toBeUndefined();
    });

    it('should default to "custom" when kit name is not provided', () => {
      const config: UiKitConfiguration = {
        kitName: undefined as unknown as UiKitName,
        kitConfig: {},
      };

      const result = getResolvedWalletComponents(config);

      expect(result).toBeDefined();
      expect(result?.ConnectButton).toBe(CustomConnectButton);
      expect(result?.AccountDisplay).toBe(CustomAccountDisplay);
    });

    it('should handle empty kit config for stellar-wallets-kit', () => {
      const config: UiKitConfiguration = {
        kitName: 'stellar-wallets-kit',
        kitConfig: undefined as Record<string, unknown> | undefined,
      };

      const result = getResolvedWalletComponents(config);

      expect(result).toBeDefined();
      expect(result?.ConnectButton).toBeDefined();
      expect(result?.ConnectButton?.name).toBe('StellarWalletsKitConnectButton');
      expect(result?.AccountDisplay).toBeUndefined();
    });

    it('should handle complex kit config with exclusions for custom kit', () => {
      const config: UiKitConfiguration = {
        kitName: 'custom',
        kitConfig: {
          showInjectedConnector: true,
          appName: 'Test App',
          components: {
            exclude: ['ConnectButton'],
            // Other potential component config
          },
        },
      };

      const result = getResolvedWalletComponents(config);

      expect(result).toBeDefined();
      expect(result?.ConnectButton).toBeUndefined();
      expect(result?.AccountDisplay).toBe(CustomAccountDisplay);
    });

    it('should not apply exclusions to stellar-wallets-kit built-in components', () => {
      const config: UiKitConfiguration = {
        kitName: 'stellar-wallets-kit',
        kitConfig: {
          components: {
            exclude: ['ConnectButton'], // Should be ignored
          },
        },
      };

      const result = getResolvedWalletComponents(config);

      expect(result).toBeDefined();
      // Built-in components are not affected by exclusions
      expect(result?.ConnectButton).toBeDefined();
      expect(result?.ConnectButton?.name).toBe('StellarWalletsKitConnectButton');
    });
  });
});
