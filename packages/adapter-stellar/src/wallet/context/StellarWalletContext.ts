import type { ISupportedWallet, StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { createContext } from 'react';

import type { StellarUiKitManagerState } from '../stellar-wallets-kit';

/**
 * Stellar wallet context type
 */
export interface StellarWalletContextType {
  // Connection state
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;

  // Available wallets
  availableWallets: ISupportedWallet[];

  // Connection methods
  connect: (walletId: string) => Promise<void>;
  disconnect: () => Promise<void>;

  // UI Kit manager state
  uiKitManagerState: StellarUiKitManagerState;

  // Kit instance (for advanced usage)
  kit: StellarWalletsKit | null;
}

/**
 * Create the context with undefined default value
 */
export const StellarWalletContext = createContext<StellarWalletContextType | undefined>(undefined);
