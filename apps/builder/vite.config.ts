import { createRequire } from 'node:module';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createOpenZeppelinAdapterIntegration } from '@openzeppelin/adapters-vite';
import { createLogger } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

import { supportedAdapterEcosystems } from './adapter-ecosystems';
import { crossPackageModulesProviderPlugin } from './vite-plugins/cross-package-provider';
import { virtualContentLoaderPlugin } from './vite-plugins/virtual-content-loader';

import templatePlugin from './vite.template-plugin';

// Create a custom logger to filter out sourcemap warnings for patched packages
const logger = createLogger();
const originalWarn = logger.warn;
logger.warn = (msg, options) => {
  // Suppress sourcemap warnings for patched Midnight SDK packages
  // The patches fix browser compatibility but sourcemaps reference missing source files
  if (msg.includes('Sourcemap') && msg.includes('@midnight-ntwrk')) {
    return;
  }
  originalWarn(msg, options);
};

/**
 * Configuration for virtual modules
 *
 * This defines which virtual modules should be created and their corresponding
 * source files in other packages. Add new entries here when you need to access
 * configuration from another package.
 *
 * For detailed documentation on this approach, see:
 * apps/builder/src/docs/cross-package-imports.md
 */

// https://vitejs.dev/config/
const require = createRequire(import.meta.url);
const bufferPolyfillPath = require.resolve('buffer/');
const adapters = createOpenZeppelinAdapterIntegration({
  ecosystems: supportedAdapterEcosystems,
  pluginFactories: {
    midnight: {
      wasm,
      topLevelAwait,
    },
  },
});

export default adapters.vite({
  customLogger: logger,
  plugins: [
    react(),
    tailwindcss(),
    templatePlugin(),
    virtualContentLoaderPlugin(),
    crossPackageModulesProviderPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Node built-ins polyfills for browser using absolute paths
      buffer: bufferPolyfillPath,
      'buffer/': bufferPolyfillPath,
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

  // ==============================================================================
  // DEPENDENCY PRE-BUNDLING & OPTIMIZATION
  // ==============================================================================
  // Pre-bundle dependencies upfront to prevent Vite from pausing requests while re-optimizing
  optimizeDeps: {
    // Comprehensive include list - all dependencies are pre-bundled upfront
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },

    // App-level dependencies. Adapter-specific pre-bundling requirements are merged by
    // createOpenZeppelinAdapterIntegration() so future apps only need to list their own deps.
    include: [
      // React core - explicit inclusion prevents runtime discovery
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',

      // OpenZeppelin UI packages - MUST be pre-bundled to avoid runtime discovery blocking
      '@openzeppelin/ui-components',
      '@openzeppelin/ui-react',
      '@openzeppelin/ui-renderer',
      '@openzeppelin/ui-storage',
      '@openzeppelin/ui-types',
      '@openzeppelin/ui-utils',

      // Large icon libraries - pre-bundle to avoid slow discovery
      'lucide-react',
      '@web3icons/react',
      '@icons-pack/react-simple-icons',

      // Form & state management
      'react-hook-form',
      'zod',
      'zustand',
      'zustand/shallow',
      'zustand/traditional',
      'zustand/vanilla',

      // UI libraries
      'sonner',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',

      // Radix UI components
      '@radix-ui/react-accordion',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',

      // Query & data fetching
      '@tanstack/react-query',

      // Deep compare utilities
      'fast-equals',
      'use-deep-compare-effect',

      // Code editor
      '@uiw/react-textarea-code-editor',

      // Wallet libraries - EVM
      'viem',
      'viem/chains',
      'viem/accounts',
      'wagmi',
      '@wagmi/core',
      '@wagmi/connectors',
      '@rainbow-me/rainbowkit',

      // Wallet libraries - Solana
      '@solana/web3.js',

      // Wallet libraries - Stellar
      '@stellar/stellar-sdk',
      '@stellar/stellar-xdr-json',
      '@creit.tech/stellar-wallets-kit',
      'lossless-json',

      // Utility libraries
      'lodash-es',

      // JSZip for exports
      'jszip',
    ],
  },
  build: {
    outDir: 'dist',
    // Optimize build for memory usage
    rollupOptions: {
      // Configure Rollup to not try to resolve imports from adapter dist files
      // Adapters are dynamically imported at runtime, so Rollup shouldn't analyze them
      // We use output.manualChunks to ensure wagmi deps are bundled separately
      output: {
        // Split chunks to reduce memory usage during build
        // NOTE: Do NOT add wagmi/@wagmi/core to manualChunks - they use Top-Level Await
        // which breaks when split into separate chunks due to minification reordering issues.
        // Let Rollup decide how to chunk wagmi for proper TLA initialization order.
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-checkbox', '@radix-ui/react-dialog'],
          web3: ['viem', '@tanstack/react-query'],
        },
        // Suppress sourcemap warnings for dependencies
        sourcemapIgnoreList: (relativeSourcePath: string) => {
          return relativeSourcePath.includes('@midnight-ntwrk');
        },
      },
      // Reduce memory usage during rollup processing
      maxParallelFileOps: 2,
    },
    // Increase chunk size warning limit to reduce warnings
    chunkSizeWarningLimit: 2000,
    // Reduce source map generation to save memory
    sourcemap: false,
    // Use esnext target to preserve Top-Level Await syntax natively
    // This is required because wagmi connectors use TLA which breaks with lower targets
    target: 'esnext',
    // Remove console and debugger in staging/production builds
    // NOTE: Use terser instead of esbuild to preserve TLA code order
    // esbuild's minification can reorder statements in a way that breaks TLA
    minify: 'terser',
    terserOptions: {
      // Keep variable names more intact to preserve initialization order
      mangle: {
        toplevel: false,
      },
    },
  },
});
