import type { EcosystemWalletComponents, UiKitConfiguration } from '@openzeppelin/ui-types';

// Import the actual service functions instead of using placeholders
import { getResolvedWalletComponents as getWalletComponentsFromService } from './utils/uiKitService';

// Function to get wallet components based on UiKitConfiguration
export function getResolvedWalletComponents(
  uiKitConfig: UiKitConfiguration
): EcosystemWalletComponents | undefined {
  return getWalletComponentsFromService(uiKitConfig);
}
