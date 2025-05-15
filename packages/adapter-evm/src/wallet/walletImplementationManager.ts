import { appConfigService, logger } from '@openzeppelin/transaction-form-utils';

import { WagmiWalletImplementation } from './wagmi-implementation';

/**
 * Singleton instance of WagmiWalletImplementation.
 * This ensures that there's only one instance handling wallet state and configuration,
 * particularly for elements like the WalletConnect modal.
 */
let walletImplementationInstance: WagmiWalletImplementation | undefined;
let isInitializing = false;
const LOG_SYSTEM = 'EvmWalletImplementationManager';

export function getEvmWalletImplementation(): WagmiWalletImplementation {
  // If already initialized, return the instance
  if (walletImplementationInstance) {
    return walletImplementationInstance;
  }

  // Prevent recursive initialization
  if (isInitializing) {
    logger.warn(LOG_SYSTEM, 'Recursive initialization detected, returning temporary instance');
    return new WagmiWalletImplementation();
  }

  // Start initialization
  isInitializing = true;

  try {
    logger.info(LOG_SYSTEM, 'Initializing WagmiWalletImplementation singleton...');

    const currentFullConfig = appConfigService.getConfig();
    const globalServices = currentFullConfig?.globalServiceConfigs;
    const wcConfig = globalServices?.['walletconnect'];
    const projectId = wcConfig?.['projectId'] as string | undefined;

    if (!projectId) {
      logger.warn(
        LOG_SYSTEM,
        'WalletConnect Project ID not found in AppConfig. WC connector will likely be unavailable.'
      );
    }

    walletImplementationInstance = new WagmiWalletImplementation(projectId);
    logger.info(LOG_SYSTEM, 'WagmiWalletImplementation singleton created.');
  } catch (error) {
    logger.error(LOG_SYSTEM, 'Failed to initialize WagmiWalletImplementation:', error);
    walletImplementationInstance = new WagmiWalletImplementation();
  } finally {
    isInitializing = false;
  }

  return walletImplementationInstance;
}
