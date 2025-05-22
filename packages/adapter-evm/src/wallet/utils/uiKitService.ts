import type React from 'react';

import type {
  EcosystemReactUiProviderProps,
  EcosystemWalletComponents,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { CustomAccountDisplay, CustomConnectButton, CustomNetworkSwitcher } from '../components';
import { EvmBasicUiContextProvider } from '../provider';

// Assuming this is the default custom provider
import { filterWalletComponents } from './filterWalletComponents';

/** Service for resolving UI kit specific components and providers for the EVM adapter. */

/**
 * Determines the UI Context Provider component based on UI kit configuration.
 *
 * @param uiKitConfiguration - The UiKitConfiguration from the adapter instance.
 * @returns The React component type for the UI context provider, or undefined.
 */
export function getResolvedUiContextProvider(
  uiKitConfiguration: UiKitConfiguration
): React.ComponentType<EcosystemReactUiProviderProps> | undefined {
  const currentKitName = uiKitConfiguration.kitName || 'custom'; // Default to custom

  if (currentKitName === 'custom') {
    logger.info('uiKitService', 'Providing EvmBasicUiContextProvider for "custom" kit.');
    return EvmBasicUiContextProvider;
  }

  if (currentKitName === 'none') {
    logger.info('uiKitService', 'UI Kit set to "none", not providing a UI context provider.');
    return undefined;
  }

  // Placeholder for future specific kit logic (e.g., RainbowKit)
  // if (currentKitName === 'rainbowkit') { /* return RainbowKit provider wrapper */ }

  logger.warn(
    'uiKitService',
    `UI Kit "${currentKitName}" for UI Context Provider not explicitly supported. Defaulting to EvmBasicUiContextProvider.`
  );
  return EvmBasicUiContextProvider; // Fallback to custom/default provider
}

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
  const currentKitName = uiKitConfiguration.kitName || 'custom';

  if (currentKitName === 'none') {
    logger.info(
      'uiKitService',
      'UI Kit set to "none" for getResolvedWalletComponents, not providing wallet components.'
    );
    return undefined;
  }

  // Only provide components for 'custom' kit
  if (currentKitName === 'custom') {
    const allCustomComponents: EcosystemWalletComponents = {
      ConnectButton: CustomConnectButton,
      AccountDisplay: CustomAccountDisplay,
      NetworkSwitcher: CustomNetworkSwitcher,
    };

    let exclusions: Array<keyof EcosystemWalletComponents> = [];
    const kitCfg = uiKitConfiguration.kitConfig;
    logger.info('uiKitService', `Kit config: ${JSON.stringify(kitCfg)}.`);
    if (kitCfg && typeof kitCfg === 'object' && 'components' in kitCfg) {
      const componentsCfg = kitCfg.components;
      logger.info('uiKitService', `Components config: ${JSON.stringify(componentsCfg)}.`);
      if (
        componentsCfg &&
        typeof componentsCfg === 'object' &&
        'exclude' in componentsCfg &&
        Array.isArray(componentsCfg.exclude)
      ) {
        exclusions = (componentsCfg.exclude as Array<keyof EcosystemWalletComponents>) || [];
      }
    }

    return filterWalletComponents(allCustomComponents, exclusions, currentKitName);
  }

  // Placeholder for future specific kit logic (e.g., RainbowKit components might not use this filter directly)
  // if (currentKitName === 'rainbowkit') { /* return RainbowKit components */ }
  // if (currentKitName === 'connectkit') { /* return ConnectKit components */ }
  // if (currentKitName === 'appkit') { /* return AppKit components */ }

  logger.warn(
    'uiKitService',
    `UI Kit "${currentKitName}" for getResolvedWalletComponents not explicitly supported. No components provided.`
  );
  return undefined;
}
