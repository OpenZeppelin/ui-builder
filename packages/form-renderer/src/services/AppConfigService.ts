import type {
  AppRuntimeConfig,
  FeatureFlags,
  NetworkServiceConfigs,
} from '@openzeppelin/transaction-form-types';

import { logger } from '../utils/logger';

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
      featureFlags: {},
      defaultLanguage: 'en',
    };
    logger.info(LOG_SYSTEM, 'Service initialized with default configuration.');
  }

  private loadFromViteEnvironment(envSource: ViteEnv | undefined): void {
    if (typeof envSource === 'undefined') {
      logger.warn(
        LOG_SYSTEM,
        'Vite environment object was not provided or is undefined. Skipping Vite env load.'
      );
      return;
    }
    const env = envSource;

    const loadedNetworkServiceConfigs: NetworkServiceConfigs = {};
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
    this.config.featureFlags = {
      ...this.config.featureFlags,
      ...loadedFeatureFlags,
    };

    logger.info(
      LOG_SYSTEM,
      'Configuration loaded/merged from provided Vite environment variables.'
    );
  }

  public async initialize(strategies: ConfigLoadStrategy[]): Promise<void> {
    logger.info(LOG_SYSTEM, 'Initialization sequence started with strategies:', strategies);
    for (const strategy of strategies) {
      if (strategy.type === 'viteEnv') {
        this.loadFromViteEnvironment(strategy.env);
      }
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

  public isFeatureEnabled(flagName: string): boolean {
    if (!this.isInitialized) {
      logger.warn(LOG_SYSTEM, 'isFeatureEnabled called before initialization.');
    }
    return this.config.featureFlags?.[flagName.toLowerCase()] ?? false;
  }

  /**
   * Returns the entire configuration object.
   * Primarily for debugging or for parts of the app that need a broader view.
   * Use specific getters like `getExplorerApiKey` or `isFeatureEnabled` where possible.
   */
  public getConfig(): Readonly<AppRuntimeConfig> {
    return this.config;
  }
}
