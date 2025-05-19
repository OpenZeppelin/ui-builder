import type { UiKitConfiguration } from '@openzeppelin/transaction-form-types';
import { appConfigService, logger } from '@openzeppelin/transaction-form-utils';

/**
 * Default configuration when no specific configuration is provided
 */
const defaultConfig: UiKitConfiguration = {
  kitName: 'custom', // Default to using our custom implementation for EVM
  kitConfig: {
    showInjectedConnector: false, // Default to hiding the injected connector
  },
};

// Singleton instance of the UI kit configuration
let uiKitConfig: UiKitConfiguration = { ...defaultConfig };

/**
 * Loads wallet UI configuration from AppConfigService
 * @returns True if configuration was loaded from AppConfigService, false otherwise
 */
export function loadConfigFromAppConfig(): boolean {
  try {
    logger.debug('useUiKitConfig', 'Loading configuration from AppConfigService...');

    // Use the new typed helper method to get the config
    const configObj = appConfigService.getTypedNestedConfig<UiKitConfiguration>(
      'walletui',
      'config'
    );

    // Log the configuration
    logger.debug('useUiKitConfig', 'Configuration from AppConfigService:', configObj);

    // Check if we received a valid configuration
    if (configObj) {
      // Update our configuration with the loaded values
      uiKitConfig = {
        // Use values from the loaded config or fall back to defaults
        kitName: configObj.kitName || defaultConfig.kitName,
        kitConfig: {
          ...defaultConfig.kitConfig,
          // Add any values from the loaded kitConfig
          ...(configObj.kitConfig || {}),
        },
      };

      logger.info(
        'useUiKitConfig',
        `UI Kit configuration loaded from AppConfigService: kitName=${uiKitConfig.kitName}, showInjectedConnector=${uiKitConfig.kitConfig?.showInjectedConnector}`
      );

      return true;
    }

    logger.debug('useUiKitConfig', 'No valid configuration found in AppConfigService');
    return false;
  } catch (error) {
    logger.warn(
      'useUiKitConfig',
      'Error loading UI kit configuration from AppConfigService:',
      error
    );
    return false;
  }
}

// Try to initialize configuration from AppConfigService when the module loads
// This may not succeed if AppConfigService isn't initialized yet
loadConfigFromAppConfig();

/**
 * Updates the UI kit configuration
 * @param config The new configuration to set
 */
export function setUiKitConfig(config: UiKitConfiguration): void {
  // First try to load from AppConfigService to ensure we have the latest config
  loadConfigFromAppConfig();

  // Then apply the provided configuration, but keep existing kitConfig values
  // that were loaded from AppConfigService if they're not being explicitly overridden
  const existingKitConfig = uiKitConfig.kitConfig || {};
  const newKitConfig = config.kitConfig || {};

  uiKitConfig = {
    kitName: config.kitName || uiKitConfig.kitName || defaultConfig.kitName,
    kitConfig: {
      ...defaultConfig.kitConfig,
      ...existingKitConfig,
      ...newKitConfig,
    },
  };

  logger.info(
    'EvmAdapter',
    `UI Kit configured for adapter instance: ${uiKitConfig.kitName}`,
    uiKitConfig.kitConfig ? JSON.stringify(uiKitConfig.kitConfig) : '(no specific kitConfig)'
  );
}

/**
 * Helper to check if a specific config option is enabled
 * @param key The configuration key to check
 * @returns True if the configuration option is enabled, false otherwise
 */
export function isConfigEnabled(key: string): boolean {
  return Boolean(uiKitConfig.kitConfig?.[key]);
}

/**
 * Hook to access the UI kit configuration.
 * The configuration is typically loaded at module initialization and when `setUiKitConfig` is called.
 * @returns The current UI kit configuration (module-level singleton).
 */
export function useUiKitConfig(): UiKitConfiguration {
  // The module-level `uiKitConfig` is updated by `loadConfigFromAppConfig` (called at module load)
  // and `setUiKitConfig` (called by adapter's configureUiKit).
  // Thus, this hook can simply return the current state of the module-level singleton.
  return uiKitConfig;
}

/**
 * Getter function to access the current module-level UI kit configuration directly.
 * Useful for initializing adapter instance configurations.
 * @returns The current module-level UI kit configuration.
 */
export function getUiKitConfig(): UiKitConfiguration {
  return { ...uiKitConfig }; // Return a copy to prevent direct mutation of the singleton
}
