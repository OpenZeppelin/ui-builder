import { ContractAdapter, Ecosystem, NetworkConfig } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { getAdapter, getNetworkById, getNetworksByEcosystem } from '../ecosystemManager';

/**
 * Service class for managing and retrieving network configurations and their associated adapters.
 * Uses lazy-loading registry.
 *
 * IMPORTANT: Components should generally use the AdapterProvider/AdapterContext pattern
 * for adapter access rather than calling this service directly.
 */
export class NetworkService {
  // Cache to promote adapter reuse outside React context
  private adapterCache: Record<string, ContractAdapter> = {};

  /**
   * Get network configurations for a specific ecosystem using lazy loading.
   * @param ecosystem The ecosystem identifier.
   * @returns A promise that resolves to an array of network configurations for the specified ecosystem.
   */
  async getNetworksByEcosystem(ecosystem: Ecosystem): Promise<NetworkConfig[]> {
    return getNetworksByEcosystem(ecosystem);
  }

  /**
   * Get a specific network configuration by its ID using lazy loading.
   * @param id The unique network configuration ID.
   * @returns A promise that resolves to the network configuration object or undefined if not found.
   */
  async getNetworkById(id: string): Promise<NetworkConfig | undefined> {
    return getNetworkById(id);
  }

  /**
   * Retrieves both the network configuration and the corresponding contract adapter
   * for a given network configuration ID.
   *
   * CAUTION: For non-React contexts only. React components should use AdapterContext instead.
   *
   * @param networkConfigId The unique ID of the network configuration.
   * @returns A promise resolving to an object containing the network config and adapter, or null if either is not found.
   */
  async getNetworkAndAdapter(
    networkConfigId: string
  ): Promise<{ network: NetworkConfig; adapter: ContractAdapter } | null> {
    const network = await this.getNetworkById(networkConfigId);
    if (!network) {
      logger.error('NetworkService', `Network configuration not found for ID: ${networkConfigId}`);
      return null;
    }

    // Check the cache first
    if (this.adapterCache[networkConfigId]) {
      return {
        network,
        adapter: this.adapterCache[networkConfigId],
      };
    }

    try {
      // Note: In React components, use AdapterContext pattern instead of this
      const adapter = await getAdapter(network);

      // Cache the adapter
      this.adapterCache[networkConfigId] = adapter;

      return { network, adapter };
    } catch (error) {
      logger.error(
        'NetworkService',
        `Adapter could not be created for ecosystem: ${network.ecosystem}`,
        error
      );
      return null;
    }
  }
}

// Create a singleton instance of the service for easy access throughout the application.
export const networkService = new NetworkService();
