import { describe, expect, it, vi } from 'vitest';

import type { UiKitConfiguration, UiKitName } from '@openzeppelin/ui-builder-types';

import { resolveFullUiKitConfiguration } from '../configResolutionService';

describe('configResolutionService', () => {
  describe('resolveFullUiKitConfiguration', () => {
    it('should use programmatic overrides as highest priority', async () => {
      const programmaticOverrides: Partial<UiKitConfiguration> = {
        kitName: 'stellar-wallets-kit',
        kitConfig: {
          showInjectedConnector: true,
          components: {
            exclude: ['NetworkSwitcher'],
          },
        },
      };

      const initialAppServiceKitName = 'custom';
      const currentAppServiceConfig: UiKitConfiguration = {
        kitName: 'none',
        kitConfig: {
          showInjectedConnector: false,
        },
      };

      const result = await resolveFullUiKitConfiguration(
        programmaticOverrides,
        initialAppServiceKitName,
        currentAppServiceConfig
      );

      expect(result).toEqual({
        kitName: 'stellar-wallets-kit',
        kitConfig: {
          showInjectedConnector: true,
          components: {
            exclude: ['NetworkSwitcher'],
          },
        },
      });
    });

    it('should use current app service config when no programmatic overrides', async () => {
      const initialAppServiceKitName = 'custom';
      const currentAppServiceConfig: UiKitConfiguration = {
        kitName: 'stellar-wallets-kit',
        kitConfig: {
          showInjectedConnector: true,
        },
      };

      const result = await resolveFullUiKitConfiguration(
        {},
        initialAppServiceKitName,
        currentAppServiceConfig
      );

      expect(result).toEqual(currentAppServiceConfig);
    });

    it('should use initial app service kit name as fallback', async () => {
      const initialAppServiceKitName = 'stellar-wallets-kit';
      const currentAppServiceConfig: UiKitConfiguration = {
        kitName: undefined as unknown as UiKitName,
        kitConfig: {},
      };

      const result = await resolveFullUiKitConfiguration(
        {},
        initialAppServiceKitName,
        currentAppServiceConfig
      );

      expect(result).toEqual({
        kitName: 'stellar-wallets-kit',
        kitConfig: {},
      });
    });

    it('should default to custom when no kit name is available', async () => {
      const result = await resolveFullUiKitConfiguration({}, undefined, {
        kitName: undefined as unknown as UiKitName,
        kitConfig: {},
      });

      expect(result).toEqual({
        kitName: 'custom',
        kitConfig: {},
      });
    });

    it('should merge kit configs with programmatic overrides taking precedence', async () => {
      const programmaticOverrides: Partial<UiKitConfiguration> = {
        kitConfig: {
          showInjectedConnector: true,
          components: {
            exclude: ['AccountDisplay'],
          },
        },
      };

      const currentAppServiceConfig: UiKitConfiguration = {
        kitName: 'custom',
        kitConfig: {
          showInjectedConnector: false,
          components: {
            exclude: ['NetworkSwitcher'],
          },
          appName: 'Test App',
        },
      };

      const result = await resolveFullUiKitConfiguration(
        programmaticOverrides,
        'custom',
        currentAppServiceConfig
      );

      expect(result).toEqual({
        kitName: 'custom',
        kitConfig: {
          showInjectedConnector: true,
          components: {
            exclude: ['AccountDisplay'],
          },
          appName: 'Test App',
        },
      });
    });

    it('should log debug message when native config loader is provided', async () => {
      const mockNativeConfigLoader = vi.fn();
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      await resolveFullUiKitConfiguration(
        {},
        'custom',
        { kitName: 'custom', kitConfig: {} },
        { loadUiKitNativeConfig: mockNativeConfigLoader }
      );

      // Verify the native config loader is acknowledged but not called
      expect(mockNativeConfigLoader).not.toHaveBeenCalled();

      debugSpy.mockRestore();
    });

    it('should handle empty kit configs gracefully', async () => {
      const result = await resolveFullUiKitConfiguration(
        { kitName: 'stellar-wallets-kit' },
        'custom',
        { kitName: 'custom', kitConfig: undefined as Record<string, unknown> | undefined }
      );

      expect(result).toEqual({
        kitName: 'stellar-wallets-kit',
        kitConfig: {},
      });
    });
  });
});
