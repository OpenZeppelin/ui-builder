import React from 'react';

import type {
  EcosystemReactUiProviderProps,
  EcosystemWalletComponents,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { CustomAccountDisplay, CustomConnectButton, CustomNetworkSwitcher } from '../components';
import { EvmBasicUiContextProvider } from '../provider';
import {
  createRainbowKitComponents,
  createRainbowKitUIProvider,
  validateRainbowKitConfig,
} from '../rainbowkit';

// Assuming this is the default custom provider
import { filterWalletComponents, getComponentExclusionsFromConfig } from './filterWalletComponents';

/** Service for resolving UI kit specific components and providers for the EVM adapter. */

/**
 * IMPORTANT NOTE FOR RAINBOWKIT USERS:
 * If 'rainbowkit' is chosen as the `kitName`, the consuming application (e.g., `core` or an exported app)
 * MUST globally import RainbowKit's CSS file for styles to be applied correctly:
 * `import '@rainbow-me/rainbowkit/styles.css';`
 * This is typically done in the main application entry point (e.g., App.tsx, main.tsx).
 */

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

  if (currentKitName === 'rainbowkit') {
    const validation = validateRainbowKitConfig(uiKitConfiguration.kitConfig);

    if (!validation.isValid) {
      logger.warn(
        'uiKitService',
        `Invalid RainbowKit configuration: ${validation.error}. Falling back to EvmBasicUiContextProvider.`
      );
      return EvmBasicUiContextProvider;
    }

    return createRainbowKitUIProvider(uiKitConfiguration);
  }

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

  const exclusions = getComponentExclusionsFromConfig(uiKitConfiguration.kitConfig);
  logger.info(
    'uiKitService',
    `Extracted component exclusions for ${currentKitName}: ${exclusions.join(', ') || 'none'}.`
  );

  // Only provide components for 'custom' kit
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
        `Invalid RainbowKit configuration: ${validation.error}. No components provided.`
      );
      return undefined;
    }

    // Get RainbowKit components and apply any exclusions
    const rainbowKitComponents = createRainbowKitComponents();
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
