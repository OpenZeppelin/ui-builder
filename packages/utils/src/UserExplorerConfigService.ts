import type { UserExplorerConfig } from '@openzeppelin/contracts-ui-builder-types';

import { logger } from './logger';

// Event types
type ExplorerConfigEventType = 'explorer-config-changed' | 'explorer-config-cleared';

export interface ExplorerConfigEvent {
  type: ExplorerConfigEventType;
  networkId: string;
  config?: UserExplorerConfig;
}

/**
 * Service for managing user-configured block explorer endpoints and API keys.
 * Stores explorer configurations in localStorage for persistence across sessions.
 */
export class UserExplorerConfigService {
  private static readonly STORAGE_PREFIX = 'tfb_explorer_config_';
  private static readonly eventListeners = new Map<
    string,
    Set<(event: ExplorerConfigEvent) => void>
  >();

  /**
   * Emits an explorer configuration event to all registered listeners
   */
  private static emitEvent(event: ExplorerConfigEvent): void {
    const listeners = this.eventListeners.get(event.networkId) || new Set();
    const globalListeners = this.eventListeners.get('*') || new Set();

    [...listeners, ...globalListeners].forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        logger.error('UserExplorerConfigService', 'Error in event listener:', error);
      }
    });
  }

  /**
   * Subscribes to explorer configuration changes for a specific network or all networks
   * @param networkId The network identifier or '*' for all networks
   * @param listener The callback to invoke when explorer config changes
   * @returns Unsubscribe function
   */
  static subscribe(networkId: string, listener: (event: ExplorerConfigEvent) => void): () => void {
    if (!this.eventListeners.has(networkId)) {
      this.eventListeners.set(networkId, new Set());
    }

    this.eventListeners.get(networkId)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(networkId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(networkId);
        }
      }
    };
  }

  /**
   * Saves a user explorer configuration for a specific network.
   * @param networkId The network identifier
   * @param config The explorer configuration to save
   */
  static saveUserExplorerConfig(networkId: string, config: UserExplorerConfig): void {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${networkId}`;
      localStorage.setItem(storageKey, JSON.stringify(config));
      logger.info('UserExplorerConfigService', `Saved explorer config for network ${networkId}`);

      // Emit change event
      this.emitEvent({ type: 'explorer-config-changed', networkId, config });
    } catch (error) {
      logger.error('UserExplorerConfigService', 'Failed to save explorer config:', error);
    }
  }

  /**
   * Retrieves a user explorer configuration for a specific network.
   * @param networkId The network identifier
   * @returns The stored configuration or null if not found
   */
  static getUserExplorerConfig(networkId: string): UserExplorerConfig | null {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${networkId}`;
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        return null;
      }

      const config = JSON.parse(stored) as UserExplorerConfig;
      logger.info(
        'UserExplorerConfigService',
        `Retrieved explorer config for network ${networkId}`
      );
      return config;
    } catch (error) {
      logger.error('UserExplorerConfigService', 'Failed to retrieve explorer config:', error);
      return null;
    }
  }

  /**
   * Clears a user explorer configuration for a specific network.
   * @param networkId The network identifier
   */
  static clearUserExplorerConfig(networkId: string): void {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${networkId}`;
      localStorage.removeItem(storageKey);
      logger.info('UserExplorerConfigService', `Cleared explorer config for network ${networkId}`);

      // Emit change event
      this.emitEvent({ type: 'explorer-config-cleared', networkId });
    } catch (error) {
      logger.error('UserExplorerConfigService', 'Failed to clear explorer config:', error);
    }
  }

  /**
   * Clears all user explorer configurations.
   */
  static clearAllUserExplorerConfigs(): void {
    try {
      const keysToRemove: string[] = [];

      // Find all explorer config keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      // Remove all found keys
      keysToRemove.forEach((key) => {
        const networkId = key.substring(this.STORAGE_PREFIX.length);
        localStorage.removeItem(key);
        // Emit clear event for each network
        this.emitEvent({ type: 'explorer-config-cleared', networkId });
      });

      logger.info('UserExplorerConfigService', `Cleared ${keysToRemove.length} explorer configs`);
    } catch (error) {
      logger.error('UserExplorerConfigService', 'Failed to clear all explorer configs:', error);
    }
  }
}

// Export as singleton instance for convenience
export const userExplorerConfigService = UserExplorerConfigService;
