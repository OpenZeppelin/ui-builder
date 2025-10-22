import path from 'path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

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
 * packages/builder/src/docs/cross-package-imports.md
 */

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  customLogger: logger,
  plugins: [
    // WASM support for Midnight packages
    wasm(),
    topLevelAwait(),
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
      '@openzeppelin/ui-builder-react-core': path.resolve(__dirname, '../react-core/src/index.ts'),
      '@openzeppelin/ui-builder-utils': path.resolve(__dirname, '../utils/src/index.ts'),
      // Force buffer to use the browser-friendly version
      buffer: 'buffer/',
    },
    // Dedupe critical Midnight runtime packages to ensure single WASM context
    // This prevents WASM context fragmentation when evaluating contracts dynamically
    dedupe: [
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/ledger',
      '@midnight-ntwrk/zswap',
      '@midnight-ntwrk/midnight-js-contracts',
    ],
  },
  define: {
    'process.env': {},
    // Some transitive dependencies referenced by wallet stacks expect Node's `global` in the browser.
    // In particular, chains of imports like randombytes -> @near-js/crypto -> @hot-wallet/sdk
    // can throw "ReferenceError: global is not defined" during runtime without this alias.
    // Mapping `global` to `globalThis` provides a safe browser shim.
    global: 'globalThis',
  },
  optimizeDeps: {
    // Add Node.js polyfills for browser compatibility
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
    // Force pre-bundling of CommonJS packages to convert to ESM
    // This is needed for Midnight SDK dependencies that have CJS/ESM interop issues
    include: [
      // Midnight SDK core runtime (CommonJS package that needs ESM conversion)
      // Also included in dedupe to ensure single WASM context across dynamic contract evaluation
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/ledger',
      '@midnight-ntwrk/zswap',
      '@midnight-ntwrk/midnight-js-contracts',
      'object-inspect', // Required by compact-runtime

      // HTTP utilities (CommonJS/UMD packages that need ESM conversion)
      'cross-fetch',
      'fetch-retry',

      // Protobufjs (used by Midnight SDK for serialization)
      // These CommonJS packages need to be pre-bundled to work in browser
      'protobufjs',
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

      // LevelDB (used for private state storage in browser)
      // These are CommonJS packages that need ESM conversion for browser use
      'level',
      'classic-level',
      'abstract-level',
      'browser-level',
    ],
    // Exclude Midnight packages with WASM/top-level await from pre-bundling
    // These must be handled by the WASM plugins at runtime
    // Note: ledger, zswap, and midnight-js-contracts are now in 'include' for deduping
    exclude: [
      '@midnight-ntwrk/onchain-runtime',
      '@midnight-ntwrk/midnight-js-indexer-public-data-provider',
      '@midnight-ntwrk/midnight-js-types',
      '@midnight-ntwrk/midnight-js-utils',
      '@midnight-ntwrk/midnight-js-network-id',
      '@midnight-ntwrk/wallet-sdk-address-format',
      '@midnight-ntwrk/midnight-js-http-client-proof-provider',
      '@midnight-ntwrk/midnight-js-level-private-state-provider',
      '@midnight-ntwrk/midnight-js-node-zk-config-provider',
      // Also exclude Apollo Client to avoid CommonJS/ESM conflicts
      '@apollo/client',
    ],
  },
  build: {
    outDir: 'dist',
    // Optimize build for memory usage
    rollupOptions: {
      // External Midnight WASM packages to prevent bundling Node.js-specific code
      external: (id) => {
        const midnightWasmPackages = [
          '@midnight-ntwrk/zswap',
          '@midnight-ntwrk/onchain-runtime',
          '@midnight-ntwrk/ledger',
        ];
        return midnightWasmPackages.some((pkg) => id === pkg || id.startsWith(pkg + '/'));
      },
      output: {
        // Split chunks to reduce memory usage during build
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-checkbox', '@radix-ui/react-dialog'],
          web3: ['viem', 'wagmi', '@tanstack/react-query'],
        },
        // Suppress sourcemap warnings for dependencies
        sourcemapIgnoreList: (relativeSourcePath) => {
          return relativeSourcePath.includes('@midnight-ntwrk');
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
