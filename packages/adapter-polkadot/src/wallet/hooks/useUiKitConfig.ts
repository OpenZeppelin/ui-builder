/**
 * UI Kit Configuration Hook for Polkadot Adapter
 *
 * Loads and manages UI kit configuration from AppConfigService.
 */

import type { UiKitConfiguration } from '@openzeppelin/ui-types';
import { appConfigService, logger } from '@openzeppelin/ui-utils';

/**
 * Default configuration when no specific configuration is provided
 */
const defaultConfig: UiKitConfiguration = {
  kitName: 'custom',
  kitConfig: {
    showInjectedConnector: false,
  },
};

// Singleton instance of the UI kit configuration
let uiKitConfig: UiKitConfiguration = { ...defaultConfig };

export function loadInitialConfigFromAppService(): UiKitConfiguration {
  logger.debug('PolkadotUiKitConfig', 'Attempting to load initial config from AppConfigService...');
  const configObj = appConfigService.getWalletUIConfig<UiKitConfiguration>('polkadot');

  if (configObj && configObj.kitName) {
    logger.info(
      'PolkadotUiKitConfig',
      `Loaded initial config from AppConfigService: kitName=${configObj.kitName}`,
      configObj.kitConfig
    );
    return {
      kitName: configObj.kitName,
      kitConfig: { ...defaultConfig.kitConfig, ...(configObj.kitConfig || {}) },
    };
  }

  logger.debug(
    'PolkadotUiKitConfig',
    'No valid config from AppConfigService, using defaults.',
    defaultConfig
  );
  return { ...defaultConfig };
}

/**
 * Sets the UI kit configuration
 */
export function setUiKitConfig(config: Partial<UiKitConfiguration>): void {
  uiKitConfig = {
    kitName: config.kitName ?? uiKitConfig.kitName,
    kitConfig: {
      ...uiKitConfig.kitConfig,
      ...(config.kitConfig || {}),
    },
    customCode: config.customCode,
  };
  logger.info('PolkadotUiKitConfig', 'UI Kit config updated:', uiKitConfig);
}

/**
 * Gets the current UI kit configuration
 */
export function getUiKitConfig(): UiKitConfiguration {
  return { ...uiKitConfig };
}

/**
 * Helper to check if a specific config option is enabled
 */
export function isConfigEnabled(key: string): boolean {
  return Boolean(uiKitConfig.kitConfig?.[key]);
}

/**
 * Hook to access the UI kit configuration.
 */
export function useUiKitConfig(): UiKitConfiguration {
  return getUiKitConfig();
}
