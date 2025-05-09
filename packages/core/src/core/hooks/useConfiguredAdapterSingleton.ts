/**
 * useConfiguredAdapterSingleton.ts
 *
 * This hook safely retrieves adapter instances from the AdapterContext registry.
 * It's specifically designed to prevent React errors related to state updates
 * during rendering by using local state and useEffect for adapter loading.
 *
 * This approach resolves the error:
 * "Cannot update a component while rendering a different component"
 */
import { useEffect, useState } from 'react';

import type { ContractAdapter, NetworkConfig } from '@openzeppelin/transaction-form-types';

import { useAdapterContext } from './useAdapterContext';

interface UseConfiguredAdapterReturn {
  adapter: ContractAdapter | null;
  isLoading: boolean;
}

/**
 * Custom hook to get a network-configured adapter from the singleton registry.
 * This hook replaces useConfiguredAdapter with a version that uses the AdapterContext
 * to ensure only one adapter instance exists per network.
 *
 * IMPORTANT: This implementation carefully avoids triggering the React warning:
 * "Cannot update a component while rendering a different component"
 * by using local state and useEffect instead of directly returning values that
 * might cause state updates during render.
 *
 * @param networkConfig The NetworkConfig to get an adapter for, or null.
 * @returns An object containing the adapter instance and a loading state.
 */
export function useConfiguredAdapterSingleton(
  networkConfig: NetworkConfig | null
): UseConfiguredAdapterReturn {
  const { getAdapterForNetwork } = useAdapterContext();

  // Initialize with local state instead of directly calling getAdapterForNetwork
  // This prevents state updates during the render phase
  const [result, setResult] = useState<UseConfiguredAdapterReturn>({
    adapter: null,
    isLoading: !!networkConfig,
  });

  // Use effect to load the adapter when networkConfig changes
  // This ensures all state updates happen in the effect phase, not the render phase
  useEffect(() => {
    if (!networkConfig) {
      setResult({ adapter: null, isLoading: false });
      return;
    }

    // Get initial state - might already be loaded or loading
    const initialState = getAdapterForNetwork(networkConfig);
    setResult(initialState);

    // Start a polling interval to check for adapter loading completion
    // This is safe because it only updates state after render
    const intervalId = setInterval(() => {
      const currentState = getAdapterForNetwork(networkConfig);
      if (currentState.adapter || !currentState.isLoading) {
        setResult(currentState);
        clearInterval(intervalId);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [networkConfig, getAdapterForNetwork]);

  return result;
}
