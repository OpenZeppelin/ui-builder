import { describe, expect, it, vi } from 'vitest';

import type { UiKitConfiguration } from '@openzeppelin/ui-builder-types';

describe('handleUiKitConfigUpdate', () => {
  it('should only trigger runtime UI update when kitName or kitConfig changes', () => {
    const onUiKitConfigUpdated = vi.fn();
    const onFormConfigUpdated = vi.fn();

    // Simulate the handleUiKitConfigUpdate logic
    const handleUiKitConfigUpdate = (
      config: UiKitConfiguration,
      currentConfig?: UiKitConfiguration
    ) => {
      const runtimeConfig: UiKitConfiguration = {
        kitName: config.kitName,
        kitConfig: config.kitConfig,
      };

      if (
        currentConfig?.kitName !== runtimeConfig.kitName ||
        JSON.stringify(currentConfig?.kitConfig) !== JSON.stringify(runtimeConfig.kitConfig)
      ) {
        onUiKitConfigUpdated(runtimeConfig);
      }

      onFormConfigUpdated({ uiKitConfig: config });
    };

    // Test 1: Initial config update should trigger both
    const config1: UiKitConfiguration = {
      kitName: 'rainbowkit',
      kitConfig: { appName: 'Test App' },
      customCode: 'const theme = darkTheme();',
    };

    handleUiKitConfigUpdate(config1, undefined);

    expect(onUiKitConfigUpdated).toHaveBeenCalledWith({
      kitName: 'rainbowkit',
      kitConfig: { appName: 'Test App' },
    });
    expect(onFormConfigUpdated).toHaveBeenCalledWith({ uiKitConfig: config1 });

    // Test 2: Updating only customCode should NOT trigger runtime update
    onUiKitConfigUpdated.mockClear();
    onFormConfigUpdated.mockClear();

    const config2: UiKitConfiguration = {
      ...config1,
      customCode: 'const theme = lightTheme();', // Only customCode changed
    };

    handleUiKitConfigUpdate(config2, config1);

    expect(onUiKitConfigUpdated).not.toHaveBeenCalled(); // Should NOT be called
    expect(onFormConfigUpdated).toHaveBeenCalledWith({ uiKitConfig: config2 });

    // Test 3: Updating kitName should trigger runtime update
    onUiKitConfigUpdated.mockClear();
    onFormConfigUpdated.mockClear();

    const config3: UiKitConfiguration = {
      ...config2,
      kitName: 'connectkit',
    };

    handleUiKitConfigUpdate(config3, config2);

    expect(onUiKitConfigUpdated).toHaveBeenCalledWith({
      kitName: 'connectkit',
      kitConfig: { appName: 'Test App' },
    });
    expect(onFormConfigUpdated).toHaveBeenCalledWith({ uiKitConfig: config3 });
  });

  it('should exclude customCode from runtime configuration', () => {
    const onUiKitConfigUpdated = vi.fn();
    const onFormConfigUpdated = vi.fn();

    const handleUiKitConfigUpdate = (config: UiKitConfiguration) => {
      const runtimeConfig: UiKitConfiguration = {
        kitName: config.kitName,
        kitConfig: config.kitConfig,
      };

      onUiKitConfigUpdated(runtimeConfig);
      onFormConfigUpdated({ uiKitConfig: config });
    };

    const configWithCustomCode: UiKitConfiguration = {
      kitName: 'rainbowkit',
      kitConfig: { appName: 'Test App' },
      customCode: `
        import { darkTheme } from '@rainbow-me/rainbowkit';
        export default {
          theme: darkTheme(),
        };
      `,
    };

    handleUiKitConfigUpdate(configWithCustomCode);

    // Runtime config should NOT have customCode
    expect(onUiKitConfigUpdated).toHaveBeenCalledWith({
      kitName: 'rainbowkit',
      kitConfig: { appName: 'Test App' },
    });

    // Form config should have everything including customCode
    expect(onFormConfigUpdated).toHaveBeenCalledWith({
      uiKitConfig: configWithCustomCode,
    });

    // Verify customCode is not in runtime config
    const runtimeCall = onUiKitConfigUpdated.mock.calls[0][0];
    expect(runtimeCall).not.toHaveProperty('customCode');
  });
});
