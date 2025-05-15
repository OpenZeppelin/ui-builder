// Assuming wagmi v2+, this is the correct provider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Config as WagmiConfig } from '@wagmi/core';
import { WagmiProvider } from 'wagmi';

import React, { useEffect, useState } from 'react';

import type { EcosystemReactUiProviderProps } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { WagmiProviderInitializedContext } from './index';
import { getEvmWalletImplementation } from './walletImplementationManager';

// Create a single QueryClient instance to be reused
const queryClient = new QueryClient();

// Track initialization log state
let hasLoggedInitialization = false;

const getWagmiConfig = (): WagmiConfig | null => {
  try {
    const walletImplementation = getEvmWalletImplementation();
    return walletImplementation.getConfig(); // getConfig needs to be exposed on WagmiWalletImplementation
  } catch (error) {
    logger.error('EvmBasicUiContextProvider', 'Failed to get Wagmi config:', error);
    return null;
  }
};

export const EvmBasicUiContextProvider: React.FC<EcosystemReactUiProviderProps> = ({
  children,
}) => {
  // Use state to safely handle async config initialization
  const [config, setConfig] = useState<WagmiConfig | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [providerInitialized, setProviderInitialized] = useState(false);

  // Initialize provider once on mount
  useEffect(() => {
    // Skip if already initialized or has error
    if (providerInitialized || error) {
      return;
    }

    try {
      const wagmiConfig = getWagmiConfig();
      setConfig(wagmiConfig);

      if (!wagmiConfig) {
        logger.warn(
          'EvmBasicUiContextProvider',
          'WagmiConfig not available. Wallet features may not work properly.'
        );
      } else {
        // Mark as initialized only when we have a valid config
        setProviderInitialized(true);

        // Only log initialization once
        if (!hasLoggedInitialization) {
          logger.info('EvmBasicUiContextProvider', 'WagmiProvider successfully initialized');
          hasLoggedInitialization = true;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error initializing WagmiProvider'));
      logger.error('EvmBasicUiContextProvider', 'Error initializing WagmiProvider:', err);
    }
  }, [providerInitialized, error]);

  // If we have an error or no config, render without the providers to avoid crashing
  if (error || !config) {
    logger.warn(
      'EvmBasicUiContextProvider',
      'Rendering without WagmiProvider due to missing config'
    );
    // Still provide the context with value false
    return (
      <WagmiProviderInitializedContext.Provider value={false}>
        {children}
      </WagmiProviderInitializedContext.Provider>
    );
  }

  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <WagmiProviderInitializedContext.Provider value={providerInitialized}>
          {children}
        </WagmiProviderInitializedContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
