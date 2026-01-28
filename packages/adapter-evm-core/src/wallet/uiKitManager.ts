/**
 * UI Kit Manager Factory
 *
 * Provides a factory function to create UI kit managers for EVM-compatible adapters.
 * This shared implementation handles state management, subscriptions, and configuration
 * for UI kits like RainbowKit.
 *
 * @module wallet/uiKitManager
 */

import type { Config as WagmiConfig } from '@wagmi/core';
import type React from 'react';

import type { UiKitConfiguration } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { WagmiWalletImplementation } from './wagmi-implementation';

/**
 * State interface for UI Kit Manager.
 * Tracks the current UI kit configuration, wagmi config, and loading states.
 */
export interface UiKitManagerState {
  /** The current full UI kit configuration */
  currentFullUiKitConfig: UiKitConfiguration | null;
  /** The active wagmi configuration */
  wagmiConfig: WagmiConfig | null;
  /** The UI kit provider component (e.g., RainbowKitProvider) */
  kitProviderComponent: React.ComponentType<React.PropsWithChildren<unknown>> | null;
  /** Whether the UI kit assets have been loaded */
  isKitAssetsLoaded: boolean;
  /** Whether the manager is currently initializing */
  isInitializing: boolean;
  /** Any error that occurred during configuration */
  error: Error | null;
}

/**
 * Result type for loading RainbowKit assets.
 */
export interface RainbowKitAssetsResult {
  /** The provider component to wrap the app, or null if loading failed */
  ProviderComponent: React.ComponentType<React.PropsWithChildren<unknown>> | null;
  /** Whether CSS was loaded successfully */
  cssLoaded: boolean;
}

/**
 * Dependencies required by the UI Kit Manager factory.
 */
export interface UiKitManagerDependencies {
  /**
   * Function to get the wallet implementation.
   * Can be sync or async to support both EVM (async) and Polkadot (sync) patterns.
   */
  getWalletImplementation: () => WagmiWalletImplementation | Promise<WagmiWalletImplementation>;

  /**
   * Function to load RainbowKit assets (provider component and CSS).
   */
  loadRainbowKitAssets: () => Promise<RainbowKitAssetsResult>;

  /**
   * Log prefix for identifying the adapter in logs.
   */
  logPrefix: string;
}

/**
 * Interface for the UI Kit Manager returned by the factory.
 */
export interface UiKitManager {
  /** Get the current state */
  getState: () => UiKitManagerState;
  /** Subscribe to state changes */
  subscribe: (listener: () => void) => () => void;
  /** Configure the UI kit with new settings */
  configure: (newFullUiKitConfig: UiKitConfiguration) => Promise<void>;
}

/**
 * Creates a UI Kit Manager instance with the provided dependencies.
 *
 * @param deps - The dependencies for the UI Kit Manager
 * @returns A UI Kit Manager instance with getState, subscribe, and configure methods
 *
 * @example
 * ```typescript
 * // In adapter-evm:
 * const evmUiKitManager = createUiKitManager({
 *   getWalletImplementation: getEvmWalletImplementation,
 *   loadRainbowKitAssets: async () => {
 *     const { ensureRainbowKitAssetsLoaded } = await import('./rainbowkit/rainbowkitAssetManager');
 *     return ensureRainbowKitAssetsLoaded();
 *   },
 *   logPrefix: 'EvmUiKitManager',
 * });
 *
 * // In adapter-polkadot:
 * const polkadotUiKitManager = createUiKitManager({
 *   getWalletImplementation: () => getPolkadotWalletImplementation(),
 *   loadRainbowKitAssets: async () => {
 *     const { ensureRainbowKitAssetsLoaded } = await import('./rainbowkit/rainbowkitAssetManager');
 *     return ensureRainbowKitAssetsLoaded();
 *   },
 *   logPrefix: 'PolkadotUiKitManager',
 * });
 * ```
 */
