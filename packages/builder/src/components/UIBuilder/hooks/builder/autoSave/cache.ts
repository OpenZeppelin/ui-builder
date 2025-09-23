import { deepEqual } from 'fast-equals';

import { contractUIStorage } from '@openzeppelin/ui-builder-storage';

import { SavedConfigurationData } from './types';

/**
 * Cache entry types for storing either title metadata or full configuration data
 */
type CacheEntry =
  | {
      type: 'title';
      title?: string;
      isManuallyRenamed: boolean;
      lastUpdated: number;
    }
  | {
      type: 'config';
      config: SavedConfigurationData;
      lastUpdated: number;
    };

/**
 * In-memory cache for auto-save operations to minimize database queries.
 * Stores both configuration title metadata and full configuration data
 * with automatic TTL-based expiration to ensure data freshness.
 */
class AutoSaveCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 60000; // 1 minute

  /**
   * Set a title cache entry
   */
  private setTitle(key: string, title?: string, isManuallyRenamed = false): void {
    this.cache.set(key, {
      type: 'title',
      title,
      isManuallyRenamed,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Set a config cache entry
   */
  private setConfig(key: string, config: SavedConfigurationData): void {
    this.cache.set(key, {
      type: 'config',
      config,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Get a cache entry with type safety and TTL validation
   */
  private get<T extends CacheEntry['type']>(
    key: string,
    type: T
  ): Extract<CacheEntry, { type: T }> | null {
    const entry = this.cache.get(key);
    if (!entry || entry.type !== type || Date.now() - entry.lastUpdated > this.TTL) {
      this.cache.delete(key); // Clean up expired entries
      return null;
    }
    return entry as Extract<CacheEntry, { type: T }>;
  }

  /**
   * Get cached title information or fetch from storage
   */
  async getTitleInfo(configId: string): Promise<{ title?: string; isManuallyRenamed: boolean }> {
    // Try cache first
    const cached = this.get(configId, 'title');
    if (cached) {
      return {
        title: cached.title,
        isManuallyRenamed: cached.isManuallyRenamed,
      };
    }

    // Fetch from storage
    try {
      const existingConfig = await contractUIStorage.get(configId);
      const result = {
        title: existingConfig?.title,
        isManuallyRenamed: existingConfig?.metadata?.isManuallyRenamed === true,
      };

      // Cache the result
      this.setTitle(configId, result.title, result.isManuallyRenamed);

      return result;
    } catch {
      // Cache the failure (empty result)
      const result = { isManuallyRenamed: false };
      this.setTitle(configId, undefined, false);
      return result;
    }
  }

  /**
   * Check if configuration has changed using cached comparison
   */
  hasConfigChanged(configId: string, newConfig: SavedConfigurationData): boolean {
    const cached = this.get(configId, 'config');
    if (!cached) {
      // No cached config means it's definitely changed
      return true;
    }

    return !deepEqual(cached.config, newConfig);
  }

  /**
   * Update the cached configuration
   */
  updateConfigCache(configId: string, config: SavedConfigurationData): void {
    this.setConfig(configId, config);
  }

  /**
   * Clear all cache entries (useful for testing or memory management)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove cache entries for a specific config (e.g., when config is deleted)
   */
  invalidate(configId: string): void {
    this.cache.delete(configId);
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const autoSaveCache = new AutoSaveCache();
