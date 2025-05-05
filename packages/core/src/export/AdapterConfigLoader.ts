import { logger } from '@openzeppelin/transaction-form-renderer';
import { Ecosystem } from '@openzeppelin/transaction-form-types/common';

import { adapterConfigExportMap, adapterConfigLoaders } from '../core/adapterRegistry';
import type { AdapterConfig } from '../core/types/AdapterTypes';

// Helper type for the type guard
interface HasDependencies {
  dependencies: unknown;
}

interface DependenciesWithRuntime {
  runtime: unknown;
}

/**
 * AdapterConfigLoader
 *
 * This class is responsible for loading adapter configuration files using
 * functions provided by the adapterRegistry.
 */
export class AdapterConfigLoader {
  private configCache: Record<Ecosystem, AdapterConfig | null> = Object.create(null);

  /**
   * Load config for a specific chain type
   *
   * @param ecosystem The ecosystem
   * @returns The adapter configuration, or null if not available
   */
  async loadConfig(ecosystem: Ecosystem): Promise<AdapterConfig | null> {
    // Return from cache if available
    if (this.configCache[ecosystem] !== undefined) {
      return this.configCache[ecosystem];
    }

    // Get the loader function and expected export key for the config
    const loaderFunc = adapterConfigLoaders[ecosystem];
    const configKey = adapterConfigExportMap[ecosystem];

    if (!loaderFunc || !configKey) {
      logger.warn(
        'AdapterConfigLoader',
        `No config loader function or export key found for ecosystem: ${ecosystem}`
      );
      this.configCache[ecosystem] = null;
      return null;
    }

    try {
      // Execute the chain-specific loader function from the registry
      const configModule = await loaderFunc();

      // Extract the config object using the key from the registry
      const config = configModule[configKey];

      if (!config || !this.isValidAdapterConfig(config)) {
        logger.error(
          'AdapterConfigLoader',
          `Invalid or missing config export '${configKey}' for ${ecosystem}`
        );
        this.configCache[ecosystem] = null;
        return null;
      }

      this.configCache[ecosystem] = config;
      return config;
    } catch (error) {
      logger.error('AdapterConfigLoader', `Error executing config loader for ${ecosystem}:`, error);
      this.configCache[ecosystem] = null;
      return null;
    }
  }

  /**
   * Validate adapter config structure
   *
   * @param config The config object to validate
   * @returns True if the config has the required structure
   */
  private isValidAdapterConfig(config: unknown): config is AdapterConfig {
    // First, check if it's an object with a dependencies property
    if (!config || typeof config !== 'object') {
      return false;
    }

    const hasDeps = config as HasDependencies;
    if (!hasDeps.dependencies || typeof hasDeps.dependencies !== 'object') {
      return false;
    }

    // Then check if dependencies has a runtime property that's an object
    const deps = hasDeps.dependencies as DependenciesWithRuntime;
    if (!deps.runtime || typeof deps.runtime !== 'object') {
      return false;
    }

    // Check if runtime is a record of strings
    const runtime = deps.runtime as Record<string, unknown>;
    return Object.values(runtime).every((value) => typeof value === 'string');
  }
}
