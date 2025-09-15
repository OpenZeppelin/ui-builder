import type { Connector } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import {
  getInitializedStellarWalletImplementation,
  getStellarWalletImplementation,
} from './utils/stellarWalletImplementationManager';

import { stellarUiKitManager } from './stellar-wallets-kit';
import { StellarConnectionStatusListener } from './types';

/**
 * Indicates if this adapter supports wallet connection
 * @returns Whether wallet connection is supported by this adapter
 */
export function supportsStellarWalletConnection(): boolean {
  return true;
}

/**
 * Get available Stellar wallet connectors
 */
export async function getStellarAvailableConnectors(): Promise<Connector[]> {
  const impl = await getStellarWalletImplementation();
  return impl.getAvailableConnectors();
}

/**
 * Connect to a Stellar wallet
 * @param connectorId - The ID of the wallet to connect to
 */
export async function connectStellarWallet(
  connectorId: string
): Promise<{ connected: boolean; address?: string; error?: string }> {
  const impl = await getStellarWalletImplementation();
  return impl.connect(connectorId);
}

/**
 * Disconnect from the current Stellar wallet
 */
export async function disconnectStellarWallet(): Promise<{
  disconnected: boolean;
  error?: string;
}> {
  const impl = await getStellarWalletImplementation();
  return impl.disconnect();
}

/**
 * Get the current wallet connection status
 * @inheritdoc
 */
export function getStellarWalletConnectionStatus(): {
  isConnected: boolean;
  address?: string;
  chainId?: string;
  walletId?: string;
} {
  const impl = getInitializedStellarWalletImplementation();
  if (!impl) {
    logger.warn(
      'getStellarWalletConnectionStatus',
      'Wallet implementation not ready. Returning default disconnected state.'
    );
    return {
      isConnected: false,
      address: undefined,
      chainId: stellarUiKitManager.getState().networkConfig?.id || 'stellar-testnet',
      walletId: undefined,
    };
  }

  const status = impl.getWalletConnectionStatus();
  return {
    isConnected: status.isConnected,
    address: status.address,
    chainId: typeof status.chainId === 'number' ? status.chainId.toString() : status.chainId,
    walletId: status.walletId,
  };
}

/**
 * Update the cached Stellar wallet connection state.
 * Used by provider code that derives the address directly from the kit.
 */
export function setStellarConnectedAddress(address: string | null, walletId?: string | null): void {
  const impl = getInitializedStellarWalletImplementation();
  if (impl) {
    impl.updateConnectionStatus(address, walletId);
  } else {
    logger.warn(
      'setStellarConnectedAddress',
      'Wallet implementation not ready. Cannot update connection status.'
    );
  }
}

// StellarConnectionStatusListener is now imported from the implementation file

/**
 * Subscribe to Stellar wallet connection status changes
 * @param callback Function to call when connection status changes
 * @returns Unsubscribe function
 */
export function onStellarWalletConnectionChange(
  callback: StellarConnectionStatusListener
): () => void {
  const impl = getInitializedStellarWalletImplementation();
  if (!impl) {
    logger.warn(
      'onStellarWalletConnectionChange',
      'Wallet implementation not ready. Returning no-op.'
    );
    return () => {};
  }

  // Convert from implementation status format to connection format
  return impl.onWalletConnectionChange((currentImplStatus, prevImplStatus) => {
    const currentStatus = {
      isConnected: currentImplStatus.isConnected,
      address: currentImplStatus.address,
      chainId: currentImplStatus.chainId,
      walletId: currentImplStatus.walletId,
    };
    const previousStatus = {
      isConnected: prevImplStatus.isConnected,
      address: prevImplStatus.address,
      chainId: prevImplStatus.chainId,
      walletId: prevImplStatus.walletId,
    };

    try {
      callback(currentStatus, previousStatus);
    } catch (error) {
      logger.error('Error in Stellar connection status listener:', String(error));
    }
  });
}

/**
 * Sign a transaction using the connected wallet
 * @internal
 */
export async function signTransaction(
  xdr: string,
  address: string
): Promise<{ signedTxXdr: string }> {
  const impl = await getStellarWalletImplementation();
  return impl.signTransaction(xdr, address);
}
