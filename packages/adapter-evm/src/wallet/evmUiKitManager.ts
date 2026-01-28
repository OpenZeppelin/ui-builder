/**
 * EVM UI Kit Manager
 *
 * Manages UI kit configuration for EVM networks using the shared factory from adapter-evm-core.
 */

import {
  createUiKitManager,
  ensureRainbowKitAssetsLoaded,
  type UiKitManagerState,
} from '@openzeppelin/ui-builder-adapter-evm-core';

import { getEvmWalletImplementation } from './utils/walletImplementationManager';

/**
 * State interface for EVM UI Kit Manager.
 * This is a type alias to the shared UiKitManagerState for backwards compatibility.
 */
export type EvmUiKitManagerState = UiKitManagerState;

/**
 * EVM UI Kit Manager instance.
 * Provides state management for UI kit configuration in EVM adapters.
 */
export const evmUiKitManager = createUiKitManager({
  getWalletImplementation: getEvmWalletImplementation,
  loadRainbowKitAssets: ensureRainbowKitAssetsLoaded,
  logPrefix: 'EvmUiKitManager',
});
