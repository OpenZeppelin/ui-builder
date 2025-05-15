import { useContext } from 'react';

import { WagmiProviderInitializedContext } from '../context/wagmi-context';

/**
 * Hook to check if WagmiProvider is ready
 * @returns boolean indicating if the provider is initialized
 */
export const useIsWagmiProviderInitialized = (): boolean => {
  return useContext(WagmiProviderInitializedContext);
};
