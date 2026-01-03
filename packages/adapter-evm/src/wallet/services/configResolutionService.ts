import type { NativeConfigLoader, UiKitConfiguration } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { resolveAndInitializeKitConfig } from '../utils';

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
  logger.debug(
    'configResolutionService:resolveFullUiKitConfiguration',
    'Starting resolution with:',
    {
      programmaticOverrides,
      initialAppServiceKitName,
      currentAppServiceConfig,
      hasLoadNativeCallback: !!options?.loadUiKitNativeConfig,
      hasCustomCode: !!programmaticOverrides.customCode,
    }
  );

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
    'configResolutionService:resolveFullUiKitConfiguration',
    'Resolved finalFullConfig:',
    finalFullConfig
  );
  return finalFullConfig;
}
