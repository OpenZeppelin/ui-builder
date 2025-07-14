import type { Connector } from '@openzeppelin/contracts-ui-builder-types';

// This file will contain facade functions that provide a clean, high-level API
// for wallet connection operations. It will use the raw functions from
// midnight-implementation.ts to orchestrate connecting, disconnecting, and
// checking wallet status.

/**
 * Checks if a Midnight-compatible wallet (Lace) is available.
 * @returns `true` if the wallet extension is detected.
 */
export const supportsMidnightWalletConnection = (): boolean => {
  return typeof window !== 'undefined' && !!window.midnight?.mnLace;
};

/**
 * Returns a list of available Midnight wallet connectors.
 * @returns An array of `Connector` objects, currently only Lace.
 */
export const getMidnightAvailableConnectors = async (): Promise<Connector[]> => {
  if (!supportsMidnightWalletConnection()) {
    return [];
  }
  return [{ id: 'mnLace', name: 'Lace (Midnight)' }];
};

/**
 * Disconnects from the Midnight wallet.
 */
export async function disconnectMidnightWallet(): Promise<{
  disconnected: boolean;
}> {
  return { disconnected: true };
}
