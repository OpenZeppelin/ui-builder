import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Virtual module mocks for testing
 *
 * Define mock implementations for all virtual modules used in the application.
 * This should mirror the virtual modules defined in vite.config.ts
 *
 * For detailed documentation on this approach, see:
 * packages/core/src/docs/cross-package-imports.md
 */
const virtualModuleMocks: Record<string, string> = {
  // Module ID -> mock implementation
  'virtual:form-renderer-config': `
    export const formRendererConfig = {
      coreDependencies: {},
      fieldDependencies: {}
    };
  `,
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
export default defineConfig({
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
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@form-renderer': path.resolve(__dirname, '../form-renderer/src'),
      '@styles': path.resolve(__dirname, '../styles'),
    },
  },
  test: {
    // Include all test settings from shared config
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, '../../test/setup.ts')],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: ['**/node_modules/**', '**/dist/**', '**/src/test/**'],
    },
  },
});
