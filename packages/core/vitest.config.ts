import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration
 *
 * This configuration includes special handling for the virtual:form-renderer-config module
 * that is used in PackageManager.ts. In the regular application, this module is provided
 * by the Vite plugin in vite.config.ts, but for tests, we need to provide a mock version.
 *
 * VIRTUAL MODULE SOLUTION OVERVIEW:
 *
 * 1. PROBLEM: The application needs to access configuration from the form-renderer package,
 *    but import.meta.glob doesn't reliably work across package boundaries in development mode.
 *
 * 2. SOLUTION:
 *    - In vite.config.ts: A virtual module that imports the real config using aliases
 *    - In this file: A mock implementation for tests
 *    - In PackageManager.ts: Direct import from the virtual module
 *
 * 3. TESTING APPROACH:
 *    Most tests that use PackageManager provide their own mocks via constructor parameters,
 *    but the virtual module is still needed to satisfy the import statement.
 *
 * Without this plugin, tests would fail with:
 * "Failed to resolve import 'virtual:form-renderer-config' from 'src/export/PackageManager.ts'"
 */
export default defineConfig({
  plugins: [
    // Include React plugin from shared config
    react(),

    /**
     * TEST-SPECIFIC VIRTUAL MODULE PROVIDER
     *
     * This plugin provides a mock implementation of the virtual:form-renderer-config
     * module used in the dev/build environment.
     *
     * In the real application, the virtual module is provided by a plugin in vite.config.ts
     * that imports the actual config from the form-renderer package. For tests, we
     * provide a basic mock implementation here.
     *
     * Most tests already provide their own mock via constructor parameters, but
     * this plugin is necessary to satisfy the import statement in PackageManager.ts.
     */
    {
      name: 'test-form-renderer-config-provider',
      resolveId(id: string) {
        if (id === 'virtual:form-renderer-config') {
          return '\0virtual:form-renderer-config';
        }
        return null;
      },
      load(id: string) {
        if (id === '\0virtual:form-renderer-config') {
          // Provide a minimal mock that the actual object will override in tests
          return `
            export const formRendererConfig = {
              coreDependencies: {},
              fieldDependencies: {}
            };
          `;
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
