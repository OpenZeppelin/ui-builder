import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import AppRuntimeConfig for typing mock JSON
import type { AppRuntimeConfig } from '@openzeppelin/transaction-form-types';

// Assuming this is the path to your logger

// Adjust path as needed
import { logger } from '../../utils/logger';
import { AppConfigService } from '../AppConfigService';

// Mock the logger to prevent console output during tests and allow spying
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AppConfigService', () => {
  let appConfigServiceInstance: AppConfigService;
  let mockViteEnv: Record<string, string | boolean | undefined>;

  beforeEach(() => {
    appConfigServiceInstance = new AppConfigService();
    mockViteEnv = {}; // Reset mock env for each test
    // Deliberately not stubbing import.meta here, pass env via initialize strategy
  });

  afterEach(() => {
    vi.unstubAllGlobals(); // Clean up global stubs
    vi.clearAllMocks(); // Clear all Vitest mocks
  });

  describe('constructor & defaultConfig', () => {
    it('should initialize with default configurations', () => {
      const config = appConfigServiceInstance.getConfig();
      expect(config.networkServiceConfigs).toEqual({});
      expect(config.globalServiceConfigs).toEqual({});
      expect(config.rpcEndpoints).toEqual({}); // Assuming it's initialized to {} by default now
      expect(config.featureFlags).toEqual({});
      expect(config.defaultLanguage).toBe('en');
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

    it('should process an empty env object without warnings (other than the initial undefined check if that path was taken)', async () => {
      const initialWarnCount = vi.mocked(logger.warn).mock.calls.length;
      await appConfigServiceInstance.initialize([{ type: 'viteEnv', env: {} }]);
      const config = appConfigServiceInstance.getConfig();
      expect(config.defaultLanguage).toBe('en');
      expect(config.networkServiceConfigs).toEqual({});
      expect(vi.mocked(logger.warn).mock.calls.length).toBe(initialWarnCount);
    });

    it('should correctly merge with existing defaults (Vite env takes precedence)', async () => {
      appConfigServiceInstance = new AppConfigService();
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
      expect(config.defaultLanguage).toBe('en');
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
      expect(appConfigServiceInstance.getConfig().defaultLanguage).toBe('en');
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
      expect(appConfigServiceInstance.getConfig().defaultLanguage).toBe('en');
    });

    it('should handle network error during fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network failed'));
      await appConfigServiceInstance.initialize([{ type: 'json', path: '/app.config.json' }]);
      expect(logger.error).toHaveBeenCalledWith(
        'AppConfigService',
        'Error loading or parsing config from /app.config.json:',
        expect.any(Error)
      );
      expect(appConfigServiceInstance.getConfig().defaultLanguage).toBe('en');
    });
  });

  describe('initialize with multiple strategies (precedence)', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      appConfigServiceInstance = new AppConfigService();
      mockViteEnv = {};
      vi.stubGlobal('import.meta', { env: mockViteEnv });
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
        { type: 'viteEnv', env: mockViteEnv },
        { type: 'json', path: '/app.config.json' },
      ]);
      const config = appConfigServiceInstance.getConfig();

      expect(config.defaultLanguage).toBe('es_json');
      expect(config.networkServiceConfigs?.['etherscan-mainnet']?.apiKey).toBe(
        'json_etherscan_key'
      );
    });

    it('Vite env vars should override defaults if JSON is not present or loaded first', async () => {
      mockViteEnv['VITE_APP_CFG_DEFAULT_LANGUAGE'] = 'en_vite';
      mockFetch.mockResolvedValue({ ok: false, status: 404 } as unknown as Response);

      await appConfigServiceInstance.initialize([
        { type: 'json', path: '/app.config.json' },
        { type: 'viteEnv', env: mockViteEnv },
      ]);
      const config = appConfigServiceInstance.getConfig();
      expect(config.defaultLanguage).toBe('en_vite');
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

    it('getters should warn if called before initialization', () => {
      const freshInstance = new AppConfigService();
      vi.mocked(logger.warn).mockClear();

      freshInstance.getExplorerApiKey('test');
      expect(vi.mocked(logger.warn).mock.calls[0]).toEqual([
        'AppConfigService',
        'getExplorerApiKey called before initialization.',
      ]);

      freshInstance.isFeatureEnabled('test');
      expect(vi.mocked(logger.warn).mock.calls[1]).toEqual([
        'AppConfigService',
        'isFeatureEnabled called before initialization.',
      ]);

      freshInstance.getGlobalServiceParam('test', 'test');
      expect(logger.warn).toHaveBeenNthCalledWith(
        3,
        'AppConfigService',
        'getGlobalServiceParam called before initialization.'
      );

      freshInstance.getRpcEndpointOverride('test');
      expect(logger.warn).toHaveBeenNthCalledWith(
        4,
        'AppConfigService',
        'getRpcEndpointOverride called before initialization.'
      );

      expect(logger.warn).toHaveBeenCalledTimes(4);
    });
  });
});
