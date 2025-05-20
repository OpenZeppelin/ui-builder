import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import type {
  ContractAdapter,
  EcosystemReactUiProviderProps,
  EcosystemSpecificReactHooks,
  NetworkConfig,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { WalletStateContext, type WalletStateContextValue } from './WalletStateContext';
import { useAdapterContext } from './useAdapterContext';

export interface WalletStateProviderProps {
  children: ReactNode;
  /** Optional initial network ID to set as active when the provider mounts. */
  initialNetworkId?: string | null;
  /** Function to retrieve a NetworkConfig object by its ID. */
  getNetworkConfigById: (
    networkId: string
  ) => Promise<NetworkConfig | null | undefined> | NetworkConfig | null | undefined;
}

/**
 * @name WalletStateProvider
 * @description This provider is a central piece of the application's state management for wallet and network interactions.
 * It is responsible for:
 * 1. Managing the globally selected active network ID (`activeNetworkId`).
 * 2. Deriving the full `NetworkConfig` object (`activeNetworkConfig`) for the active network.
 * 3. Fetching and providing the corresponding `ContractAdapter` instance (`activeAdapter`) for the active network,
 *    leveraging the `AdapterProvider` to ensure adapter singletons.
 * 4. Storing and providing the `EcosystemSpecificReactHooks` (`walletFacadeHooks`) from the active adapter.
 * 5. Rendering the adapter-specific UI context provider (e.g., WagmiProvider for EVM) around its children,
 *    which is essential for the facade hooks to function correctly.
 * 6. Providing a function (`setActiveNetworkId`) to change the globally active network.
 *
 * Consumers use the `useWalletState()` hook to access this global state.
 * It should be placed high in the component tree, inside an `<AdapterProvider>`.
 */
export function WalletStateProvider({
  children,
  initialNetworkId = null,
  getNetworkConfigById,
}: WalletStateProviderProps) {
  // State for the ID of the globally selected network.
  const [currentGlobalNetworkId, setCurrentGlobalNetworkIdState] = useState<string | null>(
    initialNetworkId
  );
  // State for the full NetworkConfig object of the globally selected network.
  const [currentGlobalNetworkConfig, setCurrentGlobalNetworkConfig] =
    useState<NetworkConfig | null>(null);

  // State for the active ContractAdapter instance corresponding to the currentGlobalNetworkConfig.
  const [globalActiveAdapter, setGlobalActiveAdapter] = useState<ContractAdapter | null>(null);
  // Loading state for the globalActiveAdapter.
  const [isGlobalAdapterLoading, setIsGlobalAdapterLoading] = useState<boolean>(false);
  // State for the facade hooks provided by the globalActiveAdapter.
  const [walletFacadeHooks, setWalletFacadeHooks] = useState<EcosystemSpecificReactHooks | null>(
    null
  );
  // State to hold the UI context provider component from the active adapter (e.g., EvmBasicUiContextProvider).
  const [AdapterUiContextProvider, setAdapterUiContextProvider] =
    useState<React.ComponentType<EcosystemReactUiProviderProps> | null>(null);

  // Consume AdapterContext to get the function for fetching adapter instances.
  const { getAdapterForNetwork } = useAdapterContext();

  // Effect to derive the full NetworkConfig object when currentGlobalNetworkId changes.
  useEffect(() => {
    let isActive = true; // Prevents state updates on unmounted component.
    async function fetchNetworkConfig() {
      if (currentGlobalNetworkId) {
        try {
          const config = await Promise.resolve(getNetworkConfigById(currentGlobalNetworkId));
          if (isActive) {
            if (config) {
              setCurrentGlobalNetworkConfig(config);
              logger.info(
                'WalletStateProvider',
                `Derived network config for ID: ${currentGlobalNetworkId}`
              );
            } else {
              logger.warn(
                'WalletStateProvider',
                `No network config found for ID: ${currentGlobalNetworkId}`
              );
              setCurrentGlobalNetworkConfig(null);
            }
          }
        } catch (error) {
          logger.error(
            'WalletStateProvider',
            `Error fetching network config for ID: ${currentGlobalNetworkId}`,
            error
          );
          if (isActive) setCurrentGlobalNetworkConfig(null);
        }
      } else {
        // If currentGlobalNetworkId is null, clear the config.
        if (isActive) setCurrentGlobalNetworkConfig(null);
      }
    }
    void fetchNetworkConfig();
    return () => {
      isActive = false;
    };
  }, [currentGlobalNetworkId, getNetworkConfigById]);

  // Effect to load the active adapter and its UI capabilities when currentGlobalNetworkConfig changes.
  useEffect(() => {
    if (currentGlobalNetworkConfig) {
      logger.info(
        'WalletStateProvider',
        `Fetching adapter for global network: ${currentGlobalNetworkConfig.id}`
      );
      // getAdapterForNetwork is synchronous and returns current state from AdapterProvider registry.
      const { adapter, isLoading } = getAdapterForNetwork(currentGlobalNetworkConfig);
      setGlobalActiveAdapter(adapter);
      setIsGlobalAdapterLoading(isLoading);

      if (adapter && !isLoading) {
        // Once adapter is loaded, configure its UI kit (e.g., to 'custom').
        if (typeof adapter.configureUiKit === 'function') {
          adapter.configureUiKit({ kitName: 'custom' });
          logger.info(
            'WalletStateProvider',
            `Configured UI kit for adapter: ${adapter.networkConfig.id}`
          );
        }
        // Extract facade hooks and UI context provider from the adapter.
        setWalletFacadeHooks(adapter.getEcosystemReactHooks?.() || null);
        const UiProvider = adapter.getEcosystemReactUiContextProvider?.();
        setAdapterUiContextProvider(UiProvider ? () => UiProvider : null); // Store component type for rendering.
      }
    } else {
      // If no global network config, clear all adapter-related state.
      setGlobalActiveAdapter(null);
      setIsGlobalAdapterLoading(false);
      setWalletFacadeHooks(null);
      setAdapterUiContextProvider(null);
    }
  }, [currentGlobalNetworkConfig, getAdapterForNetwork]);

  /**
   * Callback to set the globally active network ID.
   * Also clears dependent states (config, adapter, hooks) if the network ID is cleared.
   */
  const setActiveNetworkIdCallback = useCallback((networkId: string | null) => {
    logger.info('WalletStateProvider', `Setting global network ID to: ${networkId}`);
    setCurrentGlobalNetworkIdState(networkId); // This will trigger the fetchNetworkConfig effect.
    if (!networkId) {
      // If clearing the network, proactively clear downstream states.
      // The effects above will also clear them, but this is more immediate.
      setCurrentGlobalNetworkConfig(null);
      setGlobalActiveAdapter(null);
      setIsGlobalAdapterLoading(false);
      setWalletFacadeHooks(null);
      setAdapterUiContextProvider(null);
    }
  }, []); // Empty dependency array as it only uses setters from useState.

  // The context value now only provides the raw walletFacadeHooks object.
  // Consumers are responsible for calling specific hooks from it and handling their results.
  const contextValue = useMemo<WalletStateContextValue>(
    () => ({
      activeNetworkId: currentGlobalNetworkId,
      setActiveNetworkId: setActiveNetworkIdCallback,
      activeNetworkConfig: currentGlobalNetworkConfig,
      activeAdapter: globalActiveAdapter,
      isAdapterLoading: isGlobalAdapterLoading,
      walletFacadeHooks,
    }),
    [
      currentGlobalNetworkId,
      setActiveNetworkIdCallback,
      currentGlobalNetworkConfig,
      globalActiveAdapter,
      isGlobalAdapterLoading,
      walletFacadeHooks,
    ]
  );

  // Conditionally wrap children with the adapter-specific UI context provider (e.g., WagmiProvider)
  // if the active adapter provides one. This enables the facade hooks.
  const childrenToRender = AdapterUiContextProvider ? (
    <AdapterUiContextProvider>{children}</AdapterUiContextProvider>
  ) : (
    children
  );

  return (
    <WalletStateContext.Provider value={contextValue}>
      {childrenToRender}
    </WalletStateContext.Provider>
  );
}
