import type { WagmiWalletImplementation } from '@openzeppelin/ui-builder-adapter-evm-core';
import type { UiKitConfiguration } from '@openzeppelin/ui-types';
import { appConfigService, logger } from '@openzeppelin/ui-utils';

import { createEvmWalletImplementation } from '../implementation/wagmi-implementation';

let walletImplementationInstance: WagmiWalletImplementation | undefined;
let walletImplementationPromise: Promise<WagmiWalletImplementation> | undefined;

const LOG_SYSTEM = 'EvmWalletImplementationManager';

/**
 * Get or create the singleton instance of WagmiWalletImplementation.
 * This function ensures that the initialization logic runs only once.
 *
 * @returns A Promise resolving to the WagmiWalletImplementation singleton
 */
export async function getEvmWalletImplementation(): Promise<WagmiWalletImplementation> {
  if (walletImplementationInstance) {
    return walletImplementationInstance;
  }

  if (walletImplementationPromise) {
    return walletImplementationPromise;
  }

  walletImplementationPromise = (async () => {
    try {
      logger.info(LOG_SYSTEM, 'Initializing WagmiWalletImplementation singleton (async)... ');
      // Get appName and projectId from appConfigService for RainbowKit
      // This assumes appConfigService is initialized before this manager is first called.
      const initialUiKitConfig = appConfigService.getTypedNestedConfig<UiKitConfiguration>(
        'walletui',
        'config'
      );

      const wcProjectId = appConfigService.getGlobalServiceParam('walletconnect', 'projectId') as
        | string
        | undefined;

      // Use factory function for proper EVM configuration
      const instance = createEvmWalletImplementation(wcProjectId, initialUiKitConfig);
      logger.info(LOG_SYSTEM, 'WagmiWalletImplementation singleton created (async).');
      walletImplementationInstance = instance;
      return instance;
    } catch (error) {
      logger.error(LOG_SYSTEM, 'Failed to initialize WagmiWalletImplementation (async):', error);
      const fallbackInstance = createEvmWalletImplementation();
      walletImplementationInstance = fallbackInstance;
      return fallbackInstance;
    }
  })();

  return walletImplementationPromise;
}

// Optional: A synchronous getter for cases where the instance is known to be initialized.
// Use with caution, prefer the async getter.
export function getInitializedEvmWalletImplementation(): WagmiWalletImplementation | undefined {
  if (!walletImplementationInstance) {
    logger.warn(
      LOG_SYSTEM,
      'getInitializedEvmWalletImplementation called before instance was ready.'
    );
  }
  return walletImplementationInstance;
}
