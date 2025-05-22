import type { EcosystemWalletComponents } from '@openzeppelin/transaction-form-types';

import { RainbowKitConnectButton } from './components';

/**
 * Creates the complete set of RainbowKit wallet components.
 *
 * @returns An object containing all RainbowKit wallet components
 */
export function createRainbowKitComponents(): EcosystemWalletComponents {
  return {
    ConnectButton: RainbowKitConnectButton,
    // RainbowKit's ConnectButton is comprehensive and typically includes account display
    // So we don't provide separate AccountDisplay or NetworkSwitcher components
  };
}
