/**
 * AdapterProvider.tsx
 *
 * This file implements the Adapter Provider component which manages a registry of
 * adapter instances. It's a key part of the adapter singleton pattern which ensures
 * that only one adapter instance exists per network configuration.
 *
 * The adapter registry is shared across the application via React Context, allowing
 * components to access the same adapter instances and maintain consistent wallet
 * connection state.
 *
 * IMPORTANT: This implementation needs special care to avoid React state update errors
 * during component rendering. Direct state updates during render are not allowed, which
 * is why adapter loading is controlled carefully.
 */
import React, { useCallback, useMemo, useState } from 'react';

import type { NetworkConfig } from '@openzeppelin/transaction-form-types';

import { getAdapter } from '../ecosystemManager';

import { AdapterContext, AdapterContextValue, AdapterRegistry } from './AdapterContext';

export interface AdapterProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that manages adapter instances centrally
 * to avoid creating multiple instances of the same adapter.
 *
 * This component:
 * 1. Maintains a registry of adapter instances by network ID
 * 2. Tracks loading states for adapters being initialized
 * 3. Provides a function to get or load adapters for specific networks
 * 4. Ensures adapter instances are reused when possible
 */
export function AdapterProvider({ children }: AdapterProviderProps) {
  // Registry to store adapter instances by network ID
  const [adapterRegistry, setAdapterRegistry] = useState<AdapterRegistry>({});

  // Track loading states by network ID
  const [loadingNetworks, setLoadingNetworks] = useState<Set<string>>(new Set());

  /**
   * Function to get or create an adapter for a network
   *
   * IMPORTANT: The actual adapter loading is handled in the useConfiguredAdapterSingleton hook
   * to avoid React state updates during render, which would cause errors.
   *
   * This function:
   * 1. Returns existing adapters immediately if available
   * 2. Reports loading state for adapters being initialized
   * 3. Initiates adapter loading when needed
   */
  const getAdapterForNetwork = useCallback(
    (networkConfig: NetworkConfig | null) => {
      if (!networkConfig) {
        return { adapter: null, isLoading: false };
      }

      const networkId = networkConfig.id;

      // If we already have this adapter, return it
      if (adapterRegistry[networkId]) {
        return {
          adapter: adapterRegistry[networkId],
          isLoading: false,
        };
      }

      // If we're already loading this adapter, indicate loading
      if (loadingNetworks.has(networkId)) {
        return {
          adapter: null,
          isLoading: true,
        };
      }

      // Start loading the adapter
      // NOTE: This state update during render is handled safely in the useConfiguredAdapterSingleton hook
      setLoadingNetworks((prev) => {
        const newSet = new Set(prev);
        newSet.add(networkId);
        return newSet;
      });

      // Fetch the adapter
      void getAdapter(networkConfig).then((adapter) => {
        // Update registry with new adapter
        setAdapterRegistry((prev) => ({
          ...prev,
          [networkId]: adapter,
        }));

        // Remove from loading networks
        setLoadingNetworks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(networkId);
          return newSet;
        });
      });

      return {
        adapter: null,
        isLoading: true,
      };
    },
    [adapterRegistry, loadingNetworks]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AdapterContextValue>(
    () => ({
      getAdapterForNetwork,
    }),
    [getAdapterForNetwork]
  );

  return <AdapterContext.Provider value={contextValue}>{children}</AdapterContext.Provider>;
}
