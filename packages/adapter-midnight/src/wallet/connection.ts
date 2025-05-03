import type { Connector } from '@openzeppelin/transaction-form-types/adapters';

/**
 * Indicates if this adapter supports wallet connection
 * @returns Whether wallet connection is supported by this adapter
 */
export function supportsMidnightWalletConnection(): boolean {
  return false; // Midnight adapter does not support wallet connection yet
}

export async function getMidnightAvailableConnectors(): Promise<Connector[]> {
  return [];
}

export async function connectMidnightWallet(
  _connectorId: string
): Promise<{ connected: boolean; address?: string; error?: string }> {
  return { connected: false, error: 'Midnight adapter does not support wallet connection.' };
}

export async function disconnectMidnightWallet(): Promise<{
  disconnected: boolean;
  error?: string;
}> {
  return { disconnected: false, error: 'Midnight adapter does not support wallet connection.' };
}

/**
 * @inheritdoc
 */
export function getMidnightWalletConnectionStatus(): {
  isConnected: boolean;
  address?: string;
  chainId?: string;
} {
  // Stub implementation: Always return disconnected status
  return { isConnected: false };
}

// Placeholder for optional connection change listener
export const onMidnightWalletConnectionChange: undefined = undefined;
