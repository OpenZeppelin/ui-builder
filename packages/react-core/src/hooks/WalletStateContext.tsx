import React, { createContext } from 'react';

import type {
  ContractAdapter,
  EcosystemSpecificReactHooks,
  NetworkConfig,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';

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
  reconfigureActiveAdapterUiKit: (uiKitConfig?: Partial<UiKitConfiguration>) => void;
}

export const WalletStateContext = createContext<WalletStateContextValue | undefined>(undefined);

// Hook to easily consume the context
export function useWalletState(): WalletStateContextValue {
  const context = React.useContext(WalletStateContext);
  if (context === undefined) {
    throw new Error('useWalletState must be used within a WalletStateProvider');
  }
  return context;
}
