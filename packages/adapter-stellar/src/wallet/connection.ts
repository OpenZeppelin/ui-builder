import type { Connector } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Indicates if this adapter supports wallet connection
 * @returns Whether wallet connection is supported by this adapter
 */
export function supportsStellarWalletConnection(): boolean {
  return false; // Stellar wallet connection not yet implemented
}

export async function getStellarAvailableConnectors(): Promise<Connector[]> {
  return [];
}

export async function connectStellarWallet(
  _connectorId: string
): Promise<{ connected: boolean; address?: string; error?: string }> {
  return { connected: false, error: 'Stellar adapter does not support wallet connection.' };
}

export async function disconnectStellarWallet(): Promise<{
  disconnected: boolean;
  error?: string;
}> {
  return { disconnected: false, error: 'Stellar adapter does not support wallet connection.' };
}

/**
 * @inheritdoc
 */
export function getStellarWalletConnectionStatus(): {
  isConnected: boolean;
  address?: string;
  chainId?: string;
} {
  // Stub implementation: Always return disconnected status
  return { isConnected: false };
}
