import { ContractAdapter, Ecosystem, NetworkConfig } from '@openzeppelin/transaction-form-types';

import {
  getAdapter,
  getAllNetworks,
  getNetworkById,
  getNetworksByEcosystem,
} from '../ecosystemManager';

/**
 * Service class for managing and retrieving network configurations and their associated adapters.
 * Uses lazy-loading registry.
 */
export class NetworkService {
  /**
   * Get all available network configurations using lazy loading.
   * @returns A promise that resolves to an array of all network configurations.
   */
  async getAllNetworks(): Promise<NetworkConfig[]> {
    return getAllNetworks();
  }

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
   * @param networkConfigId The unique ID of the network configuration.
   * @returns A promise resolving to an object containing the network config and adapter, or null if either is not found.
   */
  async getNetworkAndAdapter(
    networkConfigId: string
  ): Promise<{ network: NetworkConfig; adapter: ContractAdapter } | null> {
    const network = await this.getNetworkById(networkConfigId);
    if (!network) {
      console.error(`Network configuration not found for ID: ${networkConfigId}`);
      return null;
    }

    try {
      const adapter = await getAdapter(network);
      return { network, adapter };
    } catch (error) {
      console.error(`Adapter could not be created for ecosystem: ${network.ecosystem}`, error);
      return null;
    }
  }
}

// Create a singleton instance of the service for easy access throughout the application.
export const networkService = new NetworkService();
