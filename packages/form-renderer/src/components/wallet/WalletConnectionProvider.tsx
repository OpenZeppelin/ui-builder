import React, { useCallback, useEffect, useState } from 'react';

import type { ContractAdapter } from '@openzeppelin/transaction-form-types/adapters';

import { WalletConnectionContext, WalletConnectionContextValue } from './WalletConnectionContext';

export interface WalletConnectionProviderProps {
  /**
   * The contract adapter to use for wallet connection
   */
  adapter: ContractAdapter;

  /**
   * Children to render
   */
  children: React.ReactNode;
}

/**
 * Provider component that makes wallet connection state available to its
 * children via context. This component is adapter-agnostic and works with
 * any implementation of the ContractAdapter interface.
 */
export function WalletConnectionProvider({
  adapter,
  children,
}: WalletConnectionProviderProps): React.ReactElement {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState(() =>
    adapter.getWalletConnectionStatus()
  );

  // Check if this adapter supports wallet connection
  const isSupported = adapter.supportsWalletConnection();

  // Update connection status when adapter changes
  useEffect(() => {
    setConnectionStatus(adapter.getWalletConnectionStatus());
  }, [adapter]);

  // Subscribe to wallet connection changes
  useEffect(() => {
    if (isSupported && adapter.onWalletConnectionChange) {
      const unsubscribe = adapter.onWalletConnectionChange((status) => {
        setConnectionStatus((prev) => ({
          ...prev,
          isConnected: status.isConnected,
          address: status.address,
        }));
      });
      return unsubscribe;
    }
    return undefined;
  }, [adapter, isSupported]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Wallet connection is not supported by this adapter');
      return;
    }

    setIsConnecting(true);
    setError(undefined);

    try {
      // Try to connect with the browser's injected provider (MetaMask, etc)
      // Using exact case as it appears in Wagmi: "Injected"
      const result = await adapter.connectWallet('Injected');

      if (!result.connected) {
        setError(result.error || 'Failed to connect wallet');
      }

      // Update connection status
      const newStatus = adapter.getWalletConnectionStatus();
      setConnectionStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsConnecting(false);
    }
  }, [adapter, isSupported]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (!isSupported) return;

    setIsConnecting(true);
    setError(undefined);

    try {
      const result = await adapter.disconnectWallet();

      if (!result.disconnected) {
        setError(result.error || 'Failed to disconnect wallet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsConnecting(false);
    }
  }, [adapter, isSupported]);

  // Context value
  const value: WalletConnectionContextValue = {
    isConnected: connectionStatus.isConnected,
    address: connectionStatus.address,
    chainId: connectionStatus.chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    isSupported,
    adapter,
  };

  return (
    <WalletConnectionContext.Provider value={value}>{children}</WalletConnectionContext.Provider>
  );
}
