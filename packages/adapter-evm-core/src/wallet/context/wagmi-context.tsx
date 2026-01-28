import { createContext } from 'react';

/**
 * Context to track Wagmi provider initialization status
 * Used by components to safely render when the provider is ready
 */
export const WagmiProviderInitializedContext = createContext<boolean>(false);
