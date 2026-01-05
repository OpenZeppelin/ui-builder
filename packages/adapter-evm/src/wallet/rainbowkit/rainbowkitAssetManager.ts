import type React from 'react';

import { logger } from '@openzeppelin/ui-utils';

export interface RainbowKitAssets {
  ProviderComponent: React.ComponentType<React.PropsWithChildren<unknown>> | null;
  cssLoaded: boolean;
}

let loadedAssets: RainbowKitAssets | null = null;

// Promises to ensure assets are loaded only once
let providerPromise: Promise<React.ComponentType<React.PropsWithChildren<unknown>> | null> | null =
  null;
let cssPromise: Promise<boolean> | null = null;

/**
 * Ensures RainbowKit provider component and CSS are loaded.
 * Loads them dynamically only once and caches the result.
 * @returns A promise resolving to an object containing the ProviderComponent and cssLoaded status.
 */
export async function ensureRainbowKitAssetsLoaded(): Promise<RainbowKitAssets> {
  if (loadedAssets) {
    logger.debug('RainbowKitAssetManager', 'Assets already loaded, returning cached.');
    return loadedAssets;
  }

  if (!providerPromise) {
    providerPromise = import('@rainbow-me/rainbowkit')
      .then((module) => {
        const component = module.RainbowKitProvider as React.ComponentType<
          React.PropsWithChildren<unknown>
        >;
        logger.info('RainbowKitAssetManager', 'RainbowKitProvider module loaded.');
        return component;
      })
      .catch((err) => {
        logger.error('RainbowKitAssetManager', 'Failed to load RainbowKitProvider module:', err);
        return null; // Resolve with null on error to allow Promise.all to complete
      });
  }

  if (!cssPromise) {
    cssPromise = import('@rainbow-me/rainbowkit/styles.css')
      .then(() => {
        logger.info('RainbowKitAssetManager', 'RainbowKit CSS loaded successfully.');
        return true;
      })
      .catch((err) => {
        logger.error('RainbowKitAssetManager', 'Failed to load RainbowKit CSS:', err);
        return false; // Resolve with false on error
      });
  }

  try {
    const [ProviderComponent, cssLoadedSuccess] = await Promise.all([providerPromise, cssPromise]);

    loadedAssets = { ProviderComponent, cssLoaded: cssLoadedSuccess };
    if (!ProviderComponent || !cssLoadedSuccess) {
      logger.warn(
        'RainbowKitAssetManager',
        'One or more RainbowKit assets failed to load.',
        loadedAssets
      );
      // Potentially throw here if assets are critical, or let caller decide based on null/false
    }
    return loadedAssets;
  } catch (error) {
    // This catch is for Promise.all failing, though individual catches should handle module errors.
    logger.error('RainbowKitAssetManager', 'Error in Promise.all for asset loading:', error);
    loadedAssets = { ProviderComponent: null, cssLoaded: false }; // Ensure loadedAssets is set
    return loadedAssets;
  }
}
