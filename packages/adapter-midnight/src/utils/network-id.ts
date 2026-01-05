import type { MidnightNetworkConfig } from '@openzeppelin/ui-types';

/**
 * Returns the numeric network ID from MidnightNetworkConfig.networkId map
 */
export function getNumericNetworkId(config: MidnightNetworkConfig): number | undefined {
  const entries = Object.entries(config.networkId || {});
  if (entries.length === 0) return undefined;
  const [numericIdStr] = entries[0] as [string, string];
  return Number(numericIdStr);
}

/**
 * Returns the enum network ID name from MidnightNetworkConfig.networkId map
 */
export function getNetworkId(config: MidnightNetworkConfig): string | undefined {
  const entries = Object.entries(config.networkId || {});
  if (entries.length === 0) return undefined;
  const [, name] = entries[0] as [string, string];
  return name;
}
