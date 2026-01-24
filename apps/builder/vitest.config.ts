import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '../../vitest.shared.config';

/**
 * Adapter package paths for test resolution.
 * Maps package names to their dist entry points.
 * This is needed because Vite 7.2+ has stricter resolution for dynamic imports.
 */
const adapterPackagePaths: Record<string, string> = {
  '@openzeppelin/ui-builder-adapter-evm': path.resolve(
    __dirname,
    '../../packages/adapter-evm/dist/index.js'
  ),
  '@openzeppelin/ui-builder-adapter-solana': path.resolve(
    __dirname,
    '../../packages/adapter-solana/dist/index.js'
  ),
  '@openzeppelin/ui-builder-adapter-stellar': path.resolve(
    __dirname,
    '../../packages/adapter-stellar/dist/index.js'
  ),
  '@openzeppelin/ui-builder-adapter-midnight': path.resolve(
    __dirname,
    '../../packages/adapter-midnight/dist/index.js'
  ),
};

/**
 * Virtual module mocks for testing
 *
 * Define mock implementations for all virtual modules used in the application.
 * This should mirror the virtual modules defined in vite.config.ts
 *
 * For detailed documentation on this approach, see:
 * apps/builder/src/docs/cross-package-imports.md
 */
const virtualModuleMocks: Record<string, string> = {
  // Module ID -> mock implementation
  'virtual:renderer-config': `
    export const rendererConfig = {
      coreDependencies: {},
      fieldDependencies: {}
    };
  `,
  // Config content mocks - Use valid stringified JSON
  'virtual:tailwind-config-content': `export default ${JSON.stringify('{/* Mock Tailwind */}')};`,
  'virtual:postcss-config-content': `export default ${JSON.stringify('{/* Mock PostCSS */}')};`,
  'virtual:components-json-content': `export default ${JSON.stringify('{ "mock": true }')};`, // Valid JSON
  // CSS content mocks
  'virtual:global-css-content': `export default "/* Mock Global CSS */";`,
  // Template CSS content mock
  'virtual:template-vite-styles-css-content': `export default "/* Mock Template styles.css */";`,
  // Contract Schema content mock (added)
  'virtual:contract-schema-content': `export default "/* Mock Contract Schema Content */";`,
  // Add more virtual module mocks as needed
  // 'virtual:templates-config': `export const templateConfig = { /* mock data */ };`,
};

/**
 * Vitest Configuration
 *
 * This configuration includes special handling for virtual modules that cross
 * package boundaries which are used throughout the application.
 *
 * VIRTUAL MODULE SOLUTION OVERVIEW:
 *
 * 1. PROBLEM: The application needs to access configuration from other packages,
 *    but import.meta.glob doesn't reliably work across package boundaries in development mode.
 *
 * 2. SOLUTION:
 *    - In vite.config.ts: Virtual modules that import the real files using aliases
 *    - In this file: Mock implementations for tests
 *    - In application code: Direct imports from the virtual modules
 *
 * 3. TESTING APPROACH:
 *    Most tests that use these modules provide their own mocks via constructor parameters,
 *    but the virtual modules are still needed to satisfy the import statements.
 *
 * HOW TO ADD A NEW VIRTUAL MODULE FOR TESTING:
 * 1. Add an entry to the virtualModuleMocks object above
 * 2. Make sure it exports the same interface as the real module
 * 3. The test plugin below will automatically handle it
 *
 * Without this plugin, tests would fail with:
 * "Failed to resolve import 'virtual:module-name' from 'src/path/to/file.ts'"
 */
