import { useState } from 'react';

import type { RelayerDetails } from '@openzeppelin/ui-types';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

interface UseRelayerFetchParams {
  runtime: BuilderRuntime | null;
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
  runtime,
  onRelayersFetched,
}: UseRelayerFetchParams): UseRelayerFetchReturn {
  const [fetchedRelayers, setFetchedRelayers] = useState<RelayerDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRelayers = async (serviceUrl: string, apiKey: string) => {
    if (!runtime) {
      setError('Runtime is not available.');
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
      const relayers = await runtime.relayer.getRelayers(serviceUrl, apiKey);
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
