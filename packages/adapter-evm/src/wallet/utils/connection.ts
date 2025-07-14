import type { GetAccountReturnType } from '@wagmi/core';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import type { Connector } from '@openzeppelin/transaction-form-types';

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
): Promise<{ connected: boolean; address?: string; chainId?: number; error?: string }> {
  const impl = await getEvmWalletImplementation();
  if (!impl) {
    logger.error(LOG_SYSTEM, 'connectAndEnsureCorrectNetwork: Wallet implementation not ready.');
    return { connected: false, error: 'Wallet system not initialized.' };
  }

  const connectionResult = await impl.connect(connectorId);
  if (!connectionResult.connected || !connectionResult.address || !connectionResult.chainId) {
    return { connected: false, error: connectionResult.error || 'Connection failed' };
  }

  if (connectionResult.chainId !== targetChainId) {
    logger.info(
      LOG_SYSTEM,
      `Connected to chain ${connectionResult.chainId}, but target is ${targetChainId}. Attempting switch.`
    );
    try {
      await impl.switchNetwork(targetChainId);
      const postSwitchStatus = impl.getWalletConnectionStatus();
      if (postSwitchStatus.chainId !== targetChainId) {
        const switchError = `Failed to switch to target network ${targetChainId}. Current: ${postSwitchStatus.chainId}`;
        logger.error(LOG_SYSTEM, switchError);
        // Attempt to disconnect to leave a clean state if switch fails
        try {
          await impl.disconnect();
        } catch (e) {
          logger.warn(LOG_SYSTEM, 'Failed to disconnect after network switch failure.', e);
        }
        return { connected: false, error: switchError };
      }
      logger.info(LOG_SYSTEM, `Successfully switched to target chain ${targetChainId}.`);
      return { ...connectionResult, chainId: postSwitchStatus.chainId }; // Return updated chainId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(LOG_SYSTEM, 'Network switch failed:', errorMessage);
      // Attempt to disconnect to leave a clean state if switch fails
      try {
        await impl.disconnect();
      } catch (e) {
        logger.warn(LOG_SYSTEM, 'Failed to disconnect after network switch failure.', e);
      }
      return { connected: false, error: `Network switch failed: ${errorMessage}` };
    }
  }
  return connectionResult;
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
    return {
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      isReconnecting: false,
      status: 'disconnected',
      address: undefined,
      addresses: undefined,
      chainId: undefined,
      chain: undefined,
      connector: undefined,
    };
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
