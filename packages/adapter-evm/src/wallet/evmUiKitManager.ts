import type { Config as WagmiConfig } from '@wagmi/core';

import type React from 'react';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import type { UiKitConfiguration } from '@openzeppelin/transaction-form-types';

import { getEvmWalletImplementation } from './utils/walletImplementationManager';

export interface EvmUiKitManagerState {
  currentFullUiKitConfig: UiKitConfiguration | null;
  wagmiConfig: WagmiConfig | null;
  kitProviderComponent: React.ComponentType<React.PropsWithChildren<unknown>> | null;
  isKitAssetsLoaded: boolean;
  isInitializing: boolean;
  error: Error | null;
}

const initialState: EvmUiKitManagerState = {
  currentFullUiKitConfig: null,
  wagmiConfig: null,
  kitProviderComponent: null,
  isKitAssetsLoaded: false,
  isInitializing: false,
  error: null,
};

let state: EvmUiKitManagerState = { ...initialState };
const listeners: Set<() => void> = new Set();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      logger.error('EvmUiKitManager', 'Error in listener:', error);
    }
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): EvmUiKitManagerState {
  return { ...state }; // Return a copy to prevent direct mutation
}

async function configure(newFullUiKitConfig: UiKitConfiguration): Promise<void> {
  logger.info('EvmUiKitManager:configure', 'Configuring UI kit. New config:', newFullUiKitConfig);

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
  const evmImpl = await getEvmWalletImplementation();
  try {
    if (newKitName === 'rainbowkit') {
      if (kitChanged || !state.kitProviderComponent || !state.isKitAssetsLoaded) {
        logger.info('EvmUiKitManager:configure', 'Ensuring RainbowKit assets are loaded...');
        const { ensureRainbowKitAssetsLoaded } = await import(
          './rainbowkit/rainbowkitAssetManager'
        );
        const rkAssets = await ensureRainbowKitAssetsLoaded();
        state.kitProviderComponent = rkAssets.ProviderComponent;
        state.isKitAssetsLoaded = rkAssets.cssLoaded && !!rkAssets.ProviderComponent;
        if (!state.isKitAssetsLoaded) {
          throw new Error('Failed to load critical RainbowKit assets.');
        }
      }
      newWagmiConfigAttempt = await evmImpl.getConfigForRainbowKit(newFullUiKitConfig);
      logger.info('EvmUiKitManager:configure', 'WagmiConfig for RainbowKit obtained.');
    } else if (newKitName === 'custom' || !newKitName) {
      newWagmiConfigAttempt = await evmImpl.getActiveConfigForManager(newFullUiKitConfig);
      logger.info('EvmUiKitManager:configure', 'ActiveConfig for custom/default obtained.');
      if (kitChanged) {
        state.kitProviderComponent = null;
        state.isKitAssetsLoaded = false;
      }
    } else {
      logger.warn('EvmUiKitManager:configure', `Unsupported kitName: ${newKitName}.`);
      state.kitProviderComponent = null;
      state.isKitAssetsLoaded = false;
    }

    state.wagmiConfig = newWagmiConfigAttempt;
    evmImpl.setActiveWagmiConfig(state.wagmiConfig);
    state.error = null;
    if (!newWagmiConfigAttempt && newKitName && newKitName !== 'none' && newKitName !== 'custom') {
      state.error = new Error(`Failed to obtain WagmiConfig for ${newKitName}`);
      logger.error('EvmUiKitManager:configure', state.error.message);
    }
  } catch (err) {
    logger.error('EvmUiKitManager:configure', 'Error during UI kit configuration process:', err);
    state.error = err instanceof Error ? err : new Error(String(err));
    state.wagmiConfig = null;
    evmImpl.setActiveWagmiConfig(null);
  } finally {
    state.isInitializing = false;
    logger.info(
      'EvmUiKitManager:configure',
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

export const evmUiKitManager = {
  getState,
  subscribe,
  configure,
};
