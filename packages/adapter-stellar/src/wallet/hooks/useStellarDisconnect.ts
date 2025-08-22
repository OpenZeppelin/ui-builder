import { useCallback, useState } from 'react';

import { useStellarWalletContext } from '../context';

/**
 * Disconnect hook return type - matches what react-core expects
 */
export interface StellarDisconnectReturnType {
  disconnect: () => Promise<void>;
  isLoading: boolean;
  isPending: boolean;
  error: Error | null;
}

/**
 * Hook to get the wallet disconnect function and status
 * @returns An object with disconnect function and disconnection status
 */
export function useStellarDisconnect(): StellarDisconnectReturnType {
  const { disconnect } = useStellarWalletContext();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const disconnectFunction = useCallback(async () => {
    try {
      // Clear any previous errors
      setError(null);
      setIsDisconnecting(true);
      await disconnect();
    } catch (err) {
      // Store the error for access by the consumer
      const disconnectError = err instanceof Error ? err : new Error(String(err));
      setError(disconnectError);
      // Re-throw to maintain the same behavior for error handling in UI components
      throw disconnectError;
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnect]);

  return {
    disconnect: disconnectFunction,
    isLoading: isDisconnecting,
    isPending: isDisconnecting,
    error,
  };
}
