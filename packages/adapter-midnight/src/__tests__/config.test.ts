import { describe, expect, it } from 'vitest';

import { midnightAdapterConfig } from '../config';

describe('Midnight Adapter Config', () => {
  describe('Structure Validation', () => {
    it('should export a valid AdapterConfig object', () => {
      expect(midnightAdapterConfig).toBeDefined();
      expect(typeof midnightAdapterConfig).toBe('object');
    });

    it('should have dependencies configuration', () => {
      expect(midnightAdapterConfig.dependencies).toBeDefined();
      expect(typeof midnightAdapterConfig.dependencies).toBe('object');
    });

    it('should have viteConfig configuration', () => {
      expect(midnightAdapterConfig.viteConfig).toBeDefined();
      expect(typeof midnightAdapterConfig.viteConfig).toBe('object');
    });
  });

  describe('Runtime Dependencies', () => {
    const { runtime } = midnightAdapterConfig.dependencies;

    it('should include all core Midnight SDK packages', () => {
      expect(runtime).toHaveProperty('@midnight-ntwrk/compact-runtime');
      expect(runtime).toHaveProperty('@midnight-ntwrk/onchain-runtime');
      expect(runtime).toHaveProperty('@midnight-ntwrk/ledger');
      expect(runtime).toHaveProperty('@midnight-ntwrk/zswap');
      expect(runtime).toHaveProperty('@midnight-ntwrk/wallet-sdk-address-format');
    });

    it('should include all Midnight JS SDK packages', () => {
      expect(runtime).toHaveProperty('@midnight-ntwrk/midnight-js-contracts');
      expect(runtime).toHaveProperty('@midnight-ntwrk/midnight-js-network-id');
      expect(runtime).toHaveProperty('@midnight-ntwrk/midnight-js-types');
      expect(runtime).toHaveProperty('@midnight-ntwrk/midnight-js-utils');
      expect(runtime).toHaveProperty('@midnight-ntwrk/midnight-js-indexer-public-data-provider');
      expect(runtime).toHaveProperty('@midnight-ntwrk/midnight-js-http-client-proof-provider');
      expect(runtime).toHaveProperty('@midnight-ntwrk/midnight-js-level-private-state-provider');
      expect(runtime).toHaveProperty('@midnight-ntwrk/midnight-js-fetch-zk-config-provider');
      expect(runtime).toHaveProperty('@midnight-ntwrk/midnight-js-node-zk-config-provider');
    });

    it('should include wallet integration packages', () => {
      expect(runtime).toHaveProperty('@midnight-ntwrk/dapp-connector-api');
    });

    it('should include required utility packages', () => {
      expect(runtime).toHaveProperty('rxjs');
      expect(runtime).toHaveProperty('@scure/base');
      expect(runtime).toHaveProperty('jszip');
      expect(runtime).toHaveProperty('object-inspect');
      expect(runtime).toHaveProperty('cross-fetch');
      expect(runtime).toHaveProperty('fetch-retry');
      expect(runtime).toHaveProperty('lodash');
    });

    it('should include all protobufjs packages', () => {
      expect(runtime).toHaveProperty('protobufjs');
      expect(runtime).toHaveProperty('@protobufjs/float');
      expect(runtime).toHaveProperty('@protobufjs/utf8');
      expect(runtime).toHaveProperty('@protobufjs/base64');
      expect(runtime).toHaveProperty('@protobufjs/inquire');
      expect(runtime).toHaveProperty('@protobufjs/pool');
      expect(runtime).toHaveProperty('@protobufjs/aspromise');
      expect(runtime).toHaveProperty('@protobufjs/eventemitter');
      expect(runtime).toHaveProperty('@protobufjs/fetch');
      expect(runtime).toHaveProperty('@protobufjs/path');
      expect(runtime).toHaveProperty('@protobufjs/codegen');
    });

    it('should include browser polyfills', () => {
      expect(runtime).toHaveProperty('buffer');
      expect(runtime).toHaveProperty('events');
    });

    it('should include LevelDB packages', () => {
      expect(runtime).toHaveProperty('level');
      expect(runtime).toHaveProperty('classic-level');
      expect(runtime).toHaveProperty('abstract-level');
      expect(runtime).toHaveProperty('browser-level');
    });

    it('should include Apollo Client', () => {
      expect(runtime).toHaveProperty('@apollo/client');
    });

    it('should include React packages', () => {
      expect(runtime).toHaveProperty('react');
      expect(runtime).toHaveProperty('react-dom');
    });

    it('should use exact versions for patched packages', () => {
      // Packages with patches should use exact versions (no ^ or ~)
      expect(runtime['@midnight-ntwrk/compact-runtime']).toBe('0.9.0');
      expect(runtime['@midnight-ntwrk/ledger']).toBe('4.0.0');
      expect(runtime['@midnight-ntwrk/zswap']).toBe('4.0.0');
      expect(runtime['@midnight-ntwrk/wallet-sdk-address-format']).toBe('2.0.0');
    });

    it('should use caret versions for packages with patches that need compatibility', () => {
      // Packages with patches but need minor/patch flexibility
      expect(runtime['@midnight-ntwrk/midnight-js-contracts']).toMatch(/^\^/);
      expect(runtime['@midnight-ntwrk/midnight-js-network-id']).toMatch(/^\^/);
    });

    it('should have valid semver version strings', () => {
      Object.entries(runtime).forEach(([_pkg, version]) => {
        expect(version).toBeDefined();
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
        // Should start with a digit, ^, or ~
        expect(version).toMatch(/^[\^~]?\d/);
      });
    });
  });

  describe('Development Dependencies', () => {
    const { dev } = midnightAdapterConfig.dependencies;

    it('should include React type definitions', () => {
      expect(dev).toHaveProperty('@types/react');
      expect(dev).toHaveProperty('@types/react-dom');
    });

    it('should have valid version strings', () => {
      Object.entries(dev).forEach(([_pkg, version]) => {
        expect(version).toBeDefined();
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Build Dependencies', () => {
    const { build } = midnightAdapterConfig.dependencies;

    it('should include Vite WASM plugins', () => {
      expect(build).toHaveProperty('vite-plugin-wasm');
      expect(build).toHaveProperty('vite-plugin-top-level-await');
    });

    it('should have valid version strings', () => {
      Object.entries(build).forEach(([_pkg, version]) => {
        expect(version).toBeDefined();
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Vite Configuration', () => {
    const { viteConfig } = midnightAdapterConfig;

    it('should have imports array', () => {
      expect(viteConfig.imports).toBeDefined();
      expect(Array.isArray(viteConfig.imports)).toBe(true);
    });

    it('should import required plugins', () => {
      const importsStr = viteConfig.imports.join('\n');
      expect(importsStr).toContain("import topLevelAwait from 'vite-plugin-top-level-await'");
      expect(importsStr).toContain("import wasm from 'vite-plugin-wasm'");
    });

    it('should import getMidnightViteConfig from vite-config', () => {
      const importsStr = viteConfig.imports.join('\n');
      expect(importsStr).toContain('getMidnightViteConfig');
      expect(importsStr).toContain('@openzeppelin/ui-builder-adapter-midnight/vite-config');
    });

    it('should have configInit that calls getMidnightViteConfig', () => {
      expect(viteConfig.configInit).toBeDefined();
      expect(typeof viteConfig.configInit).toBe('string');
      expect(viteConfig.configInit).toContain('getMidnightViteConfig');
      expect(viteConfig.configInit).toContain('wasm');
      expect(viteConfig.configInit).toContain('topLevelAwait');
      expect(viteConfig.configInit).toContain('midnightConfig');
    });

    it('should have plugins spread configuration', () => {
      expect(viteConfig.plugins).toBeDefined();
      expect(typeof viteConfig.plugins).toBe('string');
      expect(viteConfig.plugins).toContain('midnightConfig.plugins');
      expect(viteConfig.plugins).toContain('...');
    });

    it('should have dedupe configuration', () => {
      expect(viteConfig.dedupe).toBeDefined();
      expect(typeof viteConfig.dedupe).toBe('string');
      expect(viteConfig.dedupe).toContain('dedupe');
      expect(viteConfig.dedupe).toContain('midnightConfig.resolve');
      expect(viteConfig.dedupe).toContain('...');
    });

    it('should have optimizeDeps configuration', () => {
      expect(viteConfig.optimizeDeps).toBeDefined();
      expect(typeof viteConfig.optimizeDeps).toBe('object');
      expect(viteConfig.optimizeDeps.include).toBeDefined();
      expect(viteConfig.optimizeDeps.exclude).toBeDefined();
    });

    it('should have valid optimizeDeps include configuration', () => {
      expect(viteConfig.optimizeDeps.include).toContain('include');
      expect(viteConfig.optimizeDeps.include).toContain('midnightConfig.optimizeDeps');
      expect(viteConfig.optimizeDeps.include).toContain('...');
    });

    it('should have valid optimizeDeps exclude configuration', () => {
      expect(viteConfig.optimizeDeps.exclude).toContain('exclude');
      expect(viteConfig.optimizeDeps.exclude).toContain('midnightConfig.optimizeDeps');
      expect(viteConfig.optimizeDeps.exclude).toContain('...');
    });
  });

  describe('Cross-Reference Validation', () => {
    it('should have all Vite plugin imports listed in build dependencies', () => {
      const { build } = midnightAdapterConfig.dependencies;
      const { viteConfig } = midnightAdapterConfig;
      const importsStr = viteConfig.imports.join('\n');

      // If wasm is imported, it should be in build deps
      if (importsStr.includes('vite-plugin-wasm')) {
        expect(build).toHaveProperty('vite-plugin-wasm');
      }

      // If topLevelAwait is imported, it should be in build deps
      if (importsStr.includes('vite-plugin-top-level-await')) {
        expect(build).toHaveProperty('vite-plugin-top-level-await');
      }
    });

    it('should not have conflicting versions', () => {
      const { runtime, dev, build } = midnightAdapterConfig.dependencies;
      const allDeps = { ...runtime, ...dev, ...build };

      // Check for duplicate package names with different versions
      const packageVersions = new Map<string, string[]>();
      Object.entries(allDeps).forEach(([pkg, version]) => {
        if (!packageVersions.has(pkg)) {
          packageVersions.set(pkg, []);
        }
        packageVersions.get(pkg)!.push(version);
      });

      packageVersions.forEach((versions, pkg) => {
        expect(
          versions.length,
          `Package ${pkg} has multiple conflicting versions: ${versions.join(', ')}`
        ).toBe(1);
      });
    });
  });

  describe('Configuration Completeness', () => {
    it('should have all packages required for browser compatibility', () => {
      const { runtime } = midnightAdapterConfig.dependencies;

      // Essential browser polyfills
      const requiredPolyfills = ['buffer', 'events'];
      requiredPolyfills.forEach((pkg) => {
        expect(runtime, `Missing essential browser polyfill: ${pkg}`).toHaveProperty(pkg);
      });

      // Essential Midnight SDK packages
      const requiredMidnight = [
        '@midnight-ntwrk/compact-runtime',
        '@midnight-ntwrk/midnight-js-contracts',
        '@midnight-ntwrk/midnight-js-network-id',
      ];
      requiredMidnight.forEach((pkg) => {
        expect(runtime, `Missing essential Midnight SDK package: ${pkg}`).toHaveProperty(pkg);
      });

      // Essential for private state management
      const requiredLevel = ['level', 'browser-level', 'abstract-level'];
      requiredLevel.forEach((pkg) => {
        expect(
          runtime,
          `Missing essential LevelDB package for private state: ${pkg}`
        ).toHaveProperty(pkg);
      });
    });

    it('should not include unnecessary packages', () => {
      const { runtime } = midnightAdapterConfig.dependencies;

      // Packages that should NOT be in runtime (development only)
      const disallowedPackages = ['vitest', 'typescript', '@types/node', 'eslint'];

      disallowedPackages.forEach((pkg) => {
        expect(runtime, `Unexpected development package in runtime: ${pkg}`).not.toHaveProperty(
          pkg
        );
      });
    });
  });
});
