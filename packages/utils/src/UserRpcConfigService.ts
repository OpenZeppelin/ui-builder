import type { UserRpcProviderConfig } from '@openzeppelin/transaction-form-types';

import { logger } from './logger';

// Event types
type RpcConfigEventType = 'rpc-config-changed' | 'rpc-config-cleared';

export interface RpcConfigEvent {
  type: RpcConfigEventType;
  networkId: string;
  config?: UserRpcProviderConfig;
}

/**
 * Service for managing user-configured RPC endpoints.
 * Stores RPC configurations in localStorage for persistence across sessions.
 */
export class UserRpcConfigService {
  private static readonly STORAGE_PREFIX = 'tfb_rpc_config_';
  private static readonly eventListeners = new Map<string, Set<(event: RpcConfigEvent) => void>>();

  /**
   * Emits an RPC configuration event to all registered listeners
   */
  private static emitEvent(event: RpcConfigEvent): void {
    const listeners = this.eventListeners.get(event.networkId) || new Set();
    const globalListeners = this.eventListeners.get('*') || new Set();

    [...listeners, ...globalListeners].forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        logger.error('UserRpcConfigService', 'Error in event listener:', error);
      }
    });
  }

  /**
   * Subscribes to RPC configuration changes for a specific network or all networks
   * @param networkId The network identifier or '*' for all networks
   * @param listener The callback to invoke when RPC config changes
   * @returns Unsubscribe function
   */
  static subscribe(networkId: string, listener: (event: RpcConfigEvent) => void): () => void {
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
   * Saves a user RPC configuration for a specific network.
   * @param networkId The network identifier
   * @param config The RPC configuration to save
   */
  static saveUserRpcConfig(networkId: string, config: UserRpcProviderConfig): void {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${networkId}`;
      localStorage.setItem(storageKey, JSON.stringify(config));
      logger.info('UserRpcConfigService', `Saved RPC config for network ${networkId}`);

      // Emit change event
      this.emitEvent({ type: 'rpc-config-changed', networkId, config });
    } catch (error) {
      logger.error('UserRpcConfigService', 'Failed to save RPC config:', error);
    }
  }

  /**
   * Retrieves a user RPC configuration for a specific network.
   * @param networkId The network identifier
   * @returns The stored configuration or null if not found
   */
  static getUserRpcConfig(networkId: string): UserRpcProviderConfig | null {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${networkId}`;
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        return null;
      }

      const config = JSON.parse(stored) as UserRpcProviderConfig;
      logger.info('UserRpcConfigService', `Retrieved RPC config for network ${networkId}`);
      return config;
    } catch (error) {
      logger.error('UserRpcConfigService', 'Failed to retrieve RPC config:', error);
      return null;
    }
  }

  /**
   * Clears a user RPC configuration for a specific network.
   * @param networkId The network identifier
   */
  static clearUserRpcConfig(networkId: string): void {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${networkId}`;
      localStorage.removeItem(storageKey);
      logger.info('UserRpcConfigService', `Cleared RPC config for network ${networkId}`);

      // Emit change event
      this.emitEvent({ type: 'rpc-config-cleared', networkId });
    } catch (error) {
      logger.error('UserRpcConfigService', 'Failed to clear RPC config:', error);
    }
  }

  /**
   * Clears all user RPC configurations.
   */
  static clearAllUserRpcConfigs(): void {
    try {
      const keysToRemove: string[] = [];

      // Find all RPC config keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      // Remove all found keys
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      logger.info('UserRpcConfigService', `Cleared ${keysToRemove.length} RPC configs`);
    } catch (error) {
      logger.error('UserRpcConfigService', 'Failed to clear all RPC configs:', error);
    }
  }
}

// Export as singleton instance for convenience
export const userRpcConfigService = UserRpcConfigService;