export default defineConfig(
  mergeConfig(sharedVitestConfig, {
    plugins: [
      // Include React plugin from shared config
      react(),

      /**
       * TEST-SPECIFIC VIRTUAL MODULE PROVIDER
       *
       * This plugin provides mock implementations of virtual modules
       * used in the dev/build environment.
       *
       * In the real application, these modules are provided by a plugin in vite.config.ts
       * that imports the actual files from other packages. For tests, we
       * provide basic mock implementations here.
       */
      {
        name: 'test-virtual-modules-provider',
        resolveId(id: string) {
          if (id in virtualModuleMocks) {
            return `\0${id}`;
          }
          return null;
        },
        load(id: string) {
          // Extract the original ID without the null byte prefix
          const originalId = id.startsWith('\0') ? id.slice(1) : id;

          if (originalId in virtualModuleMocks) {
            // Return the mock implementation
            return virtualModuleMocks[originalId];
          }
          return null;
        },
      },

      /**
       * ADAPTER PACKAGE RESOLVER
       *
       * This plugin resolves adapter packages to their dist entry points.
       * Required because Vite 7.2+ has stricter resolution for dynamic imports
       * and the standard resolve.alias doesn't work reliably for dynamic imports
       * like: await import("@openzeppelin/ui-builder-adapter-evm")
       */
      {
        name: 'test-adapter-package-resolver',
        enforce: 'pre',
        resolveId(id: string) {
          if (id in adapterPackagePaths) {
            return adapterPackagePaths[id];
          }
          return null;
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Adapter packages - required for export tests that use ecosystemManager
        '@openzeppelin/ui-builder-adapter-evm': path.resolve(
          __dirname,
          '../../packages/adapter-evm/dist/index.js'
        ),
        '@openzeppelin/ui-builder-adapter-solana': path.resolve(
          __dirname,
          '../../packages/adapter-solana/dist/index.js'
        ),
        '@openzeppelin/ui-builder-adapter-stellar': path.resolve(
          __dirname,
          '../../packages/adapter-stellar/dist/index.js'
        ),
        '@openzeppelin/ui-builder-adapter-midnight': path.resolve(
          __dirname,
          '../../packages/adapter-midnight/dist/index.js'
        ),
      },
      dedupe: [
        '@openzeppelin/ui-renderer',
        '@openzeppelin/ui-types',
        '@openzeppelin/ui-react',
        '@openzeppelin/ui-components',
        '@openzeppelin/ui-builder-adapter-evm',
        '@openzeppelin/ui-builder-adapter-solana',
        '@openzeppelin/ui-builder-adapter-stellar',
        '@openzeppelin/ui-builder-adapter-midnight',
        'react',
        'react-dom',
      ],
    },
    // Add optimizeDeps for Vite to correctly process these linked workspace packages
    optimizeDeps: {
      include: [
        '@openzeppelin/ui-renderer',
        '@openzeppelin/ui-types',
        '@openzeppelin/ui-react',
        '@openzeppelin/ui-components',
        '@openzeppelin/ui-builder-adapter-evm',
        '@openzeppelin/ui-builder-adapter-solana',
        '@openzeppelin/ui-builder-adapter-stellar',
        '@openzeppelin/ui-builder-adapter-midnight',
      ],
    },
    // Add ssr.noExternal to ensure these are not treated as external during test SSR phase
    ssr: {
      noExternal: [
        '@openzeppelin/ui-renderer',
        '@openzeppelin/ui-types',
        '@openzeppelin/ui-react',
        '@openzeppelin/ui-components',
        '@openzeppelin/ui-builder-adapter-evm',
        '@openzeppelin/ui-builder-adapter-solana',
        '@openzeppelin/ui-builder-adapter-stellar',
        '@openzeppelin/ui-builder-adapter-midnight',
      ],
    },
    test: {
      // Include all test settings from shared config
      globals: true,
      environment: 'jsdom',
      setupFiles: [path.resolve(__dirname, './src/test/setup.ts')],
      passWithNoTests: true,
      // Increase timeouts to avoid flakes in heavy export tests under Vite 7
      // EVM adapter initialization takes ~12s, needs buffer for parallel contention
      testTimeout: 30000,
      hookTimeout: 30000,
      teardownTimeout: 30000,
      // Run export tests sequentially to avoid resource contention during
      // heavy EVM adapter dynamic imports (which take ~12s each)
      poolOptions: {
        threads: {
          singleThread: false,
        },
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'json-summary'],
        reportsDirectory: './coverage',
        exclude: ['**/node_modules/**', '**/dist/**', '**/src/test/**'],
      },
    },
  })
);
