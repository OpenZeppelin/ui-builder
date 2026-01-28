/**
 * Configuration Resolution Module
 *
 * Provides utilities for resolving and merging UI kit configurations
 * from various sources (native config files, programmatic overrides, app service).
 *
 * @module configResolution
 */

import type { NativeConfigLoader, UiKitConfiguration } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

const LOG_PREFIX = 'ConfigResolutionService';

/**
 * Resolves and initializes the kit-specific configuration.
 * This function acts as a manager to call the appropriate kit's configuration initializer.
 *
 * @param kitName The name of the UI kit (e.g., 'rainbowkit').
 * @param programmaticKitConfig Optional base/programmatic config passed to the kit initializer.
 * @param loadConfigModule Optional generic callback to load configuration modules by path.
 * @returns A Promise resolving to the final kitConfig (Record<string, unknown>) for the specified kit, or null.
 */
export async function resolveAndInitializeKitConfig(
  kitName?: string, // kitName is used to construct the path to the conventional config file
  programmaticKitConfig?: Record<string, unknown>,
  loadConfigModule?: NativeConfigLoader
): Promise<Record<string, unknown> | null> {
  logger.debug(
    `${LOG_PREFIX}:resolveAndInitializeKitConfig`,
    `Resolving native config for kit: ${kitName || 'none'}`,
    {
      hasProgrammaticKitConfig: !!programmaticKitConfig,
      hasLoadConfigModule: !!loadConfigModule,
    }
  );

  let userNativeConfig: Record<string, unknown> | null = null;

  // Only attempt to load a native config if a kitName is provided and a loader function exists.
  // And the kitName is not 'custom' or 'none' as those typically don't have dedicated native config files.
  if (kitName && kitName !== 'custom' && kitName !== 'none' && loadConfigModule) {
    const conventionalConfigPath = `./config/wallet/${kitName}.config.ts`;

    try {
      userNativeConfig = await loadConfigModule(conventionalConfigPath);
    } catch (error) {
      logger.warn(
        `${LOG_PREFIX}:resolveAndInitializeKitConfig`,
        `Call to load native config for ${kitName} from ${conventionalConfigPath} failed. Error:`,
        error
      );
    }
  }

  // Merge the loaded user native config with the programmatically passed kitConfig.
  // Programmatic config can override or augment the native file's settings.
  if (userNativeConfig && programmaticKitConfig) {
    const mergedConfig = { ...userNativeConfig, ...programmaticKitConfig };
    return mergedConfig;
  } else if (userNativeConfig) {
    return userNativeConfig;
  } else if (programmaticKitConfig) {
    return programmaticKitConfig;
  }

  logger.debug(
    `${LOG_PREFIX}:resolveAndInitializeKitConfig`,
    `No native or programmatic kitConfig provided for ${kitName || 'none'}. Returning null.`
  );
  return null;
}

/**
 * Resolves the final, complete UiKitConfiguration by merging various sources.
 *
 * @param programmaticOverrides - Overrides passed directly to the configureUiKit call.
 * @param initialAppServiceKitName - The kitName noted from AppConfigService when the adapter instance was constructed.
 * @param currentAppServiceConfig - The full UiKitConfiguration from AppConfigService, re-fetched at the time of the call.
 * @param options - Options, including the callback to load user's native config file.
 * @returns A Promise resolving to the final UiKitConfiguration.
 */
export async function resolveFullUiKitConfiguration(
  programmaticOverrides: Partial<UiKitConfiguration>,
  initialAppServiceKitName: UiKitConfiguration['kitName'],
  currentAppServiceConfig: UiKitConfiguration, // This is the result of loadInitialConfigFromAppService()
  options?: {
    loadUiKitNativeConfig?: NativeConfigLoader;
  }
): Promise<UiKitConfiguration> {
  logger.debug(`${LOG_PREFIX}:resolveFullUiKitConfiguration`, 'Starting resolution with:', {
    programmaticOverrides,
    initialAppServiceKitName,
    currentAppServiceConfig,
    hasLoadNativeCallback: !!options?.loadUiKitNativeConfig,
    hasCustomCode: !!programmaticOverrides.customCode,
  });

  const effectiveKitName: UiKitConfiguration['kitName'] =
    programmaticOverrides.kitName ||
    initialAppServiceKitName ||
    currentAppServiceConfig.kitName ||
    'custom';

  // Resolve from native config file (if loader is provided)
  const resolvedUserNativeAndProgrammaticKitConfig = await resolveAndInitializeKitConfig(
    effectiveKitName,
    programmaticOverrides.kitConfig,
    options?.loadUiKitNativeConfig
  );

  const finalFullConfig: UiKitConfiguration = {
    kitName: effectiveKitName,
    kitConfig: {
      ...(currentAppServiceConfig.kitConfig || {}),
      ...(resolvedUserNativeAndProgrammaticKitConfig || {}),
      // customCode is NOT applied to runtime config
    },
    // Pass through customCode for export purposes only
    customCode: programmaticOverrides.customCode,
  };

  logger.debug(
    `${LOG_PREFIX}:resolveFullUiKitConfiguration`,
    'Resolved finalFullConfig:',
    finalFullConfig
  );
  return finalFullConfig;
}
