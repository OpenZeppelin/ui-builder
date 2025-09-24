import type {
  AppRuntimeConfig,
  FeatureFlags,
  GlobalServiceConfigs,
  NetworkServiceConfigs,
  NetworkSpecificRpcEndpoints,
  RpcEndpointConfig,
  ServiceParameterConfig,
  UiKitName,
  UserRpcProviderConfig,
} from '@openzeppelin/ui-builder-types';

import { logger } from './logger';

// Changed from @openzeppelin/ui-builder-utils

/**
 * Type for the strategy array in initialize method.
 */
export type ConfigLoadStrategy =
  | { type: 'viteEnv'; env: ViteEnv | undefined }
  | { type: 'json'; path?: string }
  | { type: 'localStorage'; key?: string };

const VITE_ENV_PREFIX = 'VITE_APP_CFG_';
const LOG_SYSTEM = 'AppConfigService'; // Define a constant for the system name

// Define a type for Vite's import.meta.env structure if it exists
interface ViteEnv {
  [key: string]: string | boolean | undefined;
}

/**
 * AppConfigService
 *
 * Responsible for loading, merging, and providing access to the application's
 * runtime configuration (`AppRuntimeConfig`).
 */
export class AppConfigService {
  private config: AppRuntimeConfig;
  private isInitialized = false;

  constructor() {
    // Initialize with sensible hardcoded defaults
    this.config = {
      networkServiceConfigs: {},
      globalServiceConfigs: {},
      rpcEndpoints: {},
      featureFlags: {},
      defaultLanguage: 'en',
    };
    logger.info(LOG_SYSTEM, 'Service initialized with default configuration.');
  }

