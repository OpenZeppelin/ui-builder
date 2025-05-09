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
 * Feature flags for enabling/disabling application features.
 * Keyed by the feature flag name.
 */
export interface FeatureFlags {
  [flagName: string]: boolean;
}

/**
 * The main application runtime configuration structure.
 * This object holds all configurable parameters for the application.
 */
export interface AppRuntimeConfig {
  /** Configurations for various network-related services like block explorers. */
  networkServiceConfigs?: NetworkServiceConfigs;

  /** Feature flags to toggle application behavior. */
  featureFlags?: FeatureFlags;

  /** Default language for the application (e.g., "en", "es"). */
  defaultLanguage?: string;

  // Add other global or feature-specific settings here as needed.
  // Example:
  // uiSettings?: {
  //   theme?: 'light' | 'dark' | 'system';
  //   contractStateWidgetVisibleByDefault?: boolean;
  // };
}
