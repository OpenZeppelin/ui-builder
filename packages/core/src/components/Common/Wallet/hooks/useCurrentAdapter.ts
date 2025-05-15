import { useEffect, useState } from 'react';

import type { ContractAdapter, NetworkConfig } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { getAllNetworks } from '../../../../core/ecosystemManager';
import { useConfiguredAdapterSingleton } from '../../../../core/hooks';

// Track default network at module level for consistency
let defaultNetworkCache: NetworkConfig | null = null;
// Flag to prevent duplicate network loading in development
let isLoadingNetworksInProgress = false;

/**
 * Hook that returns the first available adapter.
 *
 * ARCHITECTURE NOTE: This hook uses the Adapter Singleton Pattern:
 *
 * 1. The AdapterProvider (higher in the component tree) is the single source of truth for adapters
 * 2. This hook only selects a default network and requests the adapter through context
 * 3. All components share references to the same adapter instances
 *
 * We maintain minimal local state:
 * - defaultNetworkCache: Module-level cache for the network selection
 * - isLoadingNetworksInProgress: Flag to prevent duplicate network loading
 */
export function useCurrentAdapter(): {
  adapter: ContractAdapter | null;
  loading: boolean;
} {
  const [defaultNetwork, setDefaultNetwork] = useState<NetworkConfig | null>(defaultNetworkCache);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(!defaultNetworkCache);

  // Get adapter from the context using the selected network
  const { adapter: configuredAdapter, isLoading: isLoadingAdapter } =
    useConfiguredAdapterSingleton(defaultNetwork);

  // Track when adapter changes
  useEffect(() => {
    if (configuredAdapter) {
      logger.info('useCurrentAdapter', 'Received adapter from AdapterContext:', {
        type: configuredAdapter.constructor.name,
        network: defaultNetwork?.name,
        networkId: defaultNetwork?.id,
        objectId: Object.prototype.toString.call(configuredAdapter),
      });
    } else if (isLoadingAdapter) {
      logger.info('useCurrentAdapter', 'Adapter is loading from AdapterContext');
    }
  }, [configuredAdapter, isLoadingAdapter, defaultNetwork]);

  // Load default network if not already loaded
  useEffect(() => {
    if (defaultNetworkCache) {
      logger.debug('useCurrentAdapter', 'Using cached network:', {
        name: defaultNetworkCache.name,
        id: defaultNetworkCache.id,
      });
      return;
    }

    // Prevent duplicate network loading in development
    if (isLoadingNetworksInProgress) {
      return;
    }

    isLoadingNetworksInProgress = true;
    logger.info('useCurrentAdapter', 'Loading networks to select default network');
    setIsLoadingNetwork(true);

    getAllNetworks()
      .then((networks) => {
        // Prefer EVM networks if available
        const evmNetwork = networks.find((network) => network.ecosystem === 'evm');
        const firstNetwork = evmNetwork || networks[0];

        if (firstNetwork) {
          logger.info('useCurrentAdapter', 'Selected default network:', {
            name: firstNetwork.name,
            id: firstNetwork.id,
            ecosystem: firstNetwork.ecosystem,
          });
          defaultNetworkCache = firstNetwork;
          setDefaultNetwork(firstNetwork);
        } else {
          logger.warn('useCurrentAdapter', 'No networks available');
        }
      })
      .catch((error) => {
        logger.error('useCurrentAdapter', 'Error loading networks:', error);
      })
      .finally(() => {
        setIsLoadingNetwork(false);
        isLoadingNetworksInProgress = false;
      });
  }, []);

  return {
    adapter: configuredAdapter,
    loading: isLoadingNetwork || isLoadingAdapter,
  };
}
