import type { UiKitConfiguration } from '@openzeppelin/ui-types';
import { appConfigService, logger } from '@openzeppelin/ui-utils';

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

export function loadInitialConfigFromAppService(): UiKitConfiguration {
  logger.debug('useUiKitConfig', 'Attempting to load initial config from AppConfigService...');
  const configObj = appConfigService.getWalletUIConfig<UiKitConfiguration>('evm');

  if (configObj && configObj.kitName) {
    logger.info(
      'useUiKitConfig',
      `Loaded initial config from AppConfigService: kitName=${configObj.kitName}`,
      configObj.kitConfig
    );
    // Merge with defaults to ensure all base keys are present if AppConfigService only provides partial config
    return {
      kitName: configObj.kitName,
      kitConfig: { ...defaultConfig.kitConfig, ...(configObj.kitConfig || {}) },
    };
  }
  logger.debug(
    'useUiKitConfig',
    'No initial config found in AppConfigService, using module default.'
  );
  return { ...defaultConfig };
}

/**
 * Updates the UI kit configuration
 * @param config The new configuration to set. This should be the fully resolved
 *               config from the adapter, potentially including user-native settings.
 */
export function setUiKitConfig(config: UiKitConfiguration): void {
  uiKitConfig = { ...config }; // Store a copy of the provided config
  logger.info(
    'useUiKitConfig:setUiKitConfig',
    `Global uiKitConfig was SET to: kitName=${uiKitConfig.kitName}`,
    `kitConfig: ${JSON.stringify(uiKitConfig.kitConfig)}`
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
  // The module-level `uiKitConfig` is updated by `loadInitialConfigFromAppService` (called at module load)
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
  // Return the direct reference to the singleton. Setters should ensure immutability if needed elsewhere.
  // For this flow, setUiKitConfig is the explicit mutator.
  return uiKitConfig;
}
