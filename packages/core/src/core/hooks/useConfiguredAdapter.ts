import { useEffect, useState } from 'react';

import type { ContractAdapter, NetworkConfig } from '@openzeppelin/transaction-form-types';

import { getAdapter } from '../ecosystemManager';

interface UseConfiguredAdapterReturn {
  adapter: ContractAdapter | null;
  isLoading: boolean;
}

/**
 * Custom hook to asynchronously load a network-configured adapter.
 * @param networkConfig The NetworkConfig to get an adapter for, or null.
 * @returns An object containing the adapter instance and a loading state.
 */
export function useConfiguredAdapter(
  networkConfig: NetworkConfig | null
): UseConfiguredAdapterReturn {
  const [adapter, setAdapter] = useState<ContractAdapter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (networkConfig) {
      let isActive = true;
      setIsLoading(true);
      setAdapter(null); // Reset adapter while loading a new one

      const fetchAdapter = async () => {
        try {
          const ad = await getAdapter(networkConfig);
          if (isActive) {
            setAdapter(ad);
          }
        } catch (e) {
          if (isActive) {
            setAdapter(null);
          }
          console.error('Failed to load adapter:', e);
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      void fetchAdapter();

      return () => {
        isActive = false;
      };
    } else {
      setAdapter(null);
      setIsLoading(false);
    }
  }, [networkConfig]); // Dependency array includes networkConfig

  return { adapter, isLoading };
}
