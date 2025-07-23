import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import type {
  ContractAdapter,
  EcosystemReactUiProviderProps,
  EcosystemSpecificReactHooks,
  NativeConfigLoader,
  NetworkConfig,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { useAdapterContext } from './useAdapterContext';
import { WalletStateContext, type WalletStateContextValue } from './WalletStateContext';

// Extended adapter interface that includes the callback-based configureUiKit method
interface ExtendedContractAdapter extends ContractAdapter {
  configureUiKit?(
    config: Partial<UiKitConfiguration>,
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
   * Optional generic function to load configuration modules by relative path.
   * The adapter is responsible for constructing the conventional path (e.g., './config/wallet/[kitName].config').
   * @param relativePath The conventional relative path to the configuration module.
   * @returns A Promise resolving to the configuration object (expected to have a default export) or null.
   */
  loadConfigModule?: NativeConfigLoader;
}

/**
 * Configures the adapter's UI kit and returns the UI provider component and hooks.
 */
async function configureAdapterUiKit(
  adapter: ExtendedContractAdapter,
  loadConfigModule?: (relativePath: string) => Promise<Record<string, unknown> | null>,
  programmaticOverrides: Partial<UiKitConfiguration> = {}
): Promise<{
  providerComponent: React.ComponentType<EcosystemReactUiProviderProps> | null;
  hooks: EcosystemSpecificReactHooks | null;
}> {
  try {
    // Ensure the adapter (and thus the EvmUiKitManager) is configured.
    if (typeof adapter.configureUiKit === 'function') {
      logger.info(
        '[WSP configureAdapterUiKit] Calling configureUiKit for adapter:',
        adapter?.networkConfig?.id
      );
      await adapter.configureUiKit(programmaticOverrides, {
        loadUiKitNativeConfig: loadConfigModule,
      });
      logger.info(
        '[WSP configureAdapterUiKit] configureUiKit completed for adapter:',
        adapter?.networkConfig?.id
      );
    }

    const providerComponent = adapter.getEcosystemReactUiContextProvider?.() || null;
    const hooks = adapter.getEcosystemReactHooks?.() || null;

    logger.info('[WSP configureAdapterUiKit]', 'UI provider and hooks retrieved successfully.');

    return { providerComponent, hooks };
  } catch (error) {
    logger.error('[WSP configureAdapterUiKit]', 'Error during adapter UI setup:', error);
    throw error; // Re-throw to be handled by caller
  }
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
    useState<React.ComponentType<EcosystemReactUiProviderProps> | null>(null);

  // New state to act as a manual trigger for re-configuring the UI kit.
  const [uiKitConfigVersion, setUiKitConfigVersion] = useState(0);
  // State to hold programmatic overrides for the next reconfiguration.
  const [programmaticUiKitConfig, setProgrammaticUiKitConfig] = useState<
    Partial<UiKitConfiguration> | undefined
  >(undefined);

  // Consume AdapterContext to get the function for fetching adapter instances.
  const { getAdapterForNetwork } = useAdapterContext();

  // Effect to derive the full NetworkConfig object when currentGlobalNetworkId changes.
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchNetworkConfig() {
      if (!currentGlobalNetworkId) {
        // If currentGlobalNetworkId is null, clear the config.
        if (!abortController.signal.aborted) {
          setCurrentGlobalNetworkConfig(null);
        }
        return;
      }

      try {
        const config = await Promise.resolve(getNetworkConfigById(currentGlobalNetworkId));
        if (!abortController.signal.aborted) {
          setCurrentGlobalNetworkConfig(config || null);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          logger.error('[WSP fetchNetworkConfig]', 'Failed to fetch network config:', error);
          setCurrentGlobalNetworkConfig(null);
        }
      }
    }

    void fetchNetworkConfig();
    return () => abortController.abort();
  }, [currentGlobalNetworkId, getNetworkConfigById]);

  // Effect to load the active adapter and its UI capabilities when currentGlobalNetworkConfig changes.
  useEffect(() => {
    const abortController = new AbortController();

    async function loadAdapterAndConfigureUi() {
      if (!currentGlobalNetworkConfig) {
        // No network config - clear everything
        if (!abortController.signal.aborted) {
          setGlobalActiveAdapter(null);
          setIsGlobalAdapterLoading(false);
          setAdapterUiContextProviderToRender(null);
          setWalletFacadeHooks(null);
        }
        return;
      }

      const { adapter: newAdapter, isLoading: newIsLoading } = getAdapterForNetwork(
        currentGlobalNetworkConfig
      ) as { adapter: ExtendedContractAdapter | null; isLoading: boolean };

      if (abortController.signal.aborted) return;

      setGlobalActiveAdapter(newAdapter);
      setIsGlobalAdapterLoading(newIsLoading);

      if (newAdapter && !newIsLoading) {
        try {
          const { providerComponent, hooks } = await configureAdapterUiKit(
            newAdapter,
            loadConfigModule,
            programmaticUiKitConfig
          );

          if (!abortController.signal.aborted) {
            // We use the functional update form `() => providerComponent` here to ensure
            // that React sets the state to the component type itself, rather than trying
            // to execute the component function as if it were a state updater.
            setAdapterUiContextProviderToRender(() => providerComponent);
            setWalletFacadeHooks(hooks);
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            logger.error(
              '[WSP loadAdapterAndConfigureUi]',
              'Error during adapter UI setup:',
              error
            );
            setAdapterUiContextProviderToRender(null);
            setWalletFacadeHooks(null);
          }
        }
      } else if (!newAdapter && !newIsLoading) {
        // Adapter is null and not loading, clear UI specific state
        if (!abortController.signal.aborted) {
          setAdapterUiContextProviderToRender(null);
          setWalletFacadeHooks(null);
        }
      }
      // If newIsLoading is true, retain previous AdapterUiContextProviderToRender and hooks
      // to prevent UI flicker, EvmWalletUiRoot will handle its loading state internally.
    }

    void loadAdapterAndConfigureUi();
    return () => abortController.abort();
  }, [
    currentGlobalNetworkConfig,
    getAdapterForNetwork,
    loadConfigModule,
    uiKitConfigVersion,
    programmaticUiKitConfig,
  ]);

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

  /**
   * Callback to explicitly trigger a re-configuration of the active adapter's UI kit.
   * This is useful when a UI kit setting changes (e.g., via a wizard) without a network change.
   */
  const reconfigureActiveAdapterUiKit = useCallback(
    (uiKitConfig?: Partial<UiKitConfiguration>) => {
      logger.info(
        'WalletStateProvider',
        'Explicitly triggering UI kit re-configuration by bumping version.',
        uiKitConfig
      );
      setProgrammaticUiKitConfig(uiKitConfig);
      setUiKitConfigVersion((v) => v + 1);
    },
    [setProgrammaticUiKitConfig, setUiKitConfigVersion]
  );

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
      reconfigureActiveAdapterUiKit,
    }),
    [
      currentGlobalNetworkId,
      setActiveNetworkIdCallback,
      currentGlobalNetworkConfig,
      globalActiveAdapter,
      isGlobalAdapterLoading,
      walletFacadeHooks,
      reconfigureActiveAdapterUiKit,
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
