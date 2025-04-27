import { useContext } from 'react';

import { WalletConnectionContext, WalletConnectionContextValue } from './WalletConnectionContext';

/**
 * Hook to use the wallet connection context
 * @returns Wallet connection context value
 * @throws Error if used outside of a WalletConnectionProvider
 */
export function useWalletConnection(): WalletConnectionContextValue {
  const context = useContext(WalletConnectionContext);

  if (context === undefined) {
    throw new Error('useWalletConnection must be used within a WalletConnectionProvider');
  }

  return context;
}