export function createUiKitManager(deps: UiKitManagerDependencies): UiKitManager {
  const { getWalletImplementation, loadRainbowKitAssets, logPrefix } = deps;

  const initialState: UiKitManagerState = {
    currentFullUiKitConfig: null,
    wagmiConfig: null,
    kitProviderComponent: null,
    isKitAssetsLoaded: false,
    isInitializing: false,
    error: null,
  };

  let state: UiKitManagerState = { ...initialState };
  const listeners: Set<() => void> = new Set();

  function notifyListeners(): void {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        logger.error(logPrefix, 'Error in listener:', error);
      }
    });
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getState(): UiKitManagerState {
    return { ...state }; // Return a copy to prevent direct mutation
  }

  async function configure(newFullUiKitConfig: UiKitConfiguration): Promise<void> {
    logger.info(`${logPrefix}:configure`, 'Configuring UI kit. New config:', newFullUiKitConfig);

    const oldKitName = state.currentFullUiKitConfig?.kitName;
    const newKitName = newFullUiKitConfig.kitName;
    const kitChanged = oldKitName !== newKitName;

    state = {
      ...state,
      isInitializing: true,
      error: null,
      currentFullUiKitConfig: newFullUiKitConfig,
      kitProviderComponent: kitChanged ? null : state.kitProviderComponent,
      isKitAssetsLoaded: kitChanged ? false : state.isKitAssetsLoaded,
    };
    notifyListeners();

    let newWagmiConfigAttempt: WagmiConfig | null = null;
    const walletImpl = await Promise.resolve(getWalletImplementation());

    try {
      if (newKitName === 'rainbowkit') {
        if (kitChanged || !state.kitProviderComponent || !state.isKitAssetsLoaded) {
          logger.info(`${logPrefix}:configure`, 'Ensuring RainbowKit assets are loaded...');
          const rkAssets = await loadRainbowKitAssets();
          state.kitProviderComponent = rkAssets.ProviderComponent;
          state.isKitAssetsLoaded = rkAssets.cssLoaded && !!rkAssets.ProviderComponent;
          if (!state.isKitAssetsLoaded) {
            throw new Error('Failed to load critical RainbowKit assets.');
          }
        }
        newWagmiConfigAttempt = await walletImpl.getConfigForRainbowKit(newFullUiKitConfig);
        logger.info(`${logPrefix}:configure`, 'WagmiConfig for RainbowKit obtained.');
      } else if (newKitName === 'custom' || !newKitName) {
        newWagmiConfigAttempt = await walletImpl.getActiveConfigForManager(newFullUiKitConfig);
        logger.info(`${logPrefix}:configure`, 'ActiveConfig for custom/default obtained.');
        if (kitChanged) {
          state.kitProviderComponent = null;
          state.isKitAssetsLoaded = false;
        }
      } else {
        logger.warn(`${logPrefix}:configure`, `Unsupported kitName: ${newKitName}.`);
        state.kitProviderComponent = null;
        state.isKitAssetsLoaded = false;
      }

      state.wagmiConfig = newWagmiConfigAttempt;
      walletImpl.setActiveWagmiConfig(state.wagmiConfig);
      state.error = null;
      if (
        !newWagmiConfigAttempt &&
        newKitName &&
        newKitName !== 'none' &&
        newKitName !== 'custom'
      ) {
        state.error = new Error(`Failed to obtain WagmiConfig for ${newKitName}`);
        logger.error(`${logPrefix}:configure`, state.error.message);
      }
    } catch (err) {
      logger.error(`${logPrefix}:configure`, 'Error during UI kit configuration process:', err);
      state.error = err instanceof Error ? err : new Error(String(err));
      state.wagmiConfig = null;
      walletImpl.setActiveWagmiConfig(null);
    } finally {
      state.isInitializing = false;
      logger.info(
        `${logPrefix}:configure`,
        'Configuration attempt finished. Final wagmiConfig:',
        state.wagmiConfig ? 'Set' : 'Null',
        'Kit Provider Component:',
        state.kitProviderComponent ? 'Set' : 'Null',
        'Kit Assets Loaded:',
        state.isKitAssetsLoaded,
        'Error state:',
        state.error ? state.error.message : 'None'
      );
      notifyListeners();
    }
  }

  return {
    getState,
    subscribe,
    configure,
  };
}
