import { AdapterConfig, Ecosystem } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { getAdapterConfig } from '../core/ecosystemManager';

/**
 * AdapterConfigLoader
 *
 * Loads adapter configuration from the ecosystem definition. The adapter
 * config contains dependency and build information used during app export.
 */
export class AdapterConfigLoader {
  private configCache: Record<string, AdapterConfig | null> = Object.create(null);

  async loadConfig(ecosystem: Ecosystem): Promise<AdapterConfig | null> {
    if (this.configCache[ecosystem] !== undefined) {
      return this.configCache[ecosystem];
    }

    try {
      const config = await getAdapterConfig(ecosystem);

      if (!config || !this.isValidAdapterConfig(config)) {
        logger.warn(
          'AdapterConfigLoader',
          `No valid adapter config found for ecosystem: ${ecosystem}`
        );
        this.configCache[ecosystem] = null;
        return null;
      }

      this.configCache[ecosystem] = config;
      return config;
    } catch (error) {
      logger.error('AdapterConfigLoader', `Error loading config for ${ecosystem}:`, error);
      this.configCache[ecosystem] = null;
      return null;
    }
  }

  private isValidAdapterConfig(config: unknown): config is AdapterConfig {
    if (!config || typeof config !== 'object') return false;

    const obj = config as Record<string, unknown>;
    if (!obj.dependencies || typeof obj.dependencies !== 'object') return false;

    const deps = obj.dependencies as Record<string, unknown>;
    if (!deps.runtime || typeof deps.runtime !== 'object') return false;

    const runtime = deps.runtime as Record<string, unknown>;
    return Object.values(runtime).every((value) => typeof value === 'string');
  }
}
