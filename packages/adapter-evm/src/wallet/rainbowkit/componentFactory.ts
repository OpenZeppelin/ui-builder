/**
 * EVM Adapter RainbowKit Component Factory
 *
 * Factory function for creating RainbowKit components.
 * Separated from components.tsx to support React Fast Refresh.
 */
import { createRainbowKitComponents as coreCreateRainbowKitComponents } from '@openzeppelin/ui-builder-adapter-evm-core';

import { RainbowKitConnectButton } from './components';

/**
 * Creates the complete set of RainbowKit wallet components for the EVM adapter.
 *
 * @returns An object containing all RainbowKit wallet components
 */
export function createRainbowKitComponents() {
  return coreCreateRainbowKitComponents(RainbowKitConnectButton);
}
