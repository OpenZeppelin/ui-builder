import { useContext } from 'react';

import { WagmiProviderInitializedContext } from './wagmi-context';

// Hook to check if WagmiProvider is ready
export const useIsWagmiProviderInitialized = (): boolean => {
  return useContext(WagmiProviderInitializedContext);
};
