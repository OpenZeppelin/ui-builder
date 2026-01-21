import type { Ecosystem } from '@openzeppelin/ui-types';

import { getNetworksByEcosystem } from '@/core/ecosystemManager';

/**
 * Resolves a network ID from deep link parameters in a chain-agnostic way.
 *
 * If a concrete networkId is provided, it is returned as-is. Otherwise, if a
 * chainId is provided, it searches the networks for the given ecosystem and
 * returns the first matching network's id (by numeric equality on chainId).
 *
 * Returns null when no match can be found.
 */
export async function resolveNetworkIdFromDeepLink(
  ecosystem: Ecosystem,
  networkId: string | null,
  chainId: string | null
): Promise<string | null> {
  if (networkId) return networkId;
  if (!chainId) return null;

  try {
    const networks = await getNetworksByEcosystem(ecosystem);
    const chainIdNum = Number(chainId);
    const match = networks.find((n) => {
      const maybe = n as unknown as { chainId?: number | string };
      return typeof maybe.chainId !== 'undefined' && Number(maybe.chainId) === chainIdNum;
    });
    return match ? match.id : null;
  } catch {
    return null;
  }
}
