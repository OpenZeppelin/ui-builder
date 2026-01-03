import type { UiKitConfiguration } from '@openzeppelin/ui-types';
import { appConfigService, logger } from '@openzeppelin/ui-utils';

/**
 * Default configuration when no specific configuration is provided
 */
const defaultConfig: UiKitConfiguration = {
  kitName: 'custom', // Default to using our custom implementation for Stellar
  kitConfig: {},
};

/**
 * Loads the initial UI kit configuration from the AppConfigService
 * @returns The UI kit configuration from app.config.local.json or defaults
 */
export function loadInitialConfigFromAppService(): UiKitConfiguration {
  logger.debug(
    'stellar:useUiKitConfig',
    'Attempting to load initial config from AppConfigService...'
  );
  const configObj = appConfigService.getWalletUIConfig<UiKitConfiguration>('stellar');

  if (configObj && configObj.kitName) {
    logger.info(
      'stellar:useUiKitConfig',
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
    'stellar:useUiKitConfig',
    'No initial config found in AppConfigService, using module default.'
  );
  return { ...defaultConfig };
}
