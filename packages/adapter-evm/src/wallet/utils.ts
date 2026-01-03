import type {
  EcosystemWalletComponents,
  NativeConfigLoader,
  UiKitConfiguration,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

// Import the actual service functions instead of using placeholders
import { getResolvedWalletComponents as getWalletComponentsFromService } from './utils/uiKitService';

// Function to get wallet components based on UiKitConfiguration
export function getResolvedWalletComponents(
  uiKitConfig: UiKitConfiguration
): EcosystemWalletComponents | undefined {
  return getWalletComponentsFromService(uiKitConfig);
}

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
    'resolveAndInitializeKitConfig',
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
        'resolveAndInitializeKitConfig',
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
    'resolveAndInitializeKitConfig',
    `No native or programmatic kitConfig provided for ${kitName || 'none'}. Returning null.`
  );
  return null;
}
