import { allowAllModules, StellarWalletsKit, WalletNetwork } from '@creit.tech/stellar-wallets-kit';

import type {
  StellarNetworkConfig,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

export interface StellarUiKitManagerState {
  isConfigured: boolean;
  isInitializing: boolean;
  hasConfigError: boolean;
  error: Error | null;
  lastConfigError: Error | null;
  currentFullUiKitConfig: UiKitConfiguration | null;
  stellarKitProvider: StellarWalletsKit | null;
  kitProviderComponent: React.ComponentType<{ children: React.ReactNode }> | null;
  isKitAssetsLoaded: boolean;
  networkConfig: StellarNetworkConfig | null;
}

const getInitialState = (): StellarUiKitManagerState => ({
  isConfigured: false,
  isInitializing: false,
  hasConfigError: false,
  error: null,
  lastConfigError: null,
  currentFullUiKitConfig: null,
  stellarKitProvider: null,
  kitProviderComponent: null,
  isKitAssetsLoaded: false,
  networkConfig: null,
});

let state: StellarUiKitManagerState = getInitialState();

interface StellarUiKitManagerListener {
  (state: StellarUiKitManagerState): void;
}

const listeners: Set<StellarUiKitManagerListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener(state));
}

function subscribe(listener: StellarUiKitManagerListener): () => void {
  listeners.add(listener);

  // Call the listener immediately with the current state
  listener(state);

  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

function getState(): StellarUiKitManagerState {
  return state;
}

function setNetworkConfig(config: StellarNetworkConfig): void {
  state = {
    ...state,
    networkConfig: config,
  };
  notifyListeners();
}

function getWalletNetwork(networkConfig: StellarNetworkConfig | null): WalletNetwork {
  if (!networkConfig) {
    logger.warn('StellarUiKitManager', 'No network config available, defaulting to TESTNET');
    return WalletNetwork.TESTNET;
  }

  return networkConfig.type === 'mainnet' ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET;
}

async function configure(newFullUiKitConfig: UiKitConfiguration): Promise<void> {
  logger.info(
    'StellarUiKitManager:configure',
    'Configuring UI kit. New config:',
    newFullUiKitConfig
  );

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

  try {
    const walletNetwork = getWalletNetwork(state.networkConfig);

    if (newKitName === 'stellar-wallets-kit') {
      // Initialize the Stellar Wallets Kit with its built-in UI components
      const kit = new StellarWalletsKit({
        network: walletNetwork,
        selectedWalletId: undefined,
        modules: allowAllModules(), // Use all available wallet modules
      });

      state.stellarKitProvider = kit;
      // Stellar Wallets Kit provides its own modal UI that can be opened with kit.openModal()
      // We don't need to provide custom components when using the built-in UI
      state.kitProviderComponent = null;
      state.isKitAssetsLoaded = true;
      state.error = null;
      logger.info(
        'StellarUiKitManager:configure',
        'Stellar Wallets Kit configured with built-in UI and all wallet modules'
      );
    } else if (newKitName === 'custom' || !newKitName) {
      // Initialize the Stellar Wallets Kit for custom UI mode
      const kit = new StellarWalletsKit({
        network: walletNetwork,
        selectedWalletId: undefined,
        modules: allowAllModules(),
      });

      state.stellarKitProvider = kit;
      state.kitProviderComponent = null;
      state.isKitAssetsLoaded = true;
      state.error = null;
      logger.info(
        'StellarUiKitManager:configure',
        'Stellar Wallets Kit configured for custom UI components'
      );
    } else if (newKitName === 'none') {
      // No wallet UI kit
      state.stellarKitProvider = null;
      state.kitProviderComponent = null;
      state.isKitAssetsLoaded = false;
      state.error = null;
      logger.info('StellarUiKitManager:configure', 'UI kit set to "none", no wallet UI provided');
    } else {
      throw new Error(`Unknown UI kit name: ${newKitName}`);
    }

    state = {
      ...state,
      isConfigured: true,
      isInitializing: false,
      hasConfigError: false,
      error: null,
    };
    notifyListeners();
  } catch (error) {
    logger.error('StellarUiKitManager:configure', 'Failed to configure UI kit:', error);
    state = {
      ...state,
      isInitializing: false,
      hasConfigError: true,
      error: error instanceof Error ? error : new Error('Failed to configure UI kit'),
      lastConfigError: error instanceof Error ? error : new Error('Failed to configure UI kit'),
      isConfigured: false,
    };
    notifyListeners();
    throw error;
  }
}

export const stellarUiKitManager = {
  configure,
  getState,
  subscribe,
  setNetworkConfig,
};
