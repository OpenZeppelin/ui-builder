import { logger } from './logger';

/**
 * Event types emitted by UserNetworkServiceConfigService
 */
type ServiceConfigEventType = 'service-config-changed' | 'service-config-cleared';

/**
 * Event emitted when a service configuration changes or is cleared.
 * Used for subscribing to configuration updates across the application.
 *
 * @interface ServiceConfigEvent
 */
export interface ServiceConfigEvent {
  /** Type of event: config changed or cleared */
  type: ServiceConfigEventType;
  /** Network ID for which the configuration changed */
  networkId: string;
  /** Service ID (e.g., 'rpc', 'explorer', 'contract-definitions') */
  serviceId: string;
  /** The new configuration data (only present for 'service-config-changed' events) */
  config?: Record<string, unknown>;
}

/**
 * Service for managing user-defined network service configurations.
 *
 * This service provides a generic, chain-agnostic way to store and retrieve
 * per-network, per-service user configurations.
 *
 * Configurations are stored in localStorage with the key format:
 * `tfb_service_config_{serviceId}__{networkId}`
 *
 * @example
 * ```typescript
 * // Save RPC configuration for Sepolia
 * userNetworkServiceConfigService.save('ethereum-sepolia', 'rpc', {
 *   rpcUrl: 'https://sepolia.infura.io/v3/your-key'
 * });
 *
 * // Retrieve configuration
 * const config = userNetworkServiceConfigService.get('ethereum-sepolia', 'rpc');
 *
 * // Subscribe to changes
 * const unsubscribe = userNetworkServiceConfigService.subscribe(
 *   'ethereum-sepolia',
 *   'rpc',
 *   (event) => {
 *     console.log('Config changed:', event.config);
 *   }
 * );
 * ```
 *
 * @class UserNetworkServiceConfigService
 */
export class UserNetworkServiceConfigService {
  private static readonly STORAGE_PREFIX = 'tfb_service_config_';
  private static readonly listeners = new Map<string, Set<(event: ServiceConfigEvent) => void>>();

  /**
   * Generates a localStorage key for a network-service combination.
   *
   * @private
   * @param networkId - The network ID
   * @param serviceId - The service ID
   * @returns The storage key string
   */
  private static key(networkId: string, serviceId: string): string {
    return `${this.STORAGE_PREFIX}${serviceId}__${networkId}`;
  }

  /**
   * Subscribes to configuration change events for a specific network and/or service.
   *
   * Use '*' as a wildcard to listen to all networks or all services.
   * The listener will be called whenever a matching configuration changes or is cleared.
   *
   * @param networkId - Network ID to listen to, or '*' for all networks
   * @param serviceId - Service ID to listen to, or '*' for all services
   * @param listener - Callback function to invoke when matching events occur
   * @returns Unsubscribe function to remove the listener
   *
   * @example
   * ```typescript
   * // Listen to all RPC config changes across all networks
   * const unsubscribe = userNetworkServiceConfigService.subscribe('*', 'rpc', (event) => {
   *   console.log(`${event.networkId} RPC config changed`);
   * });
   *
   * // Later, unsubscribe
   * unsubscribe();
   * ```
   */
  static subscribe(
    networkId: string | '*',
    serviceId: string | '*',
    listener: (event: ServiceConfigEvent) => void
  ): () => void {
    const k = `${networkId}:${serviceId}`;
    if (!this.listeners.has(k)) this.listeners.set(k, new Set());
    this.listeners.get(k)!.add(listener);
    return () => {
      const set = this.listeners.get(k);
      if (set) {
        set.delete(listener);
        if (set.size === 0) this.listeners.delete(k);
      }
    };
  }

  /**
   * Emits an event to all matching subscribers.
   * Subscribers are matched based on exact network/service IDs or wildcards.
   *
   * @private
   * @param event - The event to emit
   */
  private static emit(event: ServiceConfigEvent): void {
    const targets = [
      `${event.networkId}:${event.serviceId}`,
      `${event.networkId}:*`,
      `*:${event.serviceId}`,
      `*:*`,
    ];
    for (const k of targets) {
      const set = this.listeners.get(k);
      if (!set) continue;
      for (const fn of set) {
        try {
          fn(event);
        } catch (e) {
          logger.error('UserNetworkServiceConfigService', 'Error in event listener:', e);
        }
      }
    }
  }

  /**
   * Saves a service configuration for a specific network.
   *
   * The configuration is stored in localStorage and all matching subscribers
   * are notified via a 'service-config-changed' event.
   *
   * @param networkId - The network ID (e.g., 'ethereum-sepolia')
   * @param serviceId - The service ID (e.g., 'rpc', 'explorer', 'contract-definitions')
   * @param config - The configuration object to save
   *
   * @example
   * ```typescript
   * userNetworkServiceConfigService.save('ethereum-sepolia', 'rpc', {
   *   rpcUrl: 'https://sepolia.infura.io/v3/your-key'
   * });
   * ```
   */
  static save(networkId: string, serviceId: string, config: Record<string, unknown>): void {
    try {
      localStorage.setItem(this.key(networkId, serviceId), JSON.stringify(config));
      logger.info(
        'UserNetworkServiceConfigService',
        `Saved config for ${serviceId} on network ${networkId}`
      );
      this.emit({ type: 'service-config-changed', networkId, serviceId, config });
    } catch (e) {
      logger.error('UserNetworkServiceConfigService', 'Failed to save config:', e);
    }
  }

  /**
   * Retrieves a saved service configuration for a specific network.
   *
   * @param networkId - The network ID (e.g., 'ethereum-sepolia')
   * @param serviceId - The service ID (e.g., 'rpc', 'explorer', 'contract-definitions')
   * @returns The configuration object, or null if not found or if retrieval fails
   *
   * @example
   * ```typescript
   * const config = userNetworkServiceConfigService.get('ethereum-sepolia', 'rpc');
   * if (config) {
   *   console.log('RPC URL:', config.rpcUrl);
   * }
   * ```
   */
  static get(networkId: string, serviceId: string): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(this.key(networkId, serviceId));
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch (e) {
      logger.error('UserNetworkServiceConfigService', 'Failed to retrieve config:', e);
      return null;
    }
  }

  /**
   * Clears a saved service configuration for a specific network.
   *
   * Removes the configuration from localStorage and notifies all matching subscribers
   * via a 'service-config-cleared' event.
   *
   * @param networkId - The network ID (e.g., 'ethereum-sepolia')
   * @param serviceId - The service ID (e.g., 'rpc', 'explorer', 'contract-definitions')
   *
   * @example
   * ```typescript
   * userNetworkServiceConfigService.clear('ethereum-sepolia', 'rpc');
   * ```
   */
  static clear(networkId: string, serviceId: string): void {
    try {
      localStorage.removeItem(this.key(networkId, serviceId));
      logger.info(
        'UserNetworkServiceConfigService',
        `Cleared config for ${serviceId} on network ${networkId}`
      );
      this.emit({ type: 'service-config-cleared', networkId, serviceId });
    } catch (e) {
      logger.error('UserNetworkServiceConfigService', 'Failed to clear config:', e);
    }
  }
}

/**
 * Singleton instance of UserNetworkServiceConfigService.
 * This is the preferred way to access the service.
 *
 * @example
 * ```typescript
 * import { userNetworkServiceConfigService } from '@openzeppelin/ui-builder-utils';
 *
 * userNetworkServiceConfigService.save('ethereum-sepolia', 'rpc', { rpcUrl: '...' });
 * ```
 */
export const userNetworkServiceConfigService = UserNetworkServiceConfigService;