  private loadFromViteEnvironment(envSource: ViteEnv | undefined): void {
    logger.debug(
      LOG_SYSTEM,
      'BEGIN loadFromViteEnvironment. envSource received:',
      envSource ? JSON.stringify(envSource) : 'undefined'
    );

    if (typeof envSource === 'undefined') {
      logger.warn(
        LOG_SYSTEM,
        'Vite environment object (envSource) was undefined. Skipping Vite env load.'
      );
      return;
    }
    const env = envSource;
    const loadedNetworkServiceConfigs: NetworkServiceConfigs = {};
    const loadedGlobalServiceConfigs: GlobalServiceConfigs = {};
    const loadedRpcEndpoints: NetworkSpecificRpcEndpoints = {};
    const loadedFeatureFlags: FeatureFlags = {};

    for (const key in env) {
      if (Object.prototype.hasOwnProperty.call(env, key) && env[key] !== undefined) {
        const value = String(env[key]);

        if (key.startsWith(`${VITE_ENV_PREFIX}API_KEY_`)) {
          const serviceIdSuffix = key.substring(`${VITE_ENV_PREFIX}API_KEY_`.length);
          const serviceIdentifier = serviceIdSuffix.toLowerCase().replace(/_/g, '-');
          if (!loadedNetworkServiceConfigs[serviceIdentifier]) {
            loadedNetworkServiceConfigs[serviceIdentifier] = {};
          }
          loadedNetworkServiceConfigs[serviceIdentifier]!.apiKey = value;
        } else if (key.startsWith(`${VITE_ENV_PREFIX}SERVICE_`)) {
          const fullSuffix = key.substring(`${VITE_ENV_PREFIX}SERVICE_`.length); // e.g., WALLETCONNECT_PROJECT_ID or ANOTHER_SERVICE_API_URL

          const firstUnderscoreIndex = fullSuffix.indexOf('_');
          if (firstUnderscoreIndex > 0 && firstUnderscoreIndex < fullSuffix.length - 1) {
            // Ensure underscore is present and not at start/end
            const serviceName = fullSuffix.substring(0, firstUnderscoreIndex).toLowerCase(); // e.g., "walletconnect", "anotherservice"
            const paramNameRaw = fullSuffix.substring(firstUnderscoreIndex + 1); // e.g., "PROJECT_ID", "API_URL"

            // Convert paramNameRaw (e.g., PROJECT_ID or API_URL) to camelCase (projectId, apiUrl)
            const paramName = paramNameRaw
              .toLowerCase()
              .replace(/_([a-z])/g, (g) => g[1].toUpperCase());

            if (serviceName && paramName) {
              if (!loadedGlobalServiceConfigs[serviceName]) {
                loadedGlobalServiceConfigs[serviceName] = {};
              }
              loadedGlobalServiceConfigs[serviceName]![paramName] = value;
              logger.debug(
                LOG_SYSTEM,
                `Parsed service: '${serviceName}', param: '${paramName}', value: '${value}' from key: ${key}`
              );
            } else {
              logger.warn(LOG_SYSTEM, `Could not effectively parse service/param from key: ${key}`);
            }
          } else {
            logger.warn(
              LOG_SYSTEM,
              `Could not determine service and param from key (missing underscore separator): ${key}`
            );
          }
        } else if (key === `${VITE_ENV_PREFIX}WALLETCONNECT_PROJECT_ID`) {
          // Directly handle the VITE_APP_CFG_WALLETCONNECT_PROJECT_ID case
          if (!loadedGlobalServiceConfigs.walletconnect) {
            loadedGlobalServiceConfigs.walletconnect = {};
          }
          loadedGlobalServiceConfigs.walletconnect.projectId = value;
          logger.debug(
            LOG_SYSTEM,
            `Parsed WalletConnect Project ID directly from key: ${key}, value: ${value}`
          );
        } else if (key.startsWith(`${VITE_ENV_PREFIX}RPC_ENDPOINT_`)) {
          const networkIdSuffix = key.substring(`${VITE_ENV_PREFIX}RPC_ENDPOINT_`.length);
          const networkId = networkIdSuffix.toLowerCase().replace(/_/g, '-');
          if (networkId) {
            loadedRpcEndpoints[networkId] = value;
            logger.debug(LOG_SYSTEM, `Loaded RPC override for ${networkId}: ${value}`);
          }
        } else if (key.startsWith(`${VITE_ENV_PREFIX}FEATURE_FLAG_`)) {
          const flagNameSuffix = key.substring(`${VITE_ENV_PREFIX}FEATURE_FLAG_`.length);
          const flagName = flagNameSuffix.toLowerCase();
          loadedFeatureFlags[flagName] = value.toLowerCase() === 'true';
        } else if (key === `${VITE_ENV_PREFIX}DEFAULT_LANGUAGE`) {
          this.config.defaultLanguage = value;
        }
      }
    }

    this.config.networkServiceConfigs = {
      ...this.config.networkServiceConfigs,
      ...loadedNetworkServiceConfigs,
    };
    if (Object.keys(loadedGlobalServiceConfigs).length > 0) {
      if (!this.config.globalServiceConfigs) this.config.globalServiceConfigs = {};
      for (const serviceKeyInLoaded in loadedGlobalServiceConfigs) {
        if (Object.prototype.hasOwnProperty.call(loadedGlobalServiceConfigs, serviceKeyInLoaded)) {
          this.config.globalServiceConfigs[serviceKeyInLoaded] = {
            ...(this.config.globalServiceConfigs[serviceKeyInLoaded] || {}),
            ...loadedGlobalServiceConfigs[serviceKeyInLoaded],
          };
        }
      }
    }
    if (Object.keys(loadedRpcEndpoints).length > 0) {
      if (!this.config.rpcEndpoints) this.config.rpcEndpoints = {};
      for (const networkKey in loadedRpcEndpoints) {
        if (Object.prototype.hasOwnProperty.call(loadedRpcEndpoints, networkKey)) {
          this.config.rpcEndpoints[networkKey] = loadedRpcEndpoints[networkKey];
        }
      }
    }
    this.config.featureFlags = { ...this.config.featureFlags, ...loadedFeatureFlags };

    logger.info(
      LOG_SYSTEM,
      'Resolved globalServiceConfigs after Vite env processing:',
      this.config.globalServiceConfigs
        ? JSON.stringify(this.config.globalServiceConfigs)
        : 'undefined'
    );
    logger.info(
      LOG_SYSTEM,
      'Resolved rpcEndpoints after Vite env processing:',
      this.config.rpcEndpoints ? JSON.stringify(this.config.rpcEndpoints) : 'undefined'
    );
    logger.info(
      LOG_SYSTEM,
      'Configuration loaded/merged from provided Vite environment variables.'
    );
  }

