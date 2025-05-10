import { appConfigService, logger } from '@openzeppelin/transaction-form-renderer';

import { WagmiWalletImplementation } from './wagmi-implementation';

/**
 * Singleton instance of WagmiWalletImplementation.
 * This ensures that there's only one instance handling wallet state and configuration,
 * particularly for elements like the WalletConnect modal.
 */
let walletImplementationInstance: WagmiWalletImplementation | undefined;
const LOG_SYSTEM = 'EvmWalletImplementationManager';

export function getEvmWalletImplementation(): WagmiWalletImplementation {
  if (!walletImplementationInstance) {
    logger.info(LOG_SYSTEM, 'Initializing WagmiWalletImplementation singleton...');

    const currentFullConfig = appConfigService.getConfig();
    const globalServices = currentFullConfig?.globalServiceConfigs;
    const wcConfig = globalServices?.['walletconnect'];
    const projectId = wcConfig?.['projectId'] as string | undefined;

    if (!projectId) {
      logger.warn(
        LOG_SYSTEM,
        'WalletConnect Project ID not found in AppConfig. WC connector will likely be unavailable (WagmiWalletImplementation will log specifics).'
      );
    } else {
      logger.info(
        LOG_SYSTEM,
        'WalletConnect Project ID found in AppConfig, passing to WagmiWalletImplementation.'
      );
    }

    walletImplementationInstance = new WagmiWalletImplementation(projectId);
    logger.info(LOG_SYSTEM, 'WagmiWalletImplementation singleton created.');
  }
  return walletImplementationInstance;
}
