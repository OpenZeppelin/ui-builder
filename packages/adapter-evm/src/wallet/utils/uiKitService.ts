import {
  CustomAccountDisplay,
  CustomConnectButton,
  CustomNetworkSwitcher,
  filterWalletComponents,
  getComponentExclusionsFromConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { EcosystemWalletComponents, UiKitConfiguration } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { createRainbowKitComponents, validateRainbowKitConfig } from '../rainbowkit';

/** Service for resolving UI kit specific components and providers for the EVM adapter. */

/**
 * Determines the final set of wallet components to be provided by the adapter
 * based on the UI kit configuration and any specified exclusions.
 *
 * @param uiKitConfiguration - The UiKitConfiguration from the adapter instance.
 * @returns The EcosystemWalletComponents object or undefined.
 */
export function getResolvedWalletComponents(
  uiKitConfiguration: UiKitConfiguration
): EcosystemWalletComponents | undefined {
  logger.debug(
    'uiKitService:getResolvedWalletComponents',
    'Received uiKitConfiguration:',
    JSON.stringify(uiKitConfiguration)
  );

  const currentKitName = uiKitConfiguration.kitName || 'custom';

  if (currentKitName === 'none') {
    logger.info(
      'uiKitService',
      'UI Kit set to "none" for getResolvedWalletComponents, not providing wallet components.'
    );
    return undefined;
  }

  const exclusions = getComponentExclusionsFromConfig(uiKitConfiguration.kitConfig);
  logger.debug(
    'uiKitService',
    `Extracted component exclusions for ${currentKitName}: ${exclusions.join(', ') || 'none'}.`
  );

  // TODO: If many more UI kits are added, this conditional logic could be refactored
  // using a map or strategy pattern to resolve components based on kitName.
  // For example: const componentFactory = this.kitComponentFactories[currentKitName];
  // if (componentFactory) { return filterWalletComponents(componentFactory(), exclusions, currentKitName); }
  if (currentKitName === 'custom') {
    const allCustomComponents: EcosystemWalletComponents = {
      ConnectButton: CustomConnectButton,
      AccountDisplay: CustomAccountDisplay,
      NetworkSwitcher: CustomNetworkSwitcher,
    };
    return filterWalletComponents(allCustomComponents, exclusions, currentKitName);
  }

  if (currentKitName === 'rainbowkit') {
    const validation = validateRainbowKitConfig(uiKitConfiguration.kitConfig);

    if (!validation.isValid) {
      logger.warn(
        'uiKitService',
        `Invalid RainbowKit configuration for components: ${validation.error}. No components provided.`
      );
      return undefined; // Fail fast for components if config is invalid for RainbowKit
    }

    // Get RainbowKit components and apply any exclusions
    const rainbowKitComponents = createRainbowKitComponents();
    logger.info('uiKitService', 'Providing RainbowKit components.');
    return filterWalletComponents(rainbowKitComponents, exclusions, currentKitName);
  }
  // if (currentKitName === 'connectkit') { /* return ConnectKit components */ }
  // if (currentKitName === 'appkit') { /* return AppKit components */ }
  logger.warn(
    'uiKitService',
    `UI Kit "${currentKitName}" for getResolvedWalletComponents not explicitly supported. No components provided.`
  );
  return undefined;
}
