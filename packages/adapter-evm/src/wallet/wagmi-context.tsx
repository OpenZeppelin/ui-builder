import { createContext } from 'react';

// Create a context to track provider initialization status
export const WagmiProviderInitializedContext = createContext<boolean>(false);
