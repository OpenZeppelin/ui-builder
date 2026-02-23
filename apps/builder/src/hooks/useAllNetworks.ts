import { useEffect, useRef, useState } from 'react';

import type { NetworkConfig } from '@openzeppelin/ui-types';

import { getAllNetworks } from '../core/ecosystemManager';

export interface UseAllNetworksReturn {
  networks: NetworkConfig[];
  isLoading: boolean;
}

/**
 * Fetches and combines networks from all ecosystems using the lightweight
 * `/networks` subpath imports — no full adapter modules are loaded.
 * Results are cached after the first successful fetch.
 */
export function useAllNetworks(): UseAllNetworksReturn {
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const all = await getAllNetworks();
        setNetworks(all);
        hasFetched.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAll();
  }, []);

  return { networks, isLoading };
}
