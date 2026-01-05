import type { EcosystemWalletComponents, UiKitConfiguration } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { CustomAccountDisplay, CustomConnectButton } from '../components';
import { StellarWalletsKitConnectButton } from '../stellar-wallets-kit';
import { filterWalletComponents, getComponentExclusionsFromConfig } from './filterWalletComponents';

/**
 * Determines the final set of wallet components to be provided by the Stellar adapter
 * based on the UI kit configuration.
 *
 * @param uiKitConfiguration - The UiKitConfiguration from the adapter instance.
 * @returns The EcosystemWalletComponents object or undefined.
 */
export function getResolvedWalletComponents(
  uiKitConfiguration: UiKitConfiguration
): EcosystemWalletComponents | undefined {
  logger.debug(
    'stellar:uiKitService:getResolvedWalletComponents',
    'Received uiKitConfiguration:',
    JSON.stringify(uiKitConfiguration)
  );

  const currentKitName = uiKitConfiguration.kitName || 'custom';

  if (currentKitName === 'none') {
    logger.info(
      'stellar:uiKitService',
      'UI Kit set to "none" for getResolvedWalletComponents, not providing wallet components.'
    );
    return undefined;
  }

  const exclusions = getComponentExclusionsFromConfig(uiKitConfiguration.kitConfig);
  logger.debug(
    'stellar:uiKitService',
    `Extracted component exclusions for ${currentKitName}: ${exclusions.join(', ') || 'none'}.`
  );

  // For 'custom' kit, we provide our custom components
  if (currentKitName === 'custom') {
    const allCustomComponents: EcosystemWalletComponents = {
      ConnectButton: CustomConnectButton,
      AccountDisplay: CustomAccountDisplay,
      // NetworkSwitcher is not included as Stellar doesn't support network switching
    };

    logger.info(
      'stellar:uiKitService',
      `Providing custom Stellar wallet components for kit: ${currentKitName}`
    );

    return filterWalletComponents(allCustomComponents, exclusions, currentKitName);
  }

  // For 'stellar-wallets-kit', use the kit's native button with built-in UI
  if (currentKitName === 'stellar-wallets-kit') {
    const stellarKitComponents: EcosystemWalletComponents = {
      ConnectButton: StellarWalletsKitConnectButton,
      // The kit's native button handles account display internally
      AccountDisplay: undefined,
    };

    logger.info('stellar:uiKitService', 'Using Stellar Wallets Kit native button');

    return stellarKitComponents;
  }

  logger.warn(
    'stellar:uiKitService',
    `UI Kit "${currentKitName}" for getResolvedWalletComponents not explicitly supported. No components provided.`
  );
  return undefined;
}
