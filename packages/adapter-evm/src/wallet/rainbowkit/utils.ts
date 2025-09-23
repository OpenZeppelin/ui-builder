import type { UiKitConfiguration } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

/**
 * RainbowKit configuration options definition
 */

/**
 * Validates the RainbowKit configuration to ensure required fields are present.
 *
 * @param kitConfig - The RainbowKit configuration object
 * @returns Object containing the validation result and any missing fields or error message
 */
export function validateRainbowKitConfig(kitConfig?: UiKitConfiguration['kitConfig']): {
  isValid: boolean;
  missingFields?: string[];
  error?: string;
} {
  // Detailed log to inspect the received kitConfig
  logger.debug(
    'validateRainbowKitConfig',
    'Received kitConfig for validation:',
    JSON.stringify(kitConfig)
  );

  if (!kitConfig) {
    logger.warn('validateRainbowKitConfig', 'Validation failed: No kitConfig provided.');
    return { isValid: false, error: 'No kitConfig provided for RainbowKit' };
  }

  // kitConfig is the fully resolved configuration object which should contain wagmiParams and providerProps.
  // Access wagmiParams from within kitConfig.
  const wagmiParamsFromKitConfig = (kitConfig as Record<string, unknown>).wagmiParams as
    | Record<string, unknown>
    | undefined;

  if (
    !wagmiParamsFromKitConfig ||
    typeof wagmiParamsFromKitConfig !== 'object' ||
    wagmiParamsFromKitConfig === null
  ) {
    logger.warn(
      'validateRainbowKitConfig',
      'Validation failed: kitConfig.wagmiParams is missing or invalid.',
      { wagmiParamsFromKitConfig }
    );
    return { isValid: false, error: 'kitConfig.wagmiParams is missing or not a valid object' };
  }

  const missingFields: string[] = [];
  if (
    !('appName' in wagmiParamsFromKitConfig) ||
    typeof wagmiParamsFromKitConfig.appName !== 'string'
  ) {
    missingFields.push('wagmiParams.appName');
  }
  if (
    !('projectId' in wagmiParamsFromKitConfig) ||
    typeof wagmiParamsFromKitConfig.projectId !== 'string'
  ) {
    missingFields.push('wagmiParams.projectId');
  }

  if (missingFields.length > 0) {
    const errorMsg = `Missing or invalid required fields in wagmiParams: ${missingFields.join(', ')}`;
    logger.warn('validateRainbowKitConfig', 'Validation failed:', errorMsg, { missingFields });
    return {
      isValid: false,
      missingFields,
      error: errorMsg,
    };
  }
  logger.debug('validateRainbowKitConfig', 'Validation successful.');
  return { isValid: true };
}

/**
 * Extracts and type-guards a RainbowKit configuration from a UiKitConfiguration
 *
 * @param config The UI kit configuration
 * @returns The raw kitConfig Record<string, unknown> or undefined.
 */
export function getRawUserNativeConfig(
  config: UiKitConfiguration
): Record<string, unknown> | undefined {
  if (config.kitName !== 'rainbowkit' || !config.kitConfig) {
    return undefined;
  }
  // kitConfig is already expected to be Record<string, unknown> or undefined by UiKitConfiguration type.
  // We just ensure it's not null and is an object here for safety if it were `any` somewhere up the chain.
  if (typeof config.kitConfig === 'object' && config.kitConfig !== null) {
    return config.kitConfig as Record<string, unknown>;
  }
  logger.warn('rainbowkit/utils', 'kitConfig for RainbowKit is not a valid object.');
  return undefined;
}
