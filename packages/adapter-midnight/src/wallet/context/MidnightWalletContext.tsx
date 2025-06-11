import type { DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

import { createContext } from 'react';

/**
 * Defines the shape of the state and actions for the Midnight wallet context.
 */
export interface MidnightWalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address?: string;
  api: DAppConnectorWalletAPI | null;
  error: Error | null;
  connect: () => void;
  disconnect: () => Promise<void>;
}

/**
 * React Context for the Midnight wallet.
 *
 * It's initialized with `undefined` and will be provided a value by `MidnightWalletProvider`.
 * A custom hook (`useMidnightWallet`) will ensure the context is accessed correctly
 * within the provider's component tree.
 */
export const MidnightWalletContext = createContext<MidnightWalletContextType | undefined>(
  undefined
);
