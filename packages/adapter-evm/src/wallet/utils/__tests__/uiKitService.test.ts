import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ComponentExclusionConfig,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { CustomAccountDisplay, CustomConnectButton, CustomNetworkSwitcher } from '../../components';
import { EvmBasicUiContextProvider } from '../../provider';
import { getResolvedUiContextProvider, getResolvedWalletComponents } from '../uiKitService';

// Mock the logger
vi.mock('@openzeppelin/transaction-form-utils', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('uiKitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getResolvedUiContextProvider', () => {
    it('should return EvmBasicUiContextProvider for "custom" kit', () => {
      const config: UiKitConfiguration = { kitName: 'custom' };
      const result = getResolvedUiContextProvider(config);
      expect(result).toBe(EvmBasicUiContextProvider);
      expect(logger.info).toHaveBeenCalledWith(
        'uiKitService',
        'Providing EvmBasicUiContextProvider for "custom" kit.'
      );
    });

    it('should return EvmBasicUiContextProvider when kitName is undefined', () => {
      const config: UiKitConfiguration = {};
      const result = getResolvedUiContextProvider(config);
      expect(result).toBe(EvmBasicUiContextProvider);
      expect(logger.info).toHaveBeenCalledWith(
        'uiKitService',
        'Providing EvmBasicUiContextProvider for "custom" kit.'
      );
    });

    it('should return undefined for "none" kit', () => {
      const config: UiKitConfiguration = { kitName: 'none' };
      const result = getResolvedUiContextProvider(config);
      expect(result).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        'uiKitService',
        'UI Kit set to "none", not providing a UI context provider.'
      );
    });

    it('should return EvmBasicUiContextProvider and log warning for unsupported kit', () => {
      const config = { kitName: 'unsupported' } as unknown as UiKitConfiguration;
      const result = getResolvedUiContextProvider(config);
      expect(result).toBe(EvmBasicUiContextProvider);
      expect(logger.warn).toHaveBeenCalledWith(
        'uiKitService',
        'UI Kit "unsupported" for UI Context Provider not explicitly supported. Defaulting to EvmBasicUiContextProvider.'
      );
    });
  });

  describe('getResolvedWalletComponents', () => {
    const allCustomComponents = {
      ConnectButton: CustomConnectButton,
      AccountDisplay: CustomAccountDisplay,
      NetworkSwitcher: CustomNetworkSwitcher,
    };

    it('should return undefined for "none" kit', () => {
      const config: UiKitConfiguration = { kitName: 'none' };
      const result = getResolvedWalletComponents(config);
      expect(result).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        'uiKitService',
        'UI Kit set to "none" for getResolvedWalletComponents, not providing wallet components.'
      );
    });

    it('should return all components for "custom" kit without exclusions', () => {
      const config: UiKitConfiguration = { kitName: 'custom' };
      const result = getResolvedWalletComponents(config);
      expect(result).toEqual(allCustomComponents);
    });

    it('should return filtered components when exclusions are specified', () => {
      const config: UiKitConfiguration = {
        kitName: 'custom',
        kitConfig: {
          components: {
            exclude: ['AccountDisplay'],
          },
        },
      };
      const result = getResolvedWalletComponents(config);
      expect(result).toEqual({
        ConnectButton: CustomConnectButton,
        NetworkSwitcher: CustomNetworkSwitcher,
      });
    });

    it('should return undefined for unsupported kit', () => {
      const config = { kitName: 'unsupported' } as unknown as UiKitConfiguration;
      const result = getResolvedWalletComponents(config);
      expect(result).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'uiKitService',
        'UI Kit "unsupported" for getResolvedWalletComponents not explicitly supported. No components provided.'
      );
    });

    it('should handle empty exclusions array', () => {
      const config: UiKitConfiguration = {
        kitName: 'custom',
        kitConfig: {
          components: {
            exclude: [],
          },
        },
      };
      const result = getResolvedWalletComponents(config);
      expect(result).toEqual(allCustomComponents);
    });

    it('should handle undefined kitConfig', () => {
      const config: UiKitConfiguration = {
        kitName: 'custom',
      };
      const result = getResolvedWalletComponents(config);
      expect(result).toEqual(allCustomComponents);
    });

    it('should handle malformed kitConfig gracefully', () => {
      const config: UiKitConfiguration = {
        kitName: 'custom',
        kitConfig: {
          components: {} as ComponentExclusionConfig,
        },
      };
      const result = getResolvedWalletComponents(config);
      expect(result).toEqual(allCustomComponents);
    });
  });
});
