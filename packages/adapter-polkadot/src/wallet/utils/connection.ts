/**
 * Wallet Connection Utilities for Polkadot Adapter
 *
 * Provides utility functions for wallet connection, disconnection, and status management.
 * Uses shared connection logic from adapter-evm-core.
 */

import type { GetAccountReturnType } from '@wagmi/core';

import {
  connectAndEnsureCorrectNetworkCore,
  DEFAULT_DISCONNECTED_STATUS,
  type EvmWalletConnectionResult,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { Connector } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { getPolkadotWalletImplementation } from '../implementation';

const LOG_SYSTEM = 'adapter-polkadot-connection';

/**
 * Indicates if this adapter implementation supports wallet connection.
 */
export function polkadotSupportsWalletConnection(): boolean {
  return true;
}

/**
 * Gets the list of available wallet connectors.
 */
export async function getPolkadotAvailableConnectors(): Promise<Connector[]> {
  const impl = getPolkadotWalletImplementation();
  if (!impl.isReady()) {
    logger.warn(LOG_SYSTEM, 'getPolkadotAvailableConnectors: Wallet implementation not ready.');
    return [];
  }
  return impl.getAvailableConnectors();
}

/**
 * Initiates the wallet connection process and ensures the network is correct.
 */
export async function connectAndEnsureCorrectNetwork(
  connectorId: string,
  targetChainId: number
): Promise<EvmWalletConnectionResult> {
  const impl = getPolkadotWalletImplementation();
  if (!impl.isReady()) {
    logger.error(LOG_SYSTEM, 'connectAndEnsureCorrectNetwork: Wallet implementation not ready.');
    return { connected: false, error: 'Wallet system not initialized.' };
  }

  return connectAndEnsureCorrectNetworkCore(impl, connectorId, targetChainId, LOG_SYSTEM);
}

/**
 * Disconnects the currently connected wallet.
 */
export async function disconnectPolkadotWallet(): Promise<{
  disconnected: boolean;
  error?: string;
}> {
  const impl = getPolkadotWalletImplementation();
  if (!impl.isReady()) {
    logger.warn(LOG_SYSTEM, 'disconnectPolkadotWallet: Wallet implementation not ready.');
    return { disconnected: false, error: 'Wallet system not initialized.' };
  }
  return impl.disconnect();
}

/**
 * Gets the current wallet connection status.
 */
export function getPolkadotWalletConnectionStatus(): GetAccountReturnType {
  const impl = getPolkadotWalletImplementation();
  if (!impl.isReady()) {
    logger.warn(
      LOG_SYSTEM,
      'getPolkadotWalletConnectionStatus: Wallet implementation not ready. Returning default disconnected state.'
    );
    return DEFAULT_DISCONNECTED_STATUS;
  }
  return impl.getWalletConnectionStatus();
}

/**
 * Subscribes to wallet connection changes.
 */
export function onPolkadotWalletConnectionChange(
  callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
): () => void {
  const impl = getPolkadotWalletImplementation();
  if (!impl.isReady()) {
    logger.warn(
      LOG_SYSTEM,
      'onPolkadotWalletConnectionChange: Wallet implementation not initialized. Returning no-op.'
    );
    return () => {};
  }
  return impl.onWalletConnectionChange(callback);
}
