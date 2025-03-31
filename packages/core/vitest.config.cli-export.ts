import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

import { crossPackageModulesProviderPlugin } from './vite-plugins/cross-package-provider';
// Import the REAL plugins
import { virtualContentLoaderPlugin } from './vite-plugins/virtual-content-loader';

/**
 * Vitest Configuration for CLI Export Tests
 *
 * This configuration is specifically for running the `export-cli-wrapper.test.ts`.
 * Unlike the main vitest.config.ts, this configuration uses the REAL
 * virtual content loader plugin (`virtualContentLoaderPlugin`) instead of mocks.
 * This ensures the CLI export process generates a bundle with the actual
 * content of CSS and configuration files, mirroring the UI export process.
 */

/**
 * Configuration for cross-package virtual modules (copied from vite.config.ts)
 */
// const crossPackageModules: Record<string, string> = { ... };

/**
 * Plugin to provide cross-package module imports (copied from vite.config.ts)
 */
// function crossPackageModulesProviderPlugin(): Plugin { ... }

export default defineConfig({
  plugins: [
    // Include React plugin
    react(),
    // Use the real virtual content loader plugin
    virtualContentLoaderPlugin(),
    crossPackageModulesProviderPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@form-renderer': path.resolve(__dirname, '../form-renderer/src'),
      '@styles': path.resolve(__dirname, '../styles'),
      // Define the aliases needed by crossPackageModulesProviderPlugin
      '@cross-package/form-renderer-config': path.resolve(
        __dirname,
        '../form-renderer/src/config.ts'
      ),
      // Note: No need for @cross-package aliases here as the real plugin resolves paths directly
    },
  },
  test: {
    // Basic test configuration - adapt if needed for the specific export test
    globals: true,
    environment: 'node', // Export test likely runs better in node env
    // setupFiles: [path.resolve(__dirname, '../../test/setup.ts')], // May not need full browser setup
    passWithNoTests: true,
    // Coverage is likely not relevant for this specific config
  },
});
