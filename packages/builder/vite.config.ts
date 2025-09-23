import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
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
 * packages/builder/src/docs/cross-package-imports.md
 */

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
      '@cross-package/renderer-config': path.resolve(__dirname, '../renderer/src/config.ts'),
      '@openzeppelin/ui-builder-react-core': path.resolve(
        __dirname,
        '../react-core/src/index.ts'
      ),
      '@openzeppelin/ui-builder-utils': path.resolve(__dirname, '../utils/src/index.ts'),
    },
  },
  define: {
    'process.env': {},
    // Some transitive dependencies referenced by wallet stacks expect Node's `global` in the browser.
    // In particular, chains of imports like randombytes -> @near-js/crypto -> @hot-wallet/sdk
    // can throw "ReferenceError: global is not defined" during runtime without this alias.
    // Mapping `global` to `globalThis` provides a safe browser shim.
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    // Optimize build for memory usage
    rollupOptions: {
      output: {
        // Split chunks to reduce memory usage during build
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-checkbox', '@radix-ui/react-dialog'],
          web3: ['viem', 'wagmi', '@tanstack/react-query'],
        },
      },
      // Reduce memory usage during rollup processing
      maxParallelFileOps: 2,
    },
    // Increase chunk size warning limit to reduce warnings
    chunkSizeWarningLimit: 1000,
    // Reduce source map generation to save memory
    sourcemap: false,
    // Remove console and debugger in staging/production builds
    minify: 'esbuild',
    esbuild: mode === 'development' ? {} : { drop: ['console', 'debugger'] },
  },
}));
