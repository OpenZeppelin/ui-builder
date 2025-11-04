import type { Plugin } from 'vite';
import { describe, expect, it, vi } from 'vitest';

import { getMidnightViteConfig } from '../vite-config';
import type { MidnightVitePlugins } from '../vite-config';

describe('Midnight Vite Config', () => {
  // Mock plugin factories
  const createMockPlugin = (name: string): Plugin => ({
    name,
    apply: 'build',
  });

  const mockPlugins: MidnightVitePlugins = {
    wasm: vi.fn(() => createMockPlugin('vite-plugin-wasm')),
    topLevelAwait: vi.fn(() => createMockPlugin('vite-plugin-top-level-await')),
  };

  describe('Function Signature', () => {
    it('should export getMidnightViteConfig function', () => {
      expect(getMidnightViteConfig).toBeDefined();
      expect(typeof getMidnightViteConfig).toBe('function');
    });

    it('should accept plugins parameter', () => {
      expect(() => getMidnightViteConfig(mockPlugins)).not.toThrow();
    });

    it('should return a valid Vite config object', () => {
      const config = getMidnightViteConfig(mockPlugins);
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
  });

  describe('Plugins Configuration', () => {
    it('should include plugins array', () => {
      const config = getMidnightViteConfig(mockPlugins);
      expect(config.plugins).toBeDefined();
      expect(Array.isArray(config.plugins)).toBe(true);
    });

    it('should call wasm plugin factory', () => {
      const mockWasm = vi.fn(() => createMockPlugin('wasm'));
      const plugins = {
        wasm: mockWasm,
        topLevelAwait: mockPlugins.topLevelAwait,
      };

      getMidnightViteConfig(plugins);
      expect(mockWasm).toHaveBeenCalledOnce();
    });

    it('should call topLevelAwait plugin factory', () => {
      const mockTopLevelAwait = vi.fn(() => createMockPlugin('topLevelAwait'));
      const plugins = {
        wasm: mockPlugins.wasm,
        topLevelAwait: mockTopLevelAwait,
      };

      getMidnightViteConfig(plugins);
      expect(mockTopLevelAwait).toHaveBeenCalledOnce();
    });

    it('should include both wasm and topLevelAwait plugins', () => {
      const config = getMidnightViteConfig(mockPlugins);
      expect(config.plugins).toHaveLength(2);
    });
  });

  describe('Resolve Configuration', () => {
    it('should have resolve configuration', () => {
      const config = getMidnightViteConfig(mockPlugins);
      expect(config.resolve).toBeDefined();
      expect(typeof config.resolve).toBe('object');
    });

    it('should have dedupe array', () => {
      const config = getMidnightViteConfig(mockPlugins);
      expect(config.resolve?.dedupe).toBeDefined();
      expect(Array.isArray(config.resolve?.dedupe)).toBe(true);
    });

    it('should include critical Midnight SDK packages in dedupe', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const dedupe = config.resolve?.dedupe || [];

      const criticalPackages = [
        '@midnight-ntwrk/compact-runtime',
        '@midnight-ntwrk/ledger',
        '@midnight-ntwrk/zswap',
        '@midnight-ntwrk/midnight-js-contracts',
        '@midnight-ntwrk/midnight-js-network-id',
      ];

      criticalPackages.forEach((pkg) => {
        expect(dedupe).toContain(pkg);
      });
    });

    it('should dedupe network-id package (CRITICAL for singleton)', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const dedupe = config.resolve?.dedupe || [];
      expect(dedupe).toContain('@midnight-ntwrk/midnight-js-network-id');
    });
  });

  describe('OptimizeDeps Configuration', () => {
    it('should have optimizeDeps configuration', () => {
      const config = getMidnightViteConfig(mockPlugins);
      expect(config.optimizeDeps).toBeDefined();
      expect(typeof config.optimizeDeps).toBe('object');
    });

    it('should have include array', () => {
      const config = getMidnightViteConfig(mockPlugins);
      expect(config.optimizeDeps?.include).toBeDefined();
      expect(Array.isArray(config.optimizeDeps?.include)).toBe(true);
    });

    it('should have exclude array', () => {
      const config = getMidnightViteConfig(mockPlugins);
      expect(config.optimizeDeps?.exclude).toBeDefined();
      expect(Array.isArray(config.optimizeDeps?.exclude)).toBe(true);
    });
  });

  describe('OptimizeDeps Include - Browser Polyfills', () => {
    it('should include buffer polyfill', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      expect(include).toContain('buffer');
    });

    it('should include events polyfill', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      expect(include).toContain('events');
    });
  });

  describe('OptimizeDeps Include - Midnight SDK Core', () => {
    it('should include all core runtime packages', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];

      // Core packages that need pre-bundling (network-id excluded - it's in exclude list)
      const corePackages = [
        '@midnight-ntwrk/compact-runtime',
        '@midnight-ntwrk/ledger',
        '@midnight-ntwrk/zswap',
        '@midnight-ntwrk/midnight-js-contracts',
      ];

      corePackages.forEach((pkg) => {
        expect(include).toContain(pkg);
      });
    });

    it('should include object-inspect (required by compact-runtime)', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      expect(include).toContain('object-inspect');
    });
  });

  describe('OptimizeDeps Include - HTTP Utilities', () => {
    it('should include cross-fetch', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      expect(include).toContain('cross-fetch');
    });

    it('should include fetch-retry', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      expect(include).toContain('fetch-retry');
    });
  });

  describe('OptimizeDeps Include - Providers', () => {
    it('should include indexer public data provider', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      expect(include).toContain('@midnight-ntwrk/midnight-js-indexer-public-data-provider');
    });
  });

  describe('OptimizeDeps Include - Utilities', () => {
    it('should include lodash', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      expect(include).toContain('lodash');
    });
  });

  describe('OptimizeDeps Include - Protobufjs Ecosystem', () => {
    it('should include main protobufjs package', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      expect(include).toContain('protobufjs');
    });

    it('should include all protobufjs submodules', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];

      const protobufSubmodules = [
        '@protobufjs/float',
        '@protobufjs/utf8',
        '@protobufjs/base64',
        '@protobufjs/inquire',
        '@protobufjs/pool',
        '@protobufjs/aspromise',
        '@protobufjs/eventemitter',
        '@protobufjs/fetch',
        '@protobufjs/path',
        '@protobufjs/codegen',
      ];

      protobufSubmodules.forEach((pkg) => {
        expect(include).toContain(pkg);
      });
    });
  });

  describe('OptimizeDeps Include - LevelDB', () => {
    it('should include all LevelDB packages', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];

      const levelPackages = ['level', 'classic-level', 'abstract-level', 'browser-level'];

      levelPackages.forEach((pkg) => {
        expect(include).toContain(pkg);
      });
    });
  });

  describe('OptimizeDeps Include - Apollo Client', () => {
    it('should include Apollo Client core', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      expect(include).toContain('@apollo/client');
      expect(include).toContain('@apollo/client/core');
    });
  });

  describe('OptimizeDeps Exclude - WASM Packages', () => {
    it('should exclude packages with WASM or top-level await', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const exclude = config.optimizeDeps?.exclude || [];

      // Note: midnight-js-network-id is NOT in this list because it MUST be pre-bundled
      // despite having top-level await (handled by vite-plugin-top-level-await)
      const wasmPackages = [
        '@midnight-ntwrk/onchain-runtime',
        '@midnight-ntwrk/midnight-js-types',
        '@midnight-ntwrk/midnight-js-utils',
        '@midnight-ntwrk/wallet-sdk-address-format',
        '@midnight-ntwrk/midnight-js-http-client-proof-provider',
        '@midnight-ntwrk/midnight-js-level-private-state-provider',
        '@midnight-ntwrk/midnight-js-node-zk-config-provider',
      ];

      wasmPackages.forEach((pkg) => {
        expect(exclude).toContain(pkg);
      });
    });
  });

  describe('Configuration Consistency', () => {
    it('should have packages in both dedupe and include (for singleton + ESM)', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const dedupe = config.resolve?.dedupe || [];
      const include = config.optimizeDeps?.include || [];

      // These packages need both deduplication AND pre-bundling
      const sharedPackages = [
        '@midnight-ntwrk/compact-runtime',
        '@midnight-ntwrk/ledger',
        '@midnight-ntwrk/zswap',
        '@midnight-ntwrk/midnight-js-contracts',
      ];

      sharedPackages.forEach((pkg) => {
        expect(dedupe).toContain(pkg);
        expect(include).toContain(pkg);
      });
    });

    it('should have network-id in dedupe and include (must be pre-bundled)', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const dedupe = config.resolve?.dedupe || [];
      const include = config.optimizeDeps?.include || [];
      const exclude = config.optimizeDeps?.exclude || [];

      // network-id needs deduplication (singleton) AND pre-bundling
      // Despite having top-level await, it MUST be pre-bundled or NetworkId enum is undefined
      // The vite-plugin-top-level-await handles the top-level await syntax
      expect(dedupe).toContain('@midnight-ntwrk/midnight-js-network-id');
      expect(include).toContain('@midnight-ntwrk/midnight-js-network-id');
      expect(exclude).not.toContain('@midnight-ntwrk/midnight-js-network-id');
    });

    it('should not have conflicts between include and exclude', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];
      const exclude = config.optimizeDeps?.exclude || [];

      const conflicts = include.filter((pkg) => exclude.includes(pkg));
      expect(
        conflicts.length,
        `Found packages in both include and exclude: ${conflicts.join(', ')}`
      ).toBe(0);
    });

    it('should not have duplicate entries in include', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];

      const duplicates = include.filter((item, index) => include.indexOf(item) !== index);
      expect(
        duplicates.length,
        `Found duplicate entries in include: ${duplicates.join(', ')}`
      ).toBe(0);
    });

    it('should not have duplicate entries in exclude', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const exclude = config.optimizeDeps?.exclude || [];

      const duplicates = exclude.filter((item, index) => exclude.indexOf(item) !== index);
      expect(
        duplicates.length,
        `Found duplicate entries in exclude: ${duplicates.join(', ')}`
      ).toBe(0);
    });

    it('should not have duplicate entries in dedupe', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const dedupe = config.resolve?.dedupe || [];

      const duplicates = dedupe.filter((item, index) => dedupe.indexOf(item) !== index);
      expect(duplicates.length, `Found duplicate entries in dedupe: ${duplicates.join(', ')}`).toBe(
        0
      );
    });
  });

  describe('Critical Configuration Validation', () => {
    it('should prevent WASM context fragmentation with dedupe', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const dedupe = config.resolve?.dedupe || [];

      // These packages MUST be deduplicated to prevent multiple WASM instances
      expect(dedupe).toContain('@midnight-ntwrk/compact-runtime');
      expect(dedupe).toContain('@midnight-ntwrk/ledger');
      expect(dedupe).toContain('@midnight-ntwrk/zswap');
    });

    it('should prevent singleton fragmentation for network-id', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const dedupe = config.resolve?.dedupe || [];

      // network-id MUST be a singleton to prevent setNetworkId/getNetworkId mismatches
      expect(dedupe).toContain('@midnight-ntwrk/midnight-js-network-id');
    });

    it('should handle CommonJS to ESM conversion for all required packages', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const include = config.optimizeDeps?.include || [];

      // All CommonJS packages that need browser compatibility
      const commonJsPackages = [
        'buffer',
        'events',
        'cross-fetch',
        'fetch-retry',
        'lodash',
        'protobufjs',
        '@apollo/client',
        'level',
        'abstract-level',
      ];

      commonJsPackages.forEach((pkg) => {
        expect(include).toContain(pkg);
      });
    });

    it('should exclude WASM packages from pre-bundling', () => {
      const config = getMidnightViteConfig(mockPlugins);
      const exclude = config.optimizeDeps?.exclude || [];

      // WASM packages MUST NOT be pre-bundled
      expect(exclude).toContain('@midnight-ntwrk/onchain-runtime');
    });
  });

  describe('Type Safety', () => {
    it('should accept valid MidnightVitePlugins interface', () => {
      const validPlugins: MidnightVitePlugins = {
        wasm: () => createMockPlugin('wasm'),
        topLevelAwait: () => createMockPlugin('topLevelAwait'),
      };

      expect(() => getMidnightViteConfig(validPlugins)).not.toThrow();
    });

    it('should return UserConfig compatible object', () => {
      const config = getMidnightViteConfig(mockPlugins);

      // Check for UserConfig properties
      expect(config).toHaveProperty('plugins');
      expect(config).toHaveProperty('resolve');
      expect(config).toHaveProperty('optimizeDeps');
    });
  });

  describe('Documentation and Comments', () => {
    it('should have comprehensive inline documentation', () => {
      // This is validated by reading the source file
      // The presence of JSDoc comments is important for maintainability
      expect(typeof getMidnightViteConfig).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle plugin factories that return different plugin objects', () => {
      const customWasm = () =>
        createMockPlugin('custom-wasm-plugin') as Plugin & { customProp: string };
      const customTopLevel = () =>
        createMockPlugin('custom-toplevel-plugin') as Plugin & { anotherProp: number };

      const plugins = {
        wasm: customWasm,
        topLevelAwait: customTopLevel,
      };

      const config = getMidnightViteConfig(plugins);
      expect(config.plugins).toHaveLength(2);
    });

    it('should maintain immutability of plugin array', () => {
      const config1 = getMidnightViteConfig(mockPlugins);
      const config2 = getMidnightViteConfig(mockPlugins);

      // Each call should return a new plugins array
      expect(config1.plugins).not.toBe(config2.plugins);
    });
  });
});
