import type { GetAccountReturnType } from '@wagmi/core';

import type { Connector } from '@openzeppelin/transaction-form-types/adapters';

import type { WagmiWalletImplementation } from '../wallet-connect/wagmi-implementation';

/**
 * Indicates if this adapter implementation supports wallet connection.
 */
export function evmSupportsWalletConnection(): boolean {
  // Currently hardcoded for Wagmi implementation
  return true;
}

/**
 * Gets the list of available wallet connectors supported by this adapter's implementation.
 */
export async function getEvmAvailableConnectors(
  walletImplementation: WagmiWalletImplementation
): Promise<Connector[]> {
  return walletImplementation.getAvailableConnectors();
}

/**
 * Initiates the wallet connection process for a specific connector.
 */
export async function connectEvmWallet(
  connectorId: string,
  walletImplementation: WagmiWalletImplementation
): Promise<{ connected: boolean; address?: string; error?: string }> {
  return walletImplementation.connect(connectorId);
}

/**
 * Disconnects the currently connected wallet.
 */
export async function disconnectEvmWallet(
  walletImplementation: WagmiWalletImplementation
): Promise<{ disconnected: boolean; error?: string }> {
  return walletImplementation.disconnect();
}

/**
 * Gets the current wallet connection status.
 */
export function getEvmWalletConnectionStatus(walletImplementation: WagmiWalletImplementation): {
  isConnected: boolean;
  address?: string;
  chainId?: string;
} {
  const status = walletImplementation.getWalletConnectionStatus();
  return {
    isConnected: status.isConnected,
    address: status.address,
    chainId: status.chainId?.toString(), // Ensure string format for interface
  };
}

/**
 * Subscribes to wallet connection changes.
 */
export function onEvmWalletConnectionChange(
  walletImplementation: WagmiWalletImplementation,
  callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
): () => void {
  return walletImplementation.onWalletConnectionChange(callback);
}
