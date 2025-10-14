import { useContext } from 'react';

import { MidnightWalletContext, MidnightWalletContextType } from '../context/MidnightWalletContext';

/**
 * Custom hook to access the Midnight wallet context.
 *
 * @returns The wallet context, including state and actions.
 * @throws If used outside of a `MidnightWalletUiRoot`.
 */
export const useMidnightWallet = (): MidnightWalletContextType => {
  const context = useContext(MidnightWalletContext);
  if (context === undefined) {
    throw new Error(
      'useMidnightWallet must be used within a MidnightWalletUiRoot.\n' +
      'MidnightWalletUiRoot is the context provider for the Midnight wallet. ' +
      'Wrap your component tree with <MidnightWalletUiRoot> (import from "packages/adapter-midnight/src/wallet/components/MidnightWalletUiRoot") ' +
      'to provide access to the wallet context.'
    );
  }
  return context;
};
