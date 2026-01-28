/**
 * EVM Adapter RainbowKit Components
 *
 * This file exports only React components to support Fast Refresh.
 * Factory functions are in componentFactory.ts.
 */
import { createRainbowKitConnectButton } from '@openzeppelin/ui-builder-adapter-evm-core';
import type { BaseComponentProps } from '@openzeppelin/ui-types';

import { evmUiKitManager } from '../evmUiKitManager';

/**
 * Props for the RainbowKitConnectButton component.
 */
export type RainbowKitConnectButtonProps = BaseComponentProps;

/**
 * RainbowKitConnectButton component configured with the EVM UI kit manager.
 * This component lazily loads the RainbowKit ConnectButton and manages
 * its state through the evmUiKitManager.
 */
export const RainbowKitConnectButton: React.FC<RainbowKitConnectButtonProps> =
  createRainbowKitConnectButton(evmUiKitManager);
