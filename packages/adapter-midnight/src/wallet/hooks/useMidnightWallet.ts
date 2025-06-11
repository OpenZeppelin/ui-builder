import { useContext } from 'react';

import { MidnightWalletContext, MidnightWalletContextType } from '../context/MidnightWalletContext';

/**
 * Custom hook to access the Midnight wallet context.
 *
 * @returns The wallet context, including state and actions.
 * @throws If used outside of a `MidnightWalletProvider`.
 */
export const useMidnightWallet = (): MidnightWalletContextType => {
  const context = useContext(MidnightWalletContext);
  if (context === undefined) {
    throw new Error('useMidnightWallet must be used within a MidnightWalletProvider');
  }
  return context;
};