  private async loadFromJson(filePath = '/app.config.json'): Promise<void> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        // It's okay if the file is not found, could be optional or for specific environments
        if (response.status === 404) {
          logger.info(
            LOG_SYSTEM,
            `Optional configuration file not found at ${filePath}. Skipping.`
          );
        } else {
          logger.warn(
            LOG_SYSTEM,
            `Failed to fetch config from ${filePath}: ${response.status} ${response.statusText}`
          );
        }
        return;
      }
      const externalConfig = (await response.json()) as Partial<AppRuntimeConfig>; // Use Partial for safer merging

      if (externalConfig.networkServiceConfigs) {
        if (!this.config.networkServiceConfigs) this.config.networkServiceConfigs = {};
        for (const key in externalConfig.networkServiceConfigs) {
          if (Object.prototype.hasOwnProperty.call(externalConfig.networkServiceConfigs, key)) {
            this.config.networkServiceConfigs[key] = {
              ...(this.config.networkServiceConfigs[key] || {}),
              ...externalConfig.networkServiceConfigs[key],
            };
          }
        }
      }

      if (externalConfig.globalServiceConfigs) {
        if (!this.config.globalServiceConfigs) this.config.globalServiceConfigs = {};
        for (const serviceKey in externalConfig.globalServiceConfigs) {
          if (
            Object.prototype.hasOwnProperty.call(externalConfig.globalServiceConfigs, serviceKey)
          ) {
            this.config.globalServiceConfigs[serviceKey] = {
              ...(this.config.globalServiceConfigs[serviceKey] || {}),
              ...externalConfig.globalServiceConfigs[serviceKey],
            };
          }
        }
      }

      if (externalConfig.rpcEndpoints) {
        if (!this.config.rpcEndpoints) this.config.rpcEndpoints = {};
        for (const networkKey in externalConfig.rpcEndpoints) {
          if (Object.prototype.hasOwnProperty.call(externalConfig.rpcEndpoints, networkKey)) {
            this.config.rpcEndpoints[networkKey] = externalConfig.rpcEndpoints[networkKey];
          }
        }
      }

      if (externalConfig.featureFlags) {
        this.config.featureFlags = {
          ...(this.config.featureFlags || {}),
          ...externalConfig.featureFlags,
        };
      }

      if (typeof externalConfig.defaultLanguage === 'string') {
        this.config.defaultLanguage = externalConfig.defaultLanguage;
      }
      // Add merging for other AppRuntimeConfig properties here

      logger.info(LOG_SYSTEM, `Configuration loaded/merged from ${filePath}`);
    } catch (error) {
      logger.error(LOG_SYSTEM, `Error loading or parsing config from ${filePath}:`, error);
    }
  }

  public async initialize(strategies: ConfigLoadStrategy[]): Promise<void> {
    logger.info(LOG_SYSTEM, 'Initialization sequence started with strategies:', strategies);
    // Ensure strategies are processed in defined order of precedence
    // Example: Defaults (in constructor) -> Vite Env -> JSON -> LocalStorage

    for (const strategy of strategies) {
      if (strategy.type === 'viteEnv') {
        this.loadFromViteEnvironment(strategy.env);
      } else if (strategy.type === 'json') {
        await this.loadFromJson(strategy.path);
      }
      // Add localStorage strategy in Phase 4
    }
    this.isInitialized = true;
    logger.info(LOG_SYSTEM, 'Initialization complete.');
  }

  public getExplorerApiKey(serviceIdentifier: string): string | undefined {
    if (!this.isInitialized) {
      logger.warn(LOG_SYSTEM, 'getExplorerApiKey called before initialization.');
    }
    return this.config.networkServiceConfigs?.[serviceIdentifier]?.apiKey;
  }

  public getGlobalServiceConfig(serviceName: string): ServiceParameterConfig | undefined {
    if (!this.isInitialized) {
      logger.warn(LOG_SYSTEM, 'getGlobalServiceConfig called before initialization.');
    }
    return this.config.globalServiceConfigs?.[serviceName];
  }

  public isFeatureEnabled(flagName: string): boolean {
    if (!this.isInitialized) {
      logger.warn(LOG_SYSTEM, 'isFeatureEnabled called before initialization.');
    }
    return this.config.featureFlags?.[flagName.toLowerCase()] ?? false;
  }

  /**
   * Gets a global service parameter value.
   * @param serviceName The name of the service
   * @param paramName The name of the parameter
   * @returns The parameter value (can be any type including objects, arrays) or undefined if not found
   */
  public getGlobalServiceParam(
    serviceName: string,
    paramName: string
  ): string | number | boolean | object | Array<unknown> | undefined {
    if (!this.isInitialized) {
      logger.warn(LOG_SYSTEM, 'getGlobalServiceParam called before initialization.');
      return undefined;
    }
    const serviceParams = this.config.globalServiceConfigs?.[serviceName.toLowerCase()];
    // Parameter names are stored in camelCase (e.g., projectId)
    return serviceParams?.[paramName];
  }

  public getRpcEndpointOverride(
    networkId: string
  ): string | RpcEndpointConfig | UserRpcProviderConfig | undefined {
    if (!this.isInitialized) {
      logger.warn(LOG_SYSTEM, 'getRpcEndpointOverride called before initialization.');
    }
    return this.config.rpcEndpoints?.[networkId];
  }

  /**
   * Returns the entire configuration object.
   * Primarily for debugging or for parts of the app that need a broader view.
   * Use specific getters like `getExplorerApiKey` or `isFeatureEnabled` where possible.
   */
  public getConfig(): Readonly<AppRuntimeConfig> {
    return this.config;
  }

  /**
   * Gets a nested configuration object with type safety.
   *
   * This is a helper method to safely access complex nested configuration objects
   * with proper TypeScript type checking.
   *
   * @param serviceName The name of the service (e.g., 'walletui')
   * @param paramName The parameter name that contains the nested object (e.g., 'config')
   *                  Pass an empty string to get the entire service configuration.
   * @returns The typed nested configuration object or undefined if not found
   *
   * @example
   * // Get a typed UI kit configuration:
   * const uiConfig = appConfigService.getTypedNestedConfig<UiKitConfiguration>('walletui', 'config');
   * if (uiConfig) {
   *   console.log(uiConfig.kitName); // Properly typed
   * }
   *
   * // Get entire service configuration:
   * const allAnalytics = appConfigService.getTypedNestedConfig<AnalyticsConfig>('analytics', '');
   */
  public getTypedNestedConfig<T extends object>(
    serviceName: string,
    paramName: string
  ): T | undefined {
    if (!this.isInitialized) {
      logger.warn(LOG_SYSTEM, 'getTypedNestedConfig called before initialization.');
      return undefined;
    }

    try {
      // If paramName is empty, return the entire service configuration
      if (paramName === '') {
        const serviceConfig = this.config.globalServiceConfigs?.[serviceName.toLowerCase()];
        if (serviceConfig && typeof serviceConfig === 'object') {
          return serviceConfig as T;
        }
        return undefined;
      }

      // Otherwise, get the specific nested parameter
      const param = this.getGlobalServiceParam(serviceName, paramName);

      if (param && typeof param === 'object') {
        // We've confirmed it's an object, so we can safely cast it
        return param as T;
      }

      return undefined;
    } catch (error) {
      logger.warn(
        LOG_SYSTEM,
        `Error accessing nested configuration for ${serviceName}.${paramName}:`,
        error
      );
      return undefined;
    }
  }

  /**
   * Checks if a nested configuration exists and has a specific property.
   *
   * @param serviceName The name of the service
   * @param paramName The parameter name containing the nested object
   * @param propName The property name to check for
   * @returns True if the property exists in the nested configuration
   *
   * @example
   * if (appConfigService.hasNestedConfigProperty('walletui', 'config', 'showInjectedConnector')) {
   *   // Do something when the property exists
   * }
   */
  public hasNestedConfigProperty(
    serviceName: string,
    paramName: string,
    propName: string
  ): boolean {
    const nestedConfig = this.getTypedNestedConfig<Record<string, unknown>>(serviceName, paramName);

    return (
      nestedConfig !== undefined && Object.prototype.hasOwnProperty.call(nestedConfig, propName)
    );
  }

  /**
   * Gets wallet UI configuration for a specific ecosystem.
   * Uses ecosystem-namespaced format with optional default fallback.
   *
   * @param ecosystemId The ecosystem ID (e.g., 'stellar', 'evm', 'solana')
   * @returns The wallet UI configuration for the ecosystem, or undefined
   *
   * @example
   * Configuration format:
   * {
   *   "globalServiceConfigs": {
   *     "walletui": {
   *       "stellar": { "kitName": "stellar-wallets-kit", "kitConfig": {} },
   *       "evm": { "kitName": "rainbowkit", "kitConfig": {} },
   *       "default": { "kitName": "custom", "kitConfig": {} }
   *     }
   *   }
   * }
   * const stellarConfig = appConfigService.getWalletUIConfig('stellar');
   */
  public getWalletUIConfig<
    T extends object = { kitName: UiKitName; kitConfig?: Record<string, unknown> },
  >(ecosystemId?: string): T | undefined {
    if (!this.isInitialized) {
      logger.warn(LOG_SYSTEM, 'getWalletUIConfig called before initialization.');
      return undefined;
    }

    try {
      const walletUIService = this.config.globalServiceConfigs?.walletui;

      if (!walletUIService) {
        return undefined;
      }

      // Check for new ecosystem-namespaced format
      if (
        ecosystemId &&
        walletUIService[ecosystemId] &&
        typeof walletUIService[ecosystemId] === 'object'
      ) {
        logger.debug(LOG_SYSTEM, `Found ecosystem-specific wallet UI config for ${ecosystemId}`);
        return walletUIService[ecosystemId] as T;
      }

      // Check for default config in new format
      if (walletUIService.default && typeof walletUIService.default === 'object') {
        logger.debug(LOG_SYSTEM, `Using default wallet UI config for ecosystem ${ecosystemId}`);
        return walletUIService.default as T;
      }

      return undefined;
    } catch (error) {
      logger.warn(
        LOG_SYSTEM,
        `Error accessing wallet UI configuration for ecosystem ${ecosystemId}:`,
        error
      );
      return undefined;
    }
  }
}

// Create a singleton instance of the AppConfigService
export const appConfigService = new AppConfigService();
