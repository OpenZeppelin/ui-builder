import type { NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';

export const ICON_SIZE = 16;

export function getNetworkIconName(network: NetworkConfig): string | null {
  if (network.ecosystem === 'midnight') {
    return null;
  }
  return network.icon || network.network.toLowerCase();
}
