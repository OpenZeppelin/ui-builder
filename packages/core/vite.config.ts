import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

import { crossPackageModulesProviderPlugin } from './vite-plugins/cross-package-provider';
import { virtualContentLoaderPlugin } from './vite-plugins/virtual-content-loader';

import templatePlugin from './vite.template-plugin';

/**
 * Configuration for virtual modules
 *
 * This defines which virtual modules should be created and their corresponding
 * source files in other packages. Add new entries here when you need to access
 * configuration from another package.
 *
 * For detailed documentation on this approach, see:
 * packages/core/src/docs/cross-package-imports.md
 */

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Restore custom plugins
    templatePlugin(),
    virtualContentLoaderPlugin(),
    crossPackageModulesProviderPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@styles': path.resolve(__dirname, '../styles'),
      '@cross-package/form-renderer-config': path.resolve(
        __dirname,
        '../form-renderer/src/config.ts'
      ),
      '@openzeppelin/transaction-form-utils': path.resolve(__dirname, '../utils/src/index.ts'),
    },
  },
  define: {
    'process.env': {},
  },
  build: {
    outDir: 'dist',
  },
});
