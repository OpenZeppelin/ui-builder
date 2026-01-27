import type { GetAccountReturnType } from '@wagmi/core';

import {
  connectAndEnsureCorrectNetworkCore,
  DEFAULT_DISCONNECTED_STATUS,
  type EvmWalletConnectionResult,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { Connector } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import {
  getEvmWalletImplementation,
  getInitializedEvmWalletImplementation,
} from './walletImplementationManager';

const LOG_SYSTEM = 'adapter-evm-connection';

/**
 * Indicates if this adapter implementation supports wallet connection.
 */
export function evmSupportsWalletConnection(): boolean {
  // For now, assume EVM always supports wallet connection if wagmi can be initialized.
  // This might depend on walletConnectProjectId being available for WalletConnect to be viable.
  return true;
}

/**
 * Gets the list of available wallet connectors supported by this adapter's implementation.
 */
export async function getEvmAvailableConnectors(): Promise<Connector[]> {
  const impl = await getEvmWalletImplementation();
  if (!impl) {
    logger.warn(LOG_SYSTEM, 'getEvmAvailableConnectors: Wallet implementation not ready.');
    return [];
  }
  return impl.getAvailableConnectors();
}

/**
 * Initiates the wallet connection process for a specific connector and ensures the network is correct.
 *
 * @param connectorId - The ID of the connector to use.
 * @param targetChainId - The desired chain ID to switch to after connection.
 * @returns An object containing connection status, address, and any error.
 */
export async function connectAndEnsureCorrectNetwork(
  connectorId: string,
  targetChainId: number
): Promise<EvmWalletConnectionResult> {
  const impl = await getEvmWalletImplementation();
  if (!impl) {
    logger.error(LOG_SYSTEM, 'connectAndEnsureCorrectNetwork: Wallet implementation not ready.');
    return { connected: false, error: 'Wallet system not initialized.' };
  }

  return connectAndEnsureCorrectNetworkCore(impl, connectorId, targetChainId, LOG_SYSTEM);
}

/**
 * Disconnects the currently connected EVM wallet.
 */
export async function disconnectEvmWallet(): Promise<{
  disconnected: boolean;
  error?: string;
}> {
  const impl = await getEvmWalletImplementation();
  if (!impl) {
    logger.warn(LOG_SYSTEM, 'disconnectEvmWallet: Wallet implementation not ready.');
    return { disconnected: false, error: 'Wallet system not initialized.' };
  }
  return impl.disconnect();
}

/**
 * Gets the current wallet connection status.
 * This function might need to become async if getEvmWalletImplementation is async
 * and the status depends on an initialized instance.
 * For now, assuming getWalletConnectionStatus on the impl is synchronous after init.
 */
export function getEvmWalletConnectionStatus(): GetAccountReturnType {
  const impl = getInitializedEvmWalletImplementation();
  if (!impl) {
    logger.warn(
      LOG_SYSTEM,
      'getEvmWalletConnectionStatus: Wallet implementation not ready. Returning default disconnected state.'
    );
    return DEFAULT_DISCONNECTED_STATUS;
  }
  return impl.getWalletConnectionStatus();
}

/**
 * Subscribes to wallet connection changes.
 */
export function onEvmWalletConnectionChange(
  callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
): () => void {
  // Return type is now synchronous () => void
  const walletImplementation = getInitializedEvmWalletImplementation(); // Use sync getter
  if (!walletImplementation) {
    logger.warn(
      'onEvmWalletConnectionChange',
      'Wallet implementation not initialized. Cannot subscribe to changes. Returning no-op.'
    );
    return () => {}; // Return a no-op unsubscribe function
  }
  return walletImplementation.onWalletConnectionChange(callback);
}
