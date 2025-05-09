import { createContext } from 'react';

import type { ContractAdapter } from '@openzeppelin/transaction-form-types';

export interface WalletConnectionContextValue {
  /**
   * Whether a wallet is connected
   */
  isConnected: boolean;

  /**
   * The connected wallet address, if any
   */
  address?: string;

  /**
   * The connected chain ID, if available
   */
  chainId?: string;

  /**
   * Whether the wallet connection is currently in progress
   */
  isConnecting: boolean;

  /**
   * Any error that occurred during wallet connection
   */
  error?: string;

  /**
   * Connect the wallet
   */
  connect: () => Promise<void>;

  /**
   * Disconnect the wallet
   */
  disconnect: () => Promise<void>;

  /**
   * Whether wallet connection is supported by the current adapter
   */
  isSupported: boolean;

  /**
   * The adapter instance being used
   */
  adapter: ContractAdapter;
}

export const WalletConnectionContext = createContext<WalletConnectionContextValue | undefined>(
  undefined
);
