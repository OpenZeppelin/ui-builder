import type { BaseComponentProps, EcosystemWalletComponents } from '@openzeppelin/ui-types';

/**
 * Creates the complete set of RainbowKit wallet components.
 *
 * This factory function accepts a RainbowKitConnectButton component that has been
 * created with an adapter-specific UI kit manager. This allows different adapters
 * to use their own manager instance while sharing the component creation logic.
 *
 * @param RainbowKitConnectButton - The connect button component created via createRainbowKitConnectButton
 * @returns An object containing all RainbowKit wallet components
 *
 * @example
 * ```typescript
 * // In adapter-evm:
 * import { createRainbowKitConnectButton, createRainbowKitComponents } from '@openzeppelin/ui-builder-adapter-evm-core';
 * import { evmUiKitManager } from './evmUiKitManager';
 *
 * const RainbowKitConnectButton = createRainbowKitConnectButton(evmUiKitManager);
 * const components = createRainbowKitComponents(RainbowKitConnectButton);
 *
 * // In adapter-polkadot:
 * import { createRainbowKitConnectButton, createRainbowKitComponents } from '@openzeppelin/ui-builder-adapter-evm-core';
 * import { polkadotUiKitManager } from './polkadotUiKitManager';
 *
 * const RainbowKitConnectButton = createRainbowKitConnectButton(polkadotUiKitManager);
 * const components = createRainbowKitComponents(RainbowKitConnectButton);
 * ```
 */
export function createRainbowKitComponents(
  RainbowKitConnectButton: React.ComponentType<BaseComponentProps>
): EcosystemWalletComponents {
  return {
    ConnectButton: RainbowKitConnectButton,
    // RainbowKit's ConnectButton is comprehensive and typically includes account display
    // So we don't provide separate AccountDisplay or NetworkSwitcher components
  };
}
