/**
 * Wallet Module
 *
 * Wallet configuration utilities for EVM-compatible chains.
 * This module provides utilities for generating wallet UI configurations (e.g., RainbowKit)
 * and a shared wallet implementation for EVM-compatible adapters.
 *
 * Note: Execution strategies and transaction sending are in the transaction/ module
 * to match the adapter-evm directory structure.
 *
 * @module wallet
 */

// Wagmi provider context
export { WagmiProviderInitializedContext } from './context';

// Wagmi hooks
export { useIsWagmiProviderInitialized } from './hooks';

// Wagmi components
export { SafeWagmiComponent } from './components';

// Wallet UI components
export {
  CustomConnectButton,
  ConnectorDialog,
  CustomAccountDisplay,
  CustomNetworkSwitcher,
  type ConnectButtonProps,
} from './components';

// Core connection utilities
export { connectAndEnsureCorrectNetworkCore, DEFAULT_DISCONNECTED_STATUS } from './connection';

// Wallet implementation
export {
  WagmiWalletImplementation,
  type GetWagmiConfigForRainbowKitFn,
} from './wagmi-implementation';

// Wallet types
export type { WagmiWalletConfig, WagmiConfigChains, WalletNetworkConfig } from './types';

// RainbowKit configuration utilities
export {
  generateRainbowKitConfigFile,
  generateRainbowKitExportables,
  type RainbowKitConfigOptions,
  // RainbowKit types
  type AppInfo,
  type RainbowKitConnectButtonProps,
  type RainbowKitProviderProps,
  type RainbowKitKitConfig,
  type RainbowKitCustomizations,
  isRainbowKitCustomizations,
  extractRainbowKitCustomizations,
  // RainbowKit utility functions
  validateRainbowKitConfig,
  getRawUserNativeConfig,
  // RainbowKit component factories
  createRainbowKitConnectButton,
  createRainbowKitComponents,
} from './rainbowkit';

// UI Kit Manager factory
export {
  createUiKitManager,
  type UiKitManagerState,
  type UiKitManagerDependencies,
  type UiKitManager,
  type RainbowKitAssetsResult,
} from './uiKitManager';

// RainbowKit Asset Manager
export { ensureRainbowKitAssetsLoaded } from './rainbowkitAssetManager';

// Configuration Resolution
export { resolveAndInitializeKitConfig, resolveFullUiKitConfiguration } from './configResolution';

// Wallet component filtering utilities
export { filterWalletComponents, getComponentExclusionsFromConfig } from './utils';
