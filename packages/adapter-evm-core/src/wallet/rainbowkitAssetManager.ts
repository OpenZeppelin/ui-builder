/**
 * RainbowKit Asset Manager
 *
 * Ensures RainbowKit provider component and CSS are loaded dynamically.
 * This module provides shared asset loading functionality for all EVM-compatible adapters.
 *
 * Having the cache in core means RainbowKit assets only load once even if multiple adapters
 * (e.g., both EVM and Polkadot) are used - this is the desired behavior for optimal performance.
 *
 * @module wallet/rainbowkitAssetManager
 */

import type React from 'react';

import { logger } from '@openzeppelin/ui-utils';

import type { RainbowKitAssetsResult } from './uiKitManager';

// Re-export the type for convenience
export type { RainbowKitAssetsResult };

// Module-level cache for loaded assets
let loadedAssets: RainbowKitAssetsResult | null = null;

// Promises to ensure assets are loaded only once
let providerPromise: Promise<React.ComponentType<React.PropsWithChildren<unknown>> | null> | null =
  null;
let cssPromise: Promise<boolean> | null = null;

const LOG_PREFIX = 'RainbowKitAssetManager';

/**
 * Ensures RainbowKit provider component and CSS are loaded.
 * Loads them dynamically only once and caches the result.
 *
 * @returns A promise resolving to an object containing the ProviderComponent and cssLoaded status.
 */
export async function ensureRainbowKitAssetsLoaded(): Promise<RainbowKitAssetsResult> {
  if (loadedAssets) {
    logger.debug(LOG_PREFIX, 'Assets already loaded, returning cached.');
    return loadedAssets;
  }

  if (!providerPromise) {
    providerPromise = import('@rainbow-me/rainbowkit')
      .then((module) => {
        const component = module.RainbowKitProvider as React.ComponentType<
          React.PropsWithChildren<unknown>
        >;
        logger.info(LOG_PREFIX, 'RainbowKitProvider module loaded.');
        return component;
      })
      .catch((err) => {
        logger.error(LOG_PREFIX, 'Failed to load RainbowKitProvider module:', err);
        return null; // Resolve with null on error to allow Promise.all to complete
      });
  }

  if (!cssPromise) {
    cssPromise = import('@rainbow-me/rainbowkit/styles.css')
      .then(() => {
        logger.info(LOG_PREFIX, 'RainbowKit CSS loaded successfully.');
        return true;
      })
      .catch((err) => {
        logger.error(LOG_PREFIX, 'Failed to load RainbowKit CSS:', err);
        return false; // Resolve with false on error
      });
  }

  try {
    const [ProviderComponent, cssLoadedSuccess] = await Promise.all([providerPromise, cssPromise]);

    loadedAssets = { ProviderComponent, cssLoaded: cssLoadedSuccess };
    if (!ProviderComponent || !cssLoadedSuccess) {
      logger.warn(LOG_PREFIX, 'One or more RainbowKit assets failed to load.', loadedAssets);
      // Potentially throw here if assets are critical, or let caller decide based on null/false
    }
    return loadedAssets;
  } catch (error) {
    // This catch is for Promise.all failing, though individual catches should handle module errors.
    logger.error(LOG_PREFIX, 'Error in Promise.all for asset loading:', error);
    loadedAssets = { ProviderComponent: null, cssLoaded: false }; // Ensure loadedAssets is set
    return loadedAssets;
  }
}
