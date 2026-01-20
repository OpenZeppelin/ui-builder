import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

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
 * Plugin to stub CSS imports in Node environment
 * Node.js cannot process CSS files, so we intercept them and return empty modules.
 * This works in conjunction with server.deps.inline to handle CSS from npm packages.
 */
function cssStubPlugin(): Plugin {
  return {
    name: 'css-stub',
    enforce: 'pre',
    resolveId(id) {
      if (id.endsWith('.css') || id.endsWith('.scss') || id.endsWith('.sass')) {
        return `\0virtual:css-stub:${id}`;
      }
      return null;
    },
    load(id) {
      if (id.startsWith('\0virtual:css-stub:')) {
        return 'export default {}';
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    // Stub CSS imports before other plugins process them
    cssStubPlugin(),
    // Include React plugin
    react(),
    // Use the real virtual content loader plugin
    virtualContentLoaderPlugin(),
    crossPackageModulesProviderPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Basic test configuration - adapt if needed for the specific export test
    globals: true,
    environment: 'node', // Export test likely runs better in node env
    passWithNoTests: true,
    // Increase timeouts for CLI export which performs heavier work (zipping, processing)
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    // Use forks pool for better module control
    pool: 'forks',
    // Force external packages through Vite transformation to handle CSS
    server: {
      deps: {
        // Force these packages to be processed by Vite's transform pipeline
        // instead of being loaded directly by Node
        inline: [
          '@uiw/react-textarea-code-editor',
          '@openzeppelin/ui-components',
          '@openzeppelin/ui-renderer',
        ],
      },
    },
  },
});
