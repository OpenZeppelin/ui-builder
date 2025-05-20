// Assuming wagmi v2+, this is the correct provider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Config as WagmiConfig } from '@wagmi/core';
import { WagmiProvider } from 'wagmi';

import React, { useMemo } from 'react';

import type { EcosystemReactUiProviderProps } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { WagmiProviderInitializedContext } from '../context/wagmi-context';
import { getEvmWalletImplementation } from '../utils/walletImplementationManager';

// Create a single QueryClient instance to be reused
const queryClient = new QueryClient();

// Track initialization log state
let hasLoggedInitialization = false;

/**
 * Helper function to get the Wagmi configuration from the wallet implementation
 * @returns The Wagmi config object or null if there was an error
 */
const getWagmiConfig = (): WagmiConfig | null => {
  try {
    const walletImplementation = getEvmWalletImplementation();
    return walletImplementation.getConfig(); // getConfig needs to be exposed on WagmiWalletImplementation
  } catch (error) {
    logger.error('EvmBasicUiContextProvider', 'Failed to get Wagmi config:', error);
    return null;
  }
};

/**
 * React context provider for Wagmi
 * This component sets up the Wagmi and React Query providers
 */
export const EvmBasicUiContextProvider: React.FC<EcosystemReactUiProviderProps> = ({
  children,
}) => {
  // Obtain Wagmi config synchronously to ensure provider is available on first render.
  const config = useMemo<WagmiConfig | null>(() => {
    try {
      const wagmiConfig = getWagmiConfig();

      if (!wagmiConfig) {
        logger.warn(
          'EvmBasicUiContextProvider',
          'WagmiConfig not available. Wallet features may not work properly.'
        );
      } else if (!hasLoggedInitialization) {
        logger.info('EvmBasicUiContextProvider', 'WagmiProvider successfully initialized');
        hasLoggedInitialization = true;
      }

      return wagmiConfig;
    } catch (error) {
      logger.error('EvmBasicUiContextProvider', 'Failed to obtain WagmiConfig:', error);
      return null;
    }
  }, []);

  // If config is not available, render children without WagmiProvider to avoid crashing.
  if (!config) {
    return (
      <WagmiProviderInitializedContext.Provider value={false}>
        {children}
      </WagmiProviderInitializedContext.Provider>
    );
  }

  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        {/* We expose that the provider has been successfully initialised */}
        <WagmiProviderInitializedContext.Provider value={true}>
          {children}
        </WagmiProviderInitializedContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
