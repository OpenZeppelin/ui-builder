/**
 * Wallet Components Utilities for Polkadot Adapter
 *
 * Provides utilities for getting resolved wallet UI components based on UI kit configuration.
 */

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

/** Service for resolving UI kit specific components and providers for the Polkadot adapter. */

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
    'PolkadotWalletComponents:getResolvedWalletComponents',
    'Received uiKitConfiguration:',
    JSON.stringify(uiKitConfiguration)
  );

  const currentKitName = uiKitConfiguration.kitName || 'custom';

  if (currentKitName === 'none') {
    logger.info(
      'PolkadotWalletComponents',
      'UI Kit set to "none" for getResolvedWalletComponents, not providing wallet components.'
    );
    return undefined;
  }

  const exclusions = getComponentExclusionsFromConfig(uiKitConfiguration.kitConfig);
  logger.debug(
    'PolkadotWalletComponents',
    `Extracted component exclusions for ${currentKitName}: ${exclusions.join(', ') || 'none'}.`
  );

  // Handle custom kit
  if (currentKitName === 'custom') {
    const allCustomComponents: EcosystemWalletComponents = {
      ConnectButton: CustomConnectButton,
      AccountDisplay: CustomAccountDisplay,
      NetworkSwitcher: CustomNetworkSwitcher,
    };
    return filterWalletComponents(allCustomComponents, exclusions, currentKitName);
  }

  // Handle RainbowKit
  if (currentKitName === 'rainbowkit') {
    const validation = validateRainbowKitConfig(uiKitConfiguration.kitConfig);

    if (!validation.isValid) {
      logger.warn(
        'PolkadotWalletComponents',
        `Invalid RainbowKit configuration for components: ${validation.error}. No components provided.`
      );
      return undefined; // Fail fast for components if config is invalid for RainbowKit
    }

    // Get RainbowKit components and apply any exclusions
    const rainbowKitComponents = createRainbowKitComponents();
    logger.info('PolkadotWalletComponents', 'Providing RainbowKit components.');
    return filterWalletComponents(rainbowKitComponents, exclusions, currentKitName);
  }

  logger.warn(
    'PolkadotWalletComponents',
    `UI Kit "${currentKitName}" for getResolvedWalletComponents not explicitly supported. No components provided.`
  );
  return undefined;
}
