/**
 * Polkadot Adapter RainbowKit Components
 *
 * This file exports only React components to support Fast Refresh.
 * Factory functions are in componentFactory.ts.
 */
import { createRainbowKitConnectButton } from '@openzeppelin/ui-builder-adapter-evm-core';
import type { BaseComponentProps } from '@openzeppelin/ui-types';

import { polkadotUiKitManager } from '../polkadotUiKitManager';

/**
 * Props for the RainbowKitConnectButton component.
 */
export type RainbowKitConnectButtonProps = BaseComponentProps;

/**
 * RainbowKitConnectButton component configured with the Polkadot UI kit manager.
 * This component lazily loads the RainbowKit ConnectButton and manages
 * its state through the polkadotUiKitManager.
 */
export const RainbowKitConnectButton: React.FC<RainbowKitConnectButtonProps> =
  createRainbowKitConnectButton(polkadotUiKitManager);
