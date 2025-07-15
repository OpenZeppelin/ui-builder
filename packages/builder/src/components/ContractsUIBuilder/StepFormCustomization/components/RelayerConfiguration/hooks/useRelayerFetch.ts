import { useState } from 'react';

import type { ContractAdapter, RelayerDetails } from '@openzeppelin/contracts-ui-builder-types';

interface UseRelayerFetchParams {
  adapter: ContractAdapter | null;
  onRelayersFetched?: (relayers: RelayerDetails[]) => void;
}

interface UseRelayerFetchReturn {
  fetchRelayers: (serviceUrl: string, apiKey: string) => Promise<void>;
  fetchedRelayers: RelayerDetails[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useRelayerFetch({
  adapter,
  onRelayersFetched,
}: UseRelayerFetchParams): UseRelayerFetchReturn {
  const [fetchedRelayers, setFetchedRelayers] = useState<RelayerDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRelayers = async (serviceUrl: string, apiKey: string) => {
    if (!adapter) {
      setError('Adapter is not available.');
      return;
    }

    if (!serviceUrl || !apiKey) {
      setError('Please provide both a service URL and an API Key.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFetchedRelayers([]);

    try {
      const relayers = await adapter.getRelayers(serviceUrl, apiKey);
      if (relayers.length === 0) {
        setError('No compatible relayers found for the current network.');
      } else {
        setFetchedRelayers(relayers);
        onRelayersFetched?.(relayers);
      }
    } catch (e) {
      setError((e as Error).message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    fetchRelayers,
    fetchedRelayers,
    isLoading,
    error,
    clearError,
  };
}
