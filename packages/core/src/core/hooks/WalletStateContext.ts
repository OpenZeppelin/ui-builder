import React, { createContext } from 'react';

import type {
  ContractAdapter,
  EcosystemSpecificReactHooks,
  NetworkConfig,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

export interface WalletStateContextValue {
  // Globally selected network state
  activeNetworkId: string | null;
  setActiveNetworkId: (networkId: string | null) => void;
  activeNetworkConfig: NetworkConfig | null;

  // Active adapter state
  activeAdapter: ContractAdapter | null;
  isAdapterLoading: boolean;

  // Facade hooks object from the active adapter
  // Consumers will call these hooks (e.g., walletFacadeHooks.useAccount())
  walletFacadeHooks: EcosystemSpecificReactHooks | null;
}

export const WalletStateContext = createContext<WalletStateContextValue | null>(null);

// Hook to easily consume the context
export function useWalletState(): WalletStateContextValue {
  const context = React.useContext(WalletStateContext);
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(
        'WalletStateContext',
        'useWalletState was called outside of the WalletStateProvider tree. Returning default/non-functional state.'
      );
    }
    return {
      activeNetworkId: null,
      setActiveNetworkId: () => {
        if (process.env.NODE_ENV === 'development') {
          logger.debug(
            'WalletStateContext',
            'Attempted to call setActiveNetworkId outside WalletStateProvider'
          );
        }
      },
      activeNetworkConfig: null,
      activeAdapter: null,
      isAdapterLoading: false,
      walletFacadeHooks: null, // Consumers must check if this is null before using
    };
  }
  return context;
}
