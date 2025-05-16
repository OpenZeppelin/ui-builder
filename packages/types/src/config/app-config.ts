/**
 * Configuration types for the runtime application.
 * These types define the structure for application-wide configurations,
 * including API keys, feature flags, and other settings.
 * @packageDocumentation
 */

/**
 * Configuration for specific explorer/network services.
 */
export interface ExplorerApiConfig {
  /** The API key for this specific service. */
  apiKey?: string;
  // Future potential fields:
  // rateLimitPerSecond?: number;
  // customHeaders?: Record<string, string>;
}

/**
 * A collection of configurations for various network services,
 * keyed by a unique service identifier.
 * Example identifiers: "etherscan-mainnet", "polygonscan-matic", "arbiscan-mainnet"
 */
export interface NetworkServiceConfigs {
  [serviceIdentifier: string]: ExplorerApiConfig | undefined;
}

/**
 * Generic configuration for a service parameter.
 *
 * This can contain:
 * - Primitive values (string, number, boolean)
 * - Nested objects for more complex configuration
 * - Arrays of primitive values or objects
 */
export interface ServiceParameterConfig {
  [paramName: string]: string | number | boolean | object | Array<unknown> | undefined;
}

/**
 * A collection of configurations for global services, keyed by service name.
 * Adapters or services will look up their specific configurations here.
 * Example: globalServiceConfigs['walletconnect']?.['projectId']
 */
export interface GlobalServiceConfigs {
  [serviceName: string]: ServiceParameterConfig | undefined;
}

/**
 * Feature flags for enabling/disabling application features.
 * Keyed by the feature flag name.
 */
export interface FeatureFlags {
  [flagName: string]: boolean;
}

/**
 * Configuration for an RPC endpoint, allowing for different transport types.
 */
export interface RpcEndpointConfig {
  http?: string;
  webSocket?: string; // For future use if WebSocket RPCs are needed
}

/**
 * A collection of RPC endpoint overrides, keyed by network ID (e.g., networkConfig.id).
 * Values can be a simple string (assumed to be HTTP) or an RpcEndpointConfig object.
 */
export interface NetworkSpecificRpcEndpoints {
  [networkId: string]: string | RpcEndpointConfig | undefined;
}

/**
 * The main application runtime configuration structure.
 * This object holds all configurable parameters for the application.
 */
export interface AppRuntimeConfig {
  /** Configurations for various network-related services like block explorers. */
  networkServiceConfigs?: NetworkServiceConfigs;

  /** Configurations for global services. */
  globalServiceConfigs?: GlobalServiceConfigs;

  /** Feature flags to toggle application behavior. */
  featureFlags?: FeatureFlags;

  /** Default language for the application (e.g., "en", "es"). */
  defaultLanguage?: string;

  /** RPC endpoint overrides for different networks. */
  rpcEndpoints?: NetworkSpecificRpcEndpoints;

  // Add other global or feature-specific settings here as needed.
  // Example:
  // uiSettings?: {
  //   theme?: 'light' | 'dark' | 'system';
  //   contractStateWidgetVisibleByDefault?: boolean;
  // };
}
