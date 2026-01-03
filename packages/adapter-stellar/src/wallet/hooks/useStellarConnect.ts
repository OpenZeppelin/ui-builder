import type { ISupportedWallet } from '@creit.tech/stellar-wallets-kit';
import { useCallback, useState } from 'react';

import type { Connector } from '@openzeppelin/ui-types';

import { useStellarWalletContext } from '../context';

/**
 * Connect hook return type - matches what react-core expects
 */
export interface StellarConnectReturnType {
  connect: (args: { connector: Connector }) => Promise<void>;
  connectors: Connector[];
  isLoading: boolean;
  isPending: boolean;
  error: Error | null;
}

/**
 * Hook to get the wallet connect function and status
 * @returns An object with connect function and connection status
 */
export function useStellarConnect(): StellarConnectReturnType {
  const { connect, isConnecting, availableWallets } = useStellarWalletContext();
  const [error, setError] = useState<Error | null>(null);

  const connectFunction = useCallback(
    async ({ connector }: { connector: Connector }) => {
      try {
        // Clear any previous errors
        setError(null);
        await connect(connector.id);
      } catch (err) {
        // Store the error for access by the consumer
        const connectError = err instanceof Error ? err : new Error(String(err));
        setError(connectError);
        // Re-throw to maintain the same behavior for error handling in UI components
        throw connectError;
      }
    },
    [connect]
  );

  // Convert ISupportedWallet[] to Connector[]
  const connectors: Connector[] = availableWallets.map((wallet: ISupportedWallet) => ({
    id: wallet.id,
    name: wallet.name,
    icon: wallet.icon,
    installed: wallet.isAvailable,
    type: (wallet.type as string) || 'browser',
  }));

  return {
    connect: connectFunction,
    connectors,
    isLoading: isConnecting,
    isPending: isConnecting,
    error,
  };
}
