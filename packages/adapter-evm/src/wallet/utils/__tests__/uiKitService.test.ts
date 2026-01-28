import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CustomAccountDisplay,
  CustomConnectButton,
  CustomNetworkSwitcher,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { ComponentExclusionConfig, UiKitConfiguration } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { getResolvedWalletComponents } from '../uiKitService';

// Mock the logger
vi.mock('@openzeppelin/ui-utils', () => ({
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

  describe('getResolvedWalletComponents', () => {
    const allCustomComponents = {
      ConnectButton: CustomConnectButton,
      AccountDisplay: CustomAccountDisplay,
      NetworkSwitcher: CustomNetworkSwitcher,
    };

    it('should return undefined for "none" kit', () => {
      const config: UiKitConfiguration = { kitName: 'none', kitConfig: {} };
      const result = getResolvedWalletComponents(config);
      expect(result).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        'uiKitService',
        'UI Kit set to "none" for getResolvedWalletComponents, not providing wallet components.'
      );
    });

    it('should return all components for "custom" kit without exclusions', () => {
      const config: UiKitConfiguration = { kitName: 'custom', kitConfig: {} };
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
        kitConfig: {},
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
