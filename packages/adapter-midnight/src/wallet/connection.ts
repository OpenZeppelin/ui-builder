/**
 * Midnight Wallet Connection Facade
 *
 * High-level API for Midnight wallet connection and status management.
 *
 * ARCHITECTURE:
 * - This module provides a facade over the LaceWalletImplementation.
 * - UI components call these functions; they delegate to the singleton wallet implementation.
 * - Event-driven architecture: callers subscribe to onMidnightWalletConnectionChange.
 *
 * DESIGN DECISIONS:
 * 1. **Event Emulation**
 *    - Lace DAppConnectorWalletAPI lacks native onAccountChange events.
 *    - LaceWalletImplementation emulates events by polling api.state().
 *    - Consumers use onMidnightWalletConnectionChange as if native events existed.
 *
 * 2. **Singleton Implementation**
 *    - getMidnightWalletImplementation() returns a single shared instance.
 *    - Ensures consistent state across all UI components.
 *
 * 3. **Lazy Initialization**
 *    - getInitializedMidnightWalletImplementation() returns undefined if not yet ready.
 *    - Used for non-blocking status checks.
 *
 * MIRRORS STELLAR ADAPTER:
 * - This architecture directly mirrors adapter-stellar/src/wallet/connection.ts.
 * - Provides consistent UX and API surface across ecosystem adapters.
 */

import type { Connector } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { LaceWalletImplementation } from './implementation/lace-implementation';

import type { MidnightWalletConnectionStatus } from './types';
import {
  getInitializedMidnightWalletImplementation,
  getMidnightWalletImplementation,
} from './utils';

/**
 * Indicates if this adapter supports wallet connection
 */
export const supportsMidnightWalletConnection = (): boolean => {
  return typeof window !== 'undefined' && !!window.midnight?.mnLace;
};

/**
 * Get available Midnight wallet connectors
 */
export const getMidnightAvailableConnectors = async (): Promise<Connector[]> => {
  if (!supportsMidnightWalletConnection()) {
    return [];
  }
  return [{ id: 'mnLace', name: 'Lace (Midnight)' }];
};

/**
 * Disconnect from the Midnight wallet
 */
export async function disconnectMidnightWallet(): Promise<{
  disconnected: boolean;
}> {
  try {
    const impl = await getMidnightWalletImplementation();
    impl.disconnect();
    return { disconnected: true };
  } catch (error) {
    logger.warn('disconnectMidnightWallet', 'Unexpected error during disconnect', error);
    return { disconnected: false };
  }
}

/**
 * Subscribe to Midnight wallet connection (account) changes
 * @returns unsubscribe function
 */
export function getMidnightWalletConnectionStatus(): MidnightWalletConnectionStatus {
  const impl = getInitializedMidnightWalletImplementation();
  if (!impl) {
    return { isConnected: false, status: 'disconnected' } as MidnightWalletConnectionStatus;
  }
  return impl.getWalletConnectionStatus();
}

export function onMidnightWalletConnectionChange(
  callback: (current: MidnightWalletConnectionStatus, prev: MidnightWalletConnectionStatus) => void
): () => void {
  const initialized = getInitializedMidnightWalletImplementation();
  const impl = initialized || new LaceWalletImplementation();
  return impl.onWalletConnectionChange(callback);
}
