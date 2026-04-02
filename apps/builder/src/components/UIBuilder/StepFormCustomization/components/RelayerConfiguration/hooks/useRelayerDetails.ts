import { useEffect, useState } from 'react';

import type { RelayerDetailsRich } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

interface UseRelayerDetailsParams {
  runtime: BuilderRuntime | null;
  relayerId?: string;
  serviceUrl?: string;
  apiKey?: string;
  enabled?: boolean;
}

interface UseRelayerDetailsReturn {
  enhancedDetails: RelayerDetailsRich | null;
  loading: boolean;
  error: Error | null;
}

export function useRelayerDetails({
  runtime,
  relayerId,
  serviceUrl,
  apiKey,
  enabled = true,
}: UseRelayerDetailsParams): UseRelayerDetailsReturn {
  const [enhancedDetails, setEnhancedDetails] = useState<RelayerDetailsRich | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !relayerId || !apiKey || !serviceUrl || !runtime?.relayer.getRelayer) {
      setEnhancedDetails(null);
      return;
    }

    setLoading(true);
    setError(null);

    runtime.relayer
      .getRelayer(serviceUrl, apiKey, relayerId)
      .then((details) => {
        setEnhancedDetails(details);
      })
      .catch((err) => {
        logger.error('useRelayerDetails', 'Failed to fetch enhanced relayer details:', err);
        setError(err as Error);
        setEnhancedDetails(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [enabled, relayerId, apiKey, serviceUrl, runtime]);

  return {
    enhancedDetails,
    loading,
    error,
  };
}
