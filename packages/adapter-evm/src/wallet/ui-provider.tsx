// Assuming wagmi v2+, this is the correct provider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Config as WagmiConfig } from '@wagmi/core';
import { WagmiProvider } from 'wagmi';

import React from 'react';

import type { EcosystemReactUiProviderProps } from '@openzeppelin/transaction-form-types';

import { getEvmWalletImplementation } from './walletImplementationManager';

// Create a single QueryClient instance to be reused
const queryClient = new QueryClient();

let wagmiConfigInstance: WagmiConfig | null = null;

const getWagmiConfig = (): WagmiConfig => {
  if (!wagmiConfigInstance) {
    const walletImplementation = getEvmWalletImplementation();
    wagmiConfigInstance = walletImplementation.getConfig(); // getConfig needs to be exposed on WagmiWalletImplementation
  }
  if (!wagmiConfigInstance) {
    // This case should ideally not be reached if WagmiWalletImplementation is correctly initialized before UI rendering.
    throw new Error(
      'WagmiConfig not available. Ensure WagmiWalletImplementation is initialized and getConfig is exposed.'
    );
  }
  return wagmiConfigInstance;
};

export const EvmBasicUiContextProvider: React.FC<EcosystemReactUiProviderProps> = ({
  children,
}) => {
  // Ensure config is fetched/available when the provider mounts
  // This might throw if config is not ready, which could be handled by an ErrorBoundary higher up if needed.
  const config = getWagmiConfig();

  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};
