import { Ecosystem, NetworkConfig } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

import { getNetworkById, getNetworksByEcosystem, getRuntime } from '../ecosystemManager';

/**
 * Service class for managing and retrieving network configurations and their associated runtimes.
 * Uses lazy-loading registry.
 *
 * IMPORTANT: Components should generally use the RuntimeProvider/RuntimeContext pattern
 * for runtime access rather than calling this service directly.
 */
export class NetworkService {
  // Cache to promote runtime reuse outside React context
  private runtimeCache: Record<string, BuilderRuntime> = {};

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
   * Retrieves both the network configuration and the corresponding runtime
   * for a given network configuration ID.
   *
   * CAUTION: For non-React contexts only. React components should use RuntimeContext instead.
   *
   * @param networkConfigId The unique ID of the network configuration.
   * @returns A promise resolving to an object containing the network config and runtime, or null if either is not found.
   */
  async getNetworkAndRuntime(
    networkConfigId: string
  ): Promise<{ network: NetworkConfig; runtime: BuilderRuntime } | null> {
    const network = await this.getNetworkById(networkConfigId);
    if (!network) {
      logger.error('NetworkService', `Network configuration not found for ID: ${networkConfigId}`);
      return null;
    }

    // Check the cache first
    if (this.runtimeCache[networkConfigId]) {
      return {
        network,
        runtime: this.runtimeCache[networkConfigId],
      };
    }

    try {
      // Note: In React components, use RuntimeContext pattern instead of this
      const runtime = await getRuntime(network);

      // Cache the runtime
      this.runtimeCache[networkConfigId] = runtime;

      return { network, runtime };
    } catch (error) {
      logger.error(
        'NetworkService',
        `Runtime could not be created for ecosystem: ${network.ecosystem}`,
        error
      );
      return null;
    }
  }
}

// Create a singleton instance of the service for easy access throughout the application.
export const networkService = new NetworkService();
