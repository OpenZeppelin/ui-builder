import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import type {
  ContractAdapter,
  EcosystemReactUiProviderProps,
  EcosystemSpecificReactHooks,
  NetworkConfig,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { WalletStateContext, type WalletStateContextValue } from './WalletStateContext';
import { useAdapterContext } from './useAdapterContext';

// Extended adapter interface that includes the callback-based configureUiKit method
interface ExtendedContractAdapter extends ContractAdapter {
  configureUiKit?(
    config: UiKitConfiguration,
    options?: {
      loadUiKitNativeConfig?: (kitName: string) => Promise<Record<string, unknown> | null>;
    }
  ): void | Promise<void>;
  lastFullUiKitConfiguration?: UiKitConfiguration | null;
  getEcosystemReactUiContextProvider?():
    | React.ComponentType<EcosystemReactUiProviderProps>
    | undefined;
}

export interface WalletStateProviderProps {
  children: ReactNode;
  /** Optional initial network ID to set as active when the provider mounts. */
  initialNetworkId?: string | null;
  /** Function to retrieve a NetworkConfig object by its ID. */
  getNetworkConfigById: (
    networkId: string
  ) => Promise<NetworkConfig | null | undefined> | NetworkConfig | null | undefined;
  /**
   * Optional generic function to load configuration modules by path.
   * This allows the adapter to load its own kit-specific configs without
   * the consuming app needing to know about specific UI kit types.
   */
  loadConfigModule?: (relativePath: string) => Promise<Record<string, unknown> | null>;
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
  loadConfigModule,
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
  // State to hold the Component Type
  const [AdapterUiContextProviderToRender, setAdapterUiContextProviderToRender] =
    useState<React.ComponentType<EcosystemReactUiProviderProps> | null>(() => null);

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
            } else {
              setCurrentGlobalNetworkConfig(null);
            }
          }
        } catch {
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
    let isMounted = true;
    async function configureAdapterAndSetUi() {
      if (currentGlobalNetworkConfig) {
        const { adapter: newAdapter, isLoading: newIsLoading } = getAdapterForNetwork(
          currentGlobalNetworkConfig
        ) as { adapter: ExtendedContractAdapter | null; isLoading: boolean };

        if (isMounted) {
          setGlobalActiveAdapter(newAdapter);
          setIsGlobalAdapterLoading(newIsLoading);

          if (newAdapter && !newIsLoading) {
            try {
              // Ensure the adapter (and thus the EvmUiKitManager) is configured.

              if (typeof newAdapter.configureUiKit === 'function') {
                logger.info(
                  '[WSP EFFECT] Calling configureUiKit for adapter:',
                  newAdapter?.networkConfig?.id
                );
                // Pass an empty object for programmaticOverrides unless WalletStateProvider
                // itself has specific overrides it wants to enforce.
                await newAdapter.configureUiKit({} as Partial<UiKitConfiguration>, {
                  loadUiKitNativeConfig: loadConfigModule,
                });
                logger.info(
                  '[WSP EFFECT] configureUiKit completed for adapter:',
                  newAdapter?.networkConfig?.id
                );
              }

              const ProviderComponent = newAdapter.getEcosystemReactUiContextProvider?.();
              setAdapterUiContextProviderToRender(
                ProviderComponent ? () => ProviderComponent : null
              );

              setWalletFacadeHooks(newAdapter.getEcosystemReactHooks?.() || null);
              logger.info(
                '[WalletStateProvider]',
                'UI provider and hooks set after adapter processing.'
              );
            } catch (error) {
              logger.error('[WalletStateProvider]', 'Error during adapter UI setup:', error);
              if (isMounted) {
                setAdapterUiContextProviderToRender(null);
                setWalletFacadeHooks(null);
              }
            }
          } else if (!newAdapter && !newIsLoading) {
            // Adapter is null and not loading, clear UI specific state
            setAdapterUiContextProviderToRender(null);
            setWalletFacadeHooks(null);
          }
          // If newIsLoading is true, retain previous AdapterUiContextProviderToRender and hooks
          // to prevent UI flicker, EvmWalletUiRoot will handle its loading state internally.
        }
      } else {
        // No network config - clear everything
        if (isMounted) {
          setGlobalActiveAdapter(null);
          setIsGlobalAdapterLoading(false);
          setAdapterUiContextProviderToRender(null);
          setWalletFacadeHooks(null);
        }
      }
    }

    void configureAdapterAndSetUi();
    return () => {
      isMounted = false;
    };
  }, [currentGlobalNetworkConfig, getAdapterForNetwork, loadConfigModule]);

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
      // Do not clear AdapterUiContextProviderToRender here, let the effect handle it
      // based on whether it's a loading transition or an actual clearing.
      // setAdapterUiContextProviderToRender(() => null);
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

  const ActualProviderToRender = AdapterUiContextProviderToRender;
  let childrenToRender: ReactNode;

  if (ActualProviderToRender) {
    // EvmWalletUiRoot (and similar for other adapters) no longer needs uiKitConfiguration prop
    // as it manages its own configuration internally via the EvmUiKitManager or equivalent.
    logger.info(
      '[WSP RENDER]',
      'Rendering adapter-provided UI context provider:',
      ActualProviderToRender.displayName || ActualProviderToRender.name || 'UnknownComponent'
    );
    childrenToRender = <ActualProviderToRender>{children}</ActualProviderToRender>;
  } else {
    logger.info(
      '[WSP RENDER]',
      'No adapter UI context provider to render. Rendering direct children.'
    );
    childrenToRender = children;
  }

  return (
    <WalletStateContext.Provider value={contextValue}>
      {childrenToRender}
    </WalletStateContext.Provider>
  );
}
