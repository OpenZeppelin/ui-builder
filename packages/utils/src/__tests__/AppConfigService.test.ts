import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import AppRuntimeConfig for typing mock JSON
import type { AppRuntimeConfig } from '@openzeppelin/contracts-ui-builder-types';

// Import the original logger to be mocked, and the service to be tested
import { AppConfigService } from '../AppConfigService';
// Adjusted path
import { logger } from '../logger';

// This will be the mocked version

// Mock the logger from the local path
// This ensures that any calls to logger within AppConfigService use the mock
vi.mock('../logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../logger')>();
  return {
    ...actual, // Spread actual to ensure other exports (like appConfigService singleton) are not lost
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('AppConfigService', () => {
  let appConfigServiceInstance: AppConfigService;
  let mockViteEnv: Record<string, string | boolean | undefined>;

  beforeEach(() => {
    // Each test gets a fresh instance of AppConfigService to ensure isolation
    appConfigServiceInstance = new AppConfigService();
    mockViteEnv = {}; // Reset mock env for each test
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('constructor & defaultConfig', () => {
    it('should initialize with default configurations', () => {
      const config = appConfigServiceInstance.getConfig();
      expect(config.networkServiceConfigs).toEqual({});
      expect(config.globalServiceConfigs).toEqual({});
      expect(config.rpcEndpoints).toEqual({});
      expect(config.featureFlags).toEqual({});
      expect(config.defaultLanguage).toBe('en');
      // AppConfigService constructor calls logger.info
      expect(logger.info).toHaveBeenCalledWith(
        'AppConfigService',
        'Service initialized with default configuration.'
      );
    });
  });

  describe('loadFromViteEnvironment', () => {
    it('should parse VITE_APP_CFG_API_KEY_ variables correctly', async () => {
      mockViteEnv['VITE_APP_CFG_API_KEY_ETHERSCAN_MAINNET'] = 'etherscan_key_123';
      mockViteEnv['VITE_APP_CFG_API_KEY_POLYGONSCAN_MAINNET'] = 'polygon_key_456';

      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);
      const config = appConfigServiceInstance.getConfig();

      expect(config.networkServiceConfigs?.['etherscan-mainnet']?.apiKey).toBe('etherscan_key_123');
      expect(config.networkServiceConfigs?.['polygonscan-mainnet']?.apiKey).toBe('polygon_key_456');
    });

    it('should parse VITE_APP_CFG_SERVICE_ variables correctly into camelCase paramNames', async () => {
      mockViteEnv['VITE_APP_CFG_SERVICE_WALLETCONNECT_PROJECT_ID'] = 'wc_pid_789';
      mockViteEnv['VITE_APP_CFG_SERVICE_ANOTHERSERVICE_API_URL'] = 'http://api.anotherservice.com';

      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);
      const config = appConfigServiceInstance.getConfig();

      expect(config.globalServiceConfigs?.['walletconnect']?.['projectId']).toBe('wc_pid_789');
      expect(config.globalServiceConfigs?.['anotherservice']?.['apiUrl']).toBe(
        'http://api.anotherservice.com'
      );
    });

    it('should parse VITE_APP_CFG_RPC_ENDPOINT_ variables correctly', async () => {
      mockViteEnv['VITE_APP_CFG_RPC_ENDPOINT_ETHEREUM_MAINNET'] = 'https://mainnet.customrpc.com';
      mockViteEnv['VITE_APP_CFG_RPC_ENDPOINT_POLYGON_MAINNET'] = 'https://polygon.customrpc.com';

      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);
      const config = appConfigServiceInstance.getConfig();

      expect(config.rpcEndpoints?.['ethereum-mainnet']).toBe('https://mainnet.customrpc.com');
      expect(config.rpcEndpoints?.['polygon-mainnet']).toBe('https://polygon.customrpc.com');
    });

    it('should parse VITE_APP_CFG_FEATURE_FLAG_ variables correctly', async () => {
      mockViteEnv['VITE_APP_CFG_FEATURE_FLAG_SHOW_COOL_THING'] = 'true';
      mockViteEnv['VITE_APP_CFG_FEATURE_FLAG_HIDE_OLD_THING'] = 'false';
      mockViteEnv['VITE_APP_CFG_FEATURE_FLAG_OTHER_CASE'] = 'TRUE';

      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);
      const config = appConfigServiceInstance.getConfig();

      expect(appConfigServiceInstance.isFeatureEnabled('show_cool_thing')).toBe(true);
      expect(appConfigServiceInstance.isFeatureEnabled('hide_old_thing')).toBe(false);
      expect(appConfigServiceInstance.isFeatureEnabled('other_case')).toBe(true);
      expect(config.featureFlags?.['show_cool_thing']).toBe(true);
    });

    it('should handle analytics feature flag correctly', async () => {
      // Test analytics disabled by default
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: {} }]);
      expect(appConfigServiceInstance.isFeatureEnabled('analytics_enabled')).toBe(false);

      // Test analytics enabled via environment variable
      mockViteEnv['VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED'] = 'true';
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);

      expect(appConfigServiceInstance.isFeatureEnabled('analytics_enabled')).toBe(true);
      expect(appConfigServiceInstance.getConfig().featureFlags?.['analytics_enabled']).toBe(true);

      // Test case insensitivity
      mockViteEnv['VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED'] = 'TRUE';
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);
      expect(appConfigServiceInstance.isFeatureEnabled('analytics_enabled')).toBe(true);

      // Test disabled state
      mockViteEnv['VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED'] = 'false';
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);
      expect(appConfigServiceInstance.isFeatureEnabled('analytics_enabled')).toBe(false);
    });

    it('should parse VITE_APP_CFG_DEFAULT_LANGUAGE correctly', async () => {
      mockViteEnv['VITE_APP_CFG_DEFAULT_LANGUAGE'] = 'fr';
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);
      expect(appConfigServiceInstance.getConfig().defaultLanguage).toBe('fr');
    });

    it('should call logger.warn if envSource is undefined', async () => {
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: undefined }]);
      expect(logger.warn).toHaveBeenCalledWith(
        'AppConfigService',
        'Vite environment object (envSource) was undefined. Skipping Vite env load.'
      );
      const config = appConfigServiceInstance.getConfig();
      expect(config.defaultLanguage).toBe('en');
    });

    it('should process an empty env object without warnings', async () => {
      const initialWarnCount = vi.mocked(logger.warn).mock.calls.length;
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: {} }]);
      const config = appConfigServiceInstance.getConfig();
      expect(config.defaultLanguage).toBe('en');
      expect(config.networkServiceConfigs).toEqual({});
      expect(vi.mocked(logger.warn).mock.calls.length).toBe(initialWarnCount);
    });

    it('should correctly merge with existing defaults (Vite env takes precedence)', async () => {
      appConfigServiceInstance = new AppConfigService(); // New instance with defaults
      mockViteEnv['VITE_APP_CFG_DEFAULT_LANGUAGE'] = 'de';
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);
      expect(appConfigServiceInstance.getConfig().defaultLanguage).toBe('de');
    });
  });

  describe('loadFromJson', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      appConfigServiceInstance = new AppConfigService();
      mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);
    });

    it('should load and merge config from a valid JSON file', async () => {
      const jsonConfig: Partial<AppRuntimeConfig> = {
        networkServiceConfigs: {
          'etherscan-mainnet': { apiKey: 'json_etherscan_key' },
        },
        globalServiceConfigs: {
          walletconnect: { projectId: 'json_wc_pid' },
        },
        rpcEndpoints: {
          'ethereum-mainnet': 'https://json.rpc.com',
        },
        featureFlags: {
          jsonFeature: true,
        },
        defaultLanguage: 'es',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => jsonConfig,
      } as unknown as Response);

      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.test.config.json' }]);
      const config = appConfigServiceInstance.getConfig();

      expect(fetch).toHaveBeenCalledWith('/app.test.config.json');
      expect(config.networkServiceConfigs?.['etherscan-mainnet']?.apiKey).toBe(
        'json_etherscan_key'
      );
      expect(config.globalServiceConfigs?.['walletconnect']?.['projectId']).toBe('json_wc_pid');
      expect(config.rpcEndpoints?.['ethereum-mainnet']).toBe('https://json.rpc.com');
      expect(config.featureFlags?.['jsonFeature']).toBe(true);
      expect(config.defaultLanguage).toBe('es');
    });

    it('should handle analytics feature flag in JSON config', async () => {
      const jsonConfig: Partial<AppRuntimeConfig> = {
        featureFlags: {
          analytics_enabled: true,
        },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => jsonConfig,
      } as unknown as Response);

      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.config.json' }]);
      const config = appConfigServiceInstance.getConfig();

      expect(fetch).toHaveBeenCalledWith('/app.config.json');
      expect(config.featureFlags?.['analytics_enabled']).toBe(true);
      expect(appConfigServiceInstance.isFeatureEnabled('analytics_enabled')).toBe(true);
    });

    it('should default analytics feature flag to false when not specified in JSON', async () => {
      // Test that it defaults to false when not specified
      const emptyJsonConfig: Partial<AppRuntimeConfig> = {};
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => emptyJsonConfig,
      } as unknown as Response);

      await appConfigServiceInstance.initialize([{ type: 'json', path: '/empty.config.json' }]);
      expect(appConfigServiceInstance.isFeatureEnabled('analytics_enabled')).toBe(false);
    });

    it('should handle fetch returning non-ok status (e.g., 500)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as unknown as Response);
      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.config.json' }]);
      const config = appConfigServiceInstance.getConfig();
      expect(logger.warn).toHaveBeenCalledWith(
        'AppConfigService',
        'Failed to fetch config from /app.config.json: 500 Internal Server Error'
      );
      expect(config.defaultLanguage).toBe('en'); // Should retain default
    });

    it('should skip if config file is not found (404)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as unknown as Response);
      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.config.json' }]);
      expect(logger.info).toHaveBeenCalledWith(
        'AppConfigService',
        'Optional configuration file not found at /app.config.json. Skipping.'
      );
      expect(appConfigServiceInstance.getConfig().defaultLanguage).toBe('en'); // Should retain default
    });

    it('should handle invalid JSON parsing error', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        },
      } as unknown as Response);
      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.config.json' }]);
      expect(logger.error).toHaveBeenCalledWith(
        'AppConfigService',
        'Error loading or parsing config from /app.config.json:',
        expect.any(SyntaxError)
      );
      expect(appConfigServiceInstance.getConfig().defaultLanguage).toBe('en'); // Should retain default
    });

    it('should handle network error during fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network failed'));
      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.config.json' }]);
      expect(logger.error).toHaveBeenCalledWith(
        'AppConfigService',
        'Error loading or parsing config from /app.config.json:',
        expect.any(Error)
      );
      expect(appConfigServiceInstance.getConfig().defaultLanguage).toBe('en'); // Should retain default
    });
  });

  describe('initialize with multiple strategies (precedence)', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      appConfigServiceInstance = new AppConfigService();
      mockViteEnv = {};
      // No longer stubbing import.meta.env, pass env via initialize strategy
      mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);
    });

    it('JSON config should override Vite env vars if loaded after', async () => {
      mockViteEnv['VITE_APP_CFG_DEFAULT_LANGUAGE'] = 'en_vite';
      mockViteEnv['VITE_APP_CFG_API_KEY_ETHERSCAN_MAINNET'] = 'vite_etherscan_key';

      const jsonConfig: Partial<AppRuntimeConfig> = {
        defaultLanguage: 'es_json',
        networkServiceConfigs: {
          'etherscan-mainnet': { apiKey: 'json_etherscan_key' },
        },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => jsonConfig,
      } as unknown as Response);

      await appConfigServiceInstance.initialize([
        { type: 'viteEnv', env: mockViteEnv }, // Vite first
        { type: 'json', path: '/app.config.json' }, // JSON second
      ]);
      const config = appConfigServiceInstance.getConfig();

      expect(config.defaultLanguage).toBe('es_json'); // JSON should override
      expect(config.networkServiceConfigs?.['etherscan-mainnet']?.apiKey).toBe(
        'json_etherscan_key' // JSON should override
      );
    });

    it('Vite env vars should override defaults if JSON is not present or loaded first', async () => {
      mockViteEnv['VITE_APP_CFG_DEFAULT_LANGUAGE'] = 'en_vite';
      mockFetch.mockResolvedValue({ ok: false, status: 404 } as unknown as Response); // JSON load fails

      await appConfigServiceInstance.initialize([
        { type: 'json', path: '/app.config.json' }, // JSON first (fails)
        { type: 'viteEnv', env: mockViteEnv }, // Vite second
      ]);
      const config = appConfigServiceInstance.getConfig();
      expect(config.defaultLanguage).toBe('en_vite'); // Vite should override default
    });

    it('should handle a full realistic configuration with all supported options', async () => {
      // Create a complete JSON configuration representing a real-world scenario
      const fullJsonConfig: Partial<AppRuntimeConfig> = {
        defaultLanguage: 'en',
        networkServiceConfigs: {
          'etherscan-mainnet': { apiKey: 'main_etherscan_api_key' },
          'etherscan-goerli': { apiKey: 'test_etherscan_api_key' },
          'polygonscan-mainnet': { apiKey: 'polygon_api_key' },
        },
        globalServiceConfigs: {
          walletui: {
            config: {
              kitName: 'custom',
              kitConfig: {
                showInjectedConnector: true,
                showNetworkSelector: true,
                darkMode: false,
              },
            },
          },
          walletconnect: {
            projectId: 'wc_project_id_123',
            relay: {
              url: 'wss://relay.walletconnect.com',
            },
            metadata: {
              name: 'My App',
              description: 'App using OpenZeppelin Contracts UI Builder',
            },
          },
          analytics: {
            enabled: true,
            provider: 'segment',
            apiKey: 'analytics_key_456',
            options: {
              anonymizeIp: true,
            },
          },
        },
        rpcEndpoints: {
          'ethereum-mainnet': 'https://eth-mainnet.custom-rpc.com',
          'ethereum-goerli': 'https://eth-goerli.custom-rpc.com',
          'polygon-mainnet': 'https://polygon-mainnet.custom-rpc.com',
        },
        featureFlags: {
          enable_new_ui: true,
          enable_experimental_features: false,
          show_debug_tools: false,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => fullJsonConfig,
      } as unknown as Response);

      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.config.prod.json' }]);

      // Verify we can access all configuration types correctly

      // 1. Basic config
      expect(appConfigServiceInstance.getConfig().defaultLanguage).toBe('en');

      // 2. Explorer API keys
      expect(appConfigServiceInstance.getExplorerApiKey('etherscan-mainnet')).toBe(
        'main_etherscan_api_key'
      );
      expect(appConfigServiceInstance.getExplorerApiKey('etherscan-goerli')).toBe(
        'test_etherscan_api_key'
      );
      expect(appConfigServiceInstance.getExplorerApiKey('polygonscan-mainnet')).toBe(
        'polygon_api_key'
      );

      // 3. RPC endpoints
      expect(appConfigServiceInstance.getRpcEndpointOverride('ethereum-mainnet')).toBe(
        'https://eth-mainnet.custom-rpc.com'
      );
      expect(appConfigServiceInstance.getRpcEndpointOverride('ethereum-goerli')).toBe(
        'https://eth-goerli.custom-rpc.com'
      );
      expect(appConfigServiceInstance.getRpcEndpointOverride('polygon-mainnet')).toBe(
        'https://polygon-mainnet.custom-rpc.com'
      );

      // 4. Feature flags
      expect(appConfigServiceInstance.isFeatureEnabled('enable_new_ui')).toBe(true);
      expect(appConfigServiceInstance.isFeatureEnabled('enable_experimental_features')).toBe(false);
      expect(appConfigServiceInstance.isFeatureEnabled('show_debug_tools')).toBe(false);
      expect(appConfigServiceInstance.isFeatureEnabled('non_existent_flag')).toBe(false);

      // 5. Global service params - simple
      expect(appConfigServiceInstance.getGlobalServiceParam('walletconnect', 'projectId')).toBe(
        'wc_project_id_123'
      );

      // 6. Nested config with type safety
      type WalletUiConfig = {
        kitName: string;
        kitConfig?: {
          showInjectedConnector?: boolean;
          showNetworkSelector?: boolean;
          darkMode?: boolean;
        };
      };

      const walletConfig = appConfigServiceInstance.getTypedNestedConfig<WalletUiConfig>(
        'walletui',
        'config'
      );

      expect(walletConfig).toBeDefined();
      expect(walletConfig?.kitName).toBe('custom');
      expect(walletConfig?.kitConfig?.showInjectedConnector).toBe(true);
      expect(walletConfig?.kitConfig?.showNetworkSelector).toBe(true);
      expect(walletConfig?.kitConfig?.darkMode).toBe(false);

      // 7. Deeper nested config
      type RelayConfig = { url: string };
      const relayConfig = appConfigServiceInstance.getTypedNestedConfig<RelayConfig>(
        'walletconnect',
        'relay'
      );

      expect(relayConfig).toBeDefined();
      expect(relayConfig?.url).toBe('wss://relay.walletconnect.com');

      // 8. Accessing entire config sections
      const entireAnalyticsConfig = appConfigServiceInstance.getTypedNestedConfig('analytics', '');

      expect(entireAnalyticsConfig).toEqual({
        enabled: true,
        provider: 'segment',
        apiKey: 'analytics_key_456',
        options: {
          anonymizeIp: true,
        },
      });
    });
  });

  describe('getter methods', () => {
    beforeEach(async () => {
      appConfigServiceInstance = new AppConfigService();
      mockViteEnv = {
        VITE_APP_CFG_API_KEY_TEST_EXPLORER: 'key123',
        VITE_APP_CFG_SERVICE_TESTSERVICE_PARAM_A: 'valueA',
        VITE_APP_CFG_SERVICE_WALLETCONNECT_PROJECT_ID: 'wc_pid_test',
        VITE_APP_CFG_FEATURE_FLAG_TEST_GETTER: 'true',
        VITE_APP_CFG_RPC_ENDPOINT_TEST_NETWORK: 'https://testrpc.com',
      };
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: mockViteEnv }]);
    });

    it('getExplorerApiKey should return correct key', () => {
      expect(appConfigServiceInstance.getExplorerApiKey('test-explorer')).toBe('key123');
      expect(appConfigServiceInstance.getExplorerApiKey('non-existent')).toBeUndefined();
    });

    it('isFeatureEnabled should return correct boolean', () => {
      expect(appConfigServiceInstance.isFeatureEnabled('test_getter')).toBe(true);
      expect(appConfigServiceInstance.isFeatureEnabled('non_existent_flag')).toBe(false);
    });

    it('getGlobalServiceParam should return correct param', () => {
      expect(appConfigServiceInstance.getGlobalServiceParam('testservice', 'paramA')).toBe(
        'valueA'
      );
      expect(appConfigServiceInstance.getGlobalServiceParam('walletconnect', 'projectId')).toBe(
        'wc_pid_test'
      );
      expect(
        appConfigServiceInstance.getGlobalServiceParam('testservice', 'nonExistentParam')
      ).toBeUndefined();
    });

    it('getRpcEndpointOverride should return correct RPC URL', () => {
      expect(appConfigServiceInstance.getRpcEndpointOverride('test-network')).toBe(
        'https://testrpc.com'
      );
      expect(
        appConfigServiceInstance.getRpcEndpointOverride('non-existent-network')
      ).toBeUndefined();
    });

    it('getTypedNestedConfig should return typed nested configuration', async () => {
      // Setup a configuration with nested objects
      const jsonConfig = {
        globalServiceConfigs: {
          walletui: {
            config: {
              kitName: 'custom',
              kitConfig: {
                showInjectedConnector: true,
              },
            },
          },
          otherservice: {
            nestedParam: {
              value: 42,
            },
          },
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => jsonConfig,
      } as unknown as Response);

      vi.stubGlobal('fetch', mockFetch);

      // Re-initialize with the JSON config
      appConfigServiceInstance = new AppConfigService();
      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.config.json' }]);

      // Test retrieving a complex nested config with type
      type WalletUiConfig = {
        kitName: string;
        kitConfig?: {
          showInjectedConnector?: boolean;
        };
      };

      const walletConfig = appConfigServiceInstance.getTypedNestedConfig<WalletUiConfig>(
        'walletui',
        'config'
      );

      expect(walletConfig).toBeDefined();
      expect(walletConfig?.kitName).toBe('custom');
      expect(walletConfig?.kitConfig?.showInjectedConnector).toBe(true);

      // Test retrieving a different nested config
      type OtherConfig = { value: number };
      const otherConfig = appConfigServiceInstance.getTypedNestedConfig<OtherConfig>(
        'otherservice',
        'nestedParam'
      );

      expect(otherConfig).toBeDefined();
      expect(otherConfig?.value).toBe(42);

      // Test retrieving non-existent config
      const nonExistentConfig = appConfigServiceInstance.getTypedNestedConfig(
        'nonexistent',
        'config'
      );

      expect(nonExistentConfig).toBeUndefined();
    });

    it('getTypedNestedConfig should handle missing nested paths', async () => {
      // Setup a configuration with only partial paths
      const jsonConfig = {
        globalServiceConfigs: {
          emptyservice: {},
          partialservice: {
            config: null,
          },
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => jsonConfig,
      } as unknown as Response);

      vi.stubGlobal('fetch', mockFetch);

      // Re-initialize with the JSON config
      appConfigServiceInstance = new AppConfigService();
      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.config.json' }]);

      // Test with service that exists but has no properties
      const emptyConfig = appConfigServiceInstance.getTypedNestedConfig('emptyservice', 'config');
      expect(emptyConfig).toBeUndefined();

      // Test with service that has config key but it's null
      const nullConfig = appConfigServiceInstance.getTypedNestedConfig('partialservice', 'config');
      expect(nullConfig).toBeUndefined();
    });

    it('getters should warn if called before initialization', () => {
      const freshInstance = new AppConfigService(); // Not initialized
      vi.mocked(logger.warn).mockClear();

      freshInstance.getExplorerApiKey('test');
      expect(logger.warn).toHaveBeenCalledWith(
        'AppConfigService',
        'getExplorerApiKey called before initialization.'
      );

      freshInstance.isFeatureEnabled('test');
      expect(logger.warn).toHaveBeenCalledWith(
        'AppConfigService',
        'isFeatureEnabled called before initialization.'
      );

      freshInstance.getGlobalServiceParam('test', 'test');
      expect(logger.warn).toHaveBeenCalledWith(
        'AppConfigService',
        'getGlobalServiceParam called before initialization.'
      );

      freshInstance.getRpcEndpointOverride('test');
      expect(logger.warn).toHaveBeenCalledWith(
        'AppConfigService',
        'getRpcEndpointOverride called before initialization.'
      );

      freshInstance.getTypedNestedConfig('test', 'config');
      expect(logger.warn).toHaveBeenCalledWith(
        'AppConfigService',
        'getTypedNestedConfig called before initialization.'
      );

      expect(logger.warn).toHaveBeenCalledTimes(5);
    });
  });
});
