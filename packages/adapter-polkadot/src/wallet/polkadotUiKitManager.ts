/**
 * Polkadot UI Kit Manager
 *
 * Manages UI kit configuration for Polkadot EVM networks using the shared factory from adapter-evm-core.
 */

import {
  createUiKitManager,
  ensureRainbowKitAssetsLoaded,
  type UiKitManagerState,
} from '@openzeppelin/ui-builder-adapter-evm-core';

import { getPolkadotWalletImplementation } from './implementation';

/**
 * State interface for Polkadot UI Kit Manager.
 * This is a type alias to the shared UiKitManagerState for backwards compatibility.
 */
export type PolkadotUiKitManagerState = UiKitManagerState;

/**
 * Polkadot UI Kit Manager instance.
 * Provides state management for UI kit configuration in Polkadot adapters.
 */
export const polkadotUiKitManager = createUiKitManager({
  getWalletImplementation: () => getPolkadotWalletImplementation(),
  loadRainbowKitAssets: ensureRainbowKitAssetsLoaded,
  logPrefix: 'PolkadotUiKitManager',
});
