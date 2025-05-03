import type { GetAccountReturnType } from '@wagmi/core';

// Keep for callback type consistency?
import type { Connector } from '@openzeppelin/transaction-form-types/adapters';

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
export function getSolanaWalletConnectionStatus(/* walletImplementation: SolanaWalletImplementation */): {
  isConnected: boolean;
  address?: string;
  chainId?: string;
} {
  return { isConnected: false };
}
export function onSolanaWalletConnectionChange(
  /* walletImplementation: SolanaWalletImplementation, */
  _callback: (
    account: /* Replace with Solana specific type */ GetAccountReturnType,
    prevAccount: GetAccountReturnType
  ) => void
): () => void {
  return () => {};
}
