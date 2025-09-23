import type { NativeConfigLoader, UiKitConfiguration } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

/**
 * Resolves the final, complete UiKitConfiguration for Stellar by merging various sources.
 *
 * Note: Unlike the EVM adapter, Stellar has limited UI kit options, so this is simpler.
 * We don't currently support loading native TypeScript config files for Stellar.
 *
 * @param programmaticOverrides - Overrides passed directly to the configureUiKit call.
 * @param initialAppServiceKitName - The kitName noted from AppConfigService when the adapter instance was constructed.
 * @param currentAppServiceConfig - The full UiKitConfiguration from AppConfigService, re-fetched at the time of the call.
 * @param options - Options, including the callback to load user's native config file (currently unused for Stellar).
 * @returns A Promise resolving to the final UiKitConfiguration.
 */
export async function resolveFullUiKitConfiguration(
  programmaticOverrides: Partial<UiKitConfiguration>,
  initialAppServiceKitName: UiKitConfiguration['kitName'],
  currentAppServiceConfig: UiKitConfiguration,
  options?: {
    loadUiKitNativeConfig?: NativeConfigLoader;
  }
): Promise<UiKitConfiguration> {
  logger.debug(
    'stellar:configResolutionService:resolveFullUiKitConfiguration',
    'Starting resolution with:',
    {
      programmaticOverrides,
      initialAppServiceKitName,
      currentAppServiceConfig,
      hasLoadNativeCallback: !!options?.loadUiKitNativeConfig,
    }
  );

  // Note: We currently don't support loading native TypeScript config files for Stellar
  // This could be added in the future if needed
  if (options?.loadUiKitNativeConfig) {
    logger.debug(
      'stellar:configResolutionService',
      'Native config loader provided but not currently supported for Stellar adapter'
    );
  }

  const effectiveKitName: UiKitConfiguration['kitName'] =
    programmaticOverrides.kitName ||
    currentAppServiceConfig.kitName ||
    initialAppServiceKitName ||
    'custom';

  const finalFullConfig: UiKitConfiguration = {
    kitName: effectiveKitName,
    kitConfig: {
      ...(currentAppServiceConfig.kitConfig || {}),
      ...(programmaticOverrides.kitConfig || {}),
    },
  };

  logger.debug(
    'stellar:configResolutionService:resolveFullUiKitConfiguration',
    'Resolved finalFullConfig:',
    finalFullConfig
  );

  return finalFullConfig;
}
