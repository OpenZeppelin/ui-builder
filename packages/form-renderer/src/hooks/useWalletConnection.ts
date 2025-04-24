import { useState } from 'react';

export interface WalletConnectionState {
  /**
   * Whether a wallet is connected
   */
  isConnected: boolean;

  /**
   * The connected wallet address, if any
   */
  address: string | null;

  /**
   * Function to handle wallet connection state changes
   */
  handleConnectionChange: (isConnected: boolean, address: string | null) => void;
}

/**
 * Hook for managing wallet connection state
 *
 * This is a simple hook for the demo implementation that tracks whether a wallet
 * is connected and the connected wallet address.
 *
 * @returns Wallet connection state and handlers
 */
export function useWalletConnection(): WalletConnectionState {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const handleConnectionChange = (isConnected: boolean, address: string | null): void => {
    setIsConnected(isConnected);
    setAddress(address);
  };

  return {
    isConnected,
    address,
    handleConnectionChange,
  };
}
