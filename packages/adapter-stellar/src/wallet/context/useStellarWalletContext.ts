import { useContext } from 'react';

import { StellarWalletContext, type StellarWalletContextType } from './StellarWalletContext';

/**
 * Hook to use the Stellar wallet context
 * @throws Error if used outside of StellarWalletUiRoot
 */
export function useStellarWalletContext(): StellarWalletContextType {
  const context = useContext(StellarWalletContext);

  if (context === undefined) {
    throw new Error('useStellarWalletContext must be used within a StellarWalletUiRoot');
  }

  return context;
}
