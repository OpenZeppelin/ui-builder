import type {
  StellarNetworkConfig,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';
import { appConfigService, logger } from '@openzeppelin/contracts-ui-builder-utils';

import { WalletsKitImplementation } from '../implementation/wallets-kit-implementation';

let walletImplementationInstance: WalletsKitImplementation | undefined;
let walletImplementationPromise: Promise<WalletsKitImplementation> | undefined;

const LOG_SYSTEM = 'StellarWalletImplementationManager';

/**
 * Get or create the singleton instance of WalletsKitImplementation.
 * This function ensures that the initialization logic runs only once.
 *
 * @param networkConfig - Optional network configuration to use for initialization
 * @returns A Promise resolving to the WalletsKitImplementation singleton
 */
export async function getStellarWalletImplementation(
  networkConfig?: StellarNetworkConfig
): Promise<WalletsKitImplementation> {
  if (walletImplementationInstance) {
    // If network config is provided and different, update it
    if (networkConfig) {
      walletImplementationInstance.setNetworkConfig(networkConfig);
    }
    return walletImplementationInstance;
  }

  if (walletImplementationPromise) {
    const instance = await walletImplementationPromise;
    // If network config is provided and different, update it
    if (networkConfig) {
      instance.setNetworkConfig(networkConfig);
    }
    return instance;
  }

  walletImplementationPromise = (async () => {
    try {
      logger.info(LOG_SYSTEM, 'Initializing StellarWalletImplementation singleton (async)...');

      // Get initial UI kit config from appConfigService
      const initialUiKitConfig = appConfigService.getTypedNestedConfig<UiKitConfiguration>(
        'walletui',
        'config'
      );

      // Create instance with provided network config or undefined
      const instance = new WalletsKitImplementation(networkConfig, initialUiKitConfig);

      logger.info(LOG_SYSTEM, 'WalletsKitImplementation singleton created (async).');
      walletImplementationInstance = instance;
      return instance;
    } catch (error) {
      logger.error(LOG_SYSTEM, 'Failed to initialize WalletsKitImplementation (async):', error);

      // Create fallback instance
      const fallbackInstance = new WalletsKitImplementation(networkConfig);
      walletImplementationInstance = fallbackInstance;
      return fallbackInstance;
    }
  })();

  return walletImplementationPromise;
}

/**
 * A synchronous getter for cases where the instance is known to be initialized.
 * Use with caution, prefer the async getter.
 *
 * This function is essential for cases where you need immediate access to the
 * wallet implementation and know it has already been initialized.
 *
 * @returns The initialized WalletsKitImplementation instance or undefined
 */
export function getInitializedStellarWalletImplementation(): WalletsKitImplementation | undefined {
  if (!walletImplementationInstance) {
    logger.warn(
      LOG_SYSTEM,
      'getInitializedStellarWalletImplementation called before instance was ready.'
    );
  }
  return walletImplementationInstance;
}

/**
 * Updates the network configuration for the wallet implementation
 * This is useful when the network changes but the implementation instance should remain the same
 *
 * @param networkConfig - The new network configuration
 */
export function updateWalletImplementationNetworkConfig(networkConfig: StellarNetworkConfig): void {
  logger.info(LOG_SYSTEM, 'Updating wallet implementation network config:', networkConfig.name);

  if (walletImplementationInstance) {
    walletImplementationInstance.setNetworkConfig(networkConfig);
  } else {
    logger.warn(
      LOG_SYSTEM,
      'Cannot update network config - wallet implementation not initialized yet'
    );
  }
}

/**
 * Resets the singleton instance (primarily for testing or cleanup)
 * Use with extreme caution in production code
 */
export function resetWalletImplementationInstance(): void {
  logger.warn(LOG_SYSTEM, 'Resetting wallet implementation singleton instance');

  if (walletImplementationInstance) {
    walletImplementationInstance.cleanup();
  }

  walletImplementationInstance = undefined;
  walletImplementationPromise = undefined;
}
