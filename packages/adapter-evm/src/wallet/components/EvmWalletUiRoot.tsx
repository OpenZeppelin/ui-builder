import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http } from '@wagmi/core';
import { mainnet } from 'viem/chains';
import { WagmiProvider } from 'wagmi';
import React, { useEffect, useMemo, useState } from 'react';

import { WagmiProviderInitializedContext } from '@openzeppelin/ui-builder-adapter-evm-core';
import type { EcosystemReactUiProviderProps } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { evmUiKitManager, type EvmUiKitManagerState } from '../evmUiKitManager';
import type { RainbowKitKitConfig, RainbowKitProviderProps } from '../rainbowkit';

// Create a single QueryClient instance to be reused by EvmWalletUiRoot instances.
// This should be stable across re-renders of EvmWalletUiRoot itself.
const stableQueryClient = new QueryClient();

// Create a minimal, default WagmiConfig to use when no other config is ready.
// This ensures WagmiProvider can always be mounted with a valid config object.
// Uses mainnet as a minimal default chain with HTTP transport.
const minimalDefaultWagmiConfig = createConfig({
  chains: [mainnet], // At least one chain is required in wagmi v2.20+
  connectors: [], // Empty connectors array
  transports: {
    [mainnet.id]: http(), // Basic HTTP transport for the default chain
  },
});

export const EvmWalletUiRoot: React.FC<EcosystemReactUiProviderProps> = ({ children }) => {
  const [managerState, setManagerState] = useState<EvmUiKitManagerState>(
    evmUiKitManager.getState()
  );

  useEffect(() => {
    const handleStateChange = () => {
      setManagerState(evmUiKitManager.getState());
    };
    const unsubscribe = evmUiKitManager.subscribe(handleStateChange);
    handleStateChange();
    return unsubscribe;
  }, []); // Kept empty dep array as per previous working state of subscription

  // Memoize QueryClient to ensure stability if we ever decide to make it configurable per instance
  const queryClient = useMemo(() => stableQueryClient, []);

  const {
    wagmiConfig,
    kitProviderComponent,
    isKitAssetsLoaded,
    currentFullUiKitConfig,
    isInitializing,
    error,
  } = managerState;

  const configForWagmiProvider = wagmiConfig || minimalDefaultWagmiConfig;
  const isWagmiContextEffectivelyReady = !!wagmiConfig && !error;

  let finalChildren = children;

  // TODO: If many UI kits are added, and each requires a distinct way of being
  // rendered as a provider around `children` (beyond just passing different providerProps),
  // this conditional logic might become complex. Consider a strategy pattern or a
  // more abstract way to obtain the fully composed `innerContent` based on kitName.
  // For now, with RainbowKit and custom/default, this is manageable.
  if (
    isWagmiContextEffectivelyReady &&
    currentFullUiKitConfig?.kitName === 'rainbowkit' &&
    kitProviderComponent &&
    isKitAssetsLoaded
  ) {
    const DynKitProvider = kitProviderComponent;
    const kitConfig: RainbowKitKitConfig = currentFullUiKitConfig.kitConfig || {};

    // Pass through all provider props from the parsed config
    const providerProps: RainbowKitProviderProps = kitConfig.providerProps || {};

    logger.info(
      'EvmWalletUiRoot',
      'Wrapping children with dynamically loaded KitProvider (RainbowKit).'
    );
    finalChildren = <DynKitProvider {...providerProps}>{children}</DynKitProvider>;
  } else if (currentFullUiKitConfig?.kitName === 'rainbowkit' && !isWagmiContextEffectivelyReady) {
    logger.info(
      'EvmWalletUiRoot',
      'RainbowKit configured, but context or assets not ready. Button may show its loading/error state.'
    );
  }
  // For 'custom' kit, finalChildren also remains children.

  return (
    <WagmiProvider config={configForWagmiProvider}>
      <QueryClientProvider client={queryClient}>
        <WagmiProviderInitializedContext.Provider value={isWagmiContextEffectivelyReady}>
          {finalChildren}
          {isInitializing && (
            <div
              style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.1)',
                padding: '5px',
                borderRadius: '3px',
                fontSize: '0.8em',
              }}
            >
              Updating network...
            </div>
          )}
          {error && !wagmiConfig && (
            <div
              style={{
                position: 'fixed',
                bottom: '10px',
                left: '10px',
                background: 'red',
                color: 'white',
                padding: '10px',
              }}
            >
              Error initializing wallet provider: {error.message}
            </div>
          )}
        </WagmiProviderInitializedContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
