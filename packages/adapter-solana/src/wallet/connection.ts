import type { Connector } from '@openzeppelin/contracts-ui-builder-types';

import type { SolanaWalletConnectionStatus } from './types';

// Assuming a Solana Wallet Implementation type might exist later
// import type { SolanaWalletImplementation } from './implementation';

// Placeholders
export function solanaSupportsWalletConnection(): boolean {
  return false;
}
export async function getSolanaAvailableConnectors(/* walletImplementation: SolanaWalletImplementation */): Promise<
  Connector[]
> {
  return [];
}
export async function connectSolanaWallet(
  _connectorId: string
  /* walletImplementation: SolanaWalletImplementation */
): Promise<{ connected: boolean; error?: string }> {
  return { connected: false, error: 'Not implemented' };
}
export async function disconnectSolanaWallet(/* walletImplementation: SolanaWalletImplementation */): Promise<{
  disconnected: boolean;
  error?: string;
}> {
  return { disconnected: true };
}
export function getSolanaWalletConnectionStatus(/* walletImplementation: SolanaWalletImplementation */): SolanaWalletConnectionStatus {
  return {
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
    isReconnecting: false,
    status: 'disconnected',
  };
}
export function onSolanaWalletConnectionChange(
  /* walletImplementation: SolanaWalletImplementation, */
  _callback: (
    currentStatus: SolanaWalletConnectionStatus,
    previousStatus: SolanaWalletConnectionStatus
  ) => void
): () => void {
  return () => {};
}
