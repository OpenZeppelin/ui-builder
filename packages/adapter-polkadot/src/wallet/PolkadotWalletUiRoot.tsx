/**
 * @fileoverview Polkadot-specific WalletUiRoot component.
 *
 * Provides wallet connectivity for Polkadot ecosystem EVM-compatible networks
 * including Hub networks and parachains (Moonbeam, Moonriver).
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http } from '@wagmi/core';
import { mainnet } from 'viem/chains';
import { WagmiProvider } from 'wagmi';
import React, { useEffect, useMemo, useState } from 'react';

import { WagmiProviderInitializedContext } from '@openzeppelin/ui-builder-adapter-evm-core';
import type { EcosystemReactUiProviderProps } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { polkadotUiKitManager, type PolkadotUiKitManagerState } from './polkadotUiKitManager';
import type { RainbowKitKitConfig, RainbowKitProviderProps } from './rainbowkit';

/**
 * Props for the PolkadotWalletUiRoot component.
 */
export type PolkadotWalletUiRootProps = EcosystemReactUiProviderProps;

// Create a single QueryClient instance to be reused
const stableQueryClient = new QueryClient();

// Create a minimal, default WagmiConfig to use when no other config is ready.
// This ensures WagmiProvider can always be mounted with a valid config object.
const minimalDefaultWagmiConfig = createConfig({
  chains: [mainnet], // At least one chain is required in wagmi v2.20+
  connectors: [],
  transports: {
    [mainnet.id]: http(),
  },
});

/**
 * Polkadot ecosystem wallet UI root component.
 *
 * This component provides wallet connectivity for Polkadot ecosystem
 * EVM-compatible networks. It wraps children with WagmiProvider and
 * QueryClientProvider configured for Polkadot Hub and parachain networks.
 *
 * When RainbowKit is configured, it wraps children with RainbowKitProvider
 * to enable the RainbowKit UI components.
 *
 * @example
 * ```tsx
 * import { PolkadotWalletUiRoot } from '@openzeppelin/ui-builder-adapter-polkadot';
 *
 * function App() {
 *   return (
 *     <PolkadotWalletUiRoot>
 *       <YourAppContent />
 *     </PolkadotWalletUiRoot>
 *   );
 * }
 * ```
 *
 * @remarks
 * The component pre-configures all Polkadot ecosystem EVM networks by default:
 * - Hub networks: Polkadot Hub, Kusama Hub, Polkadot Hub TestNet
 * - Parachains: Moonbeam, Moonriver, Moonbase Alpha
 */
export const PolkadotWalletUiRoot: React.FC<PolkadotWalletUiRootProps> = ({ children }) => {
  const [managerState, setManagerState] = useState<PolkadotUiKitManagerState>(
    polkadotUiKitManager.getState()
  );

  useEffect(() => {
    const handleStateChange = () => {
      setManagerState(polkadotUiKitManager.getState());
    };
    const unsubscribe = polkadotUiKitManager.subscribe(handleStateChange);
    handleStateChange();
    return unsubscribe;
  }, []);

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

  // When RainbowKit is configured, wrap children with RainbowKitProvider
  if (
    isWagmiContextEffectivelyReady &&
    currentFullUiKitConfig?.kitName === 'rainbowkit' &&
    kitProviderComponent &&
    isKitAssetsLoaded
  ) {
    const DynKitProvider = kitProviderComponent;
    const kitConfig: RainbowKitKitConfig = currentFullUiKitConfig.kitConfig || {};
    const providerProps: RainbowKitProviderProps = kitConfig.providerProps || {};

    logger.info(
      'PolkadotWalletUiRoot',
      'Wrapping children with dynamically loaded KitProvider (RainbowKit).'
    );
    finalChildren = <DynKitProvider {...providerProps}>{children}</DynKitProvider>;
  } else if (currentFullUiKitConfig?.kitName === 'rainbowkit' && !isWagmiContextEffectivelyReady) {
    logger.info(
      'PolkadotWalletUiRoot',
      'RainbowKit configured, but context or assets not ready. Button may show its loading/error state.'
    );
  }

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
