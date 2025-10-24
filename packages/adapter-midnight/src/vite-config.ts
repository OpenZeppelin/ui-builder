/**
 * Midnight Adapter: Vite Configuration Export
 *
 * This module exports Vite configuration fragments required for the Midnight SDK
 * to function correctly in browser environments. These configs handle WASM modules,
 * module deduplication, and CommonJS/ESM interop.
 *
 * USAGE:
 * 1. In the main builder app: Import and merge into packages/builder/vite.config.ts
 * 2. In exported apps: The export system injects these configs when Midnight is used
 *
 * See: docs/ADAPTER_ARCHITECTURE.md § "Build-Time Requirements"
 */

import type { Plugin, UserConfig } from 'vite';

/**
 * Vite plugins required by Midnight SDK
 * Handles WASM file loading and top-level await syntax
 */
export interface MidnightVitePlugins {
  wasm: () => Plugin;
  topLevelAwait: () => Plugin;
}

/**
 * Returns the Vite configuration required for Midnight SDK compatibility
 *
 * @param plugins - Object containing wasm and topLevelAwait plugin factories
 * @returns Vite configuration object to be merged with your main vite.config
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { getMidnightViteConfig } from '@openzeppelin/ui-builder-adapter-midnight/vite-config';
 * import wasm from 'vite-plugin-wasm';
 * import topLevelAwait from 'vite-plugin-top-level-await';
 *
 * export default defineConfig(({ mode }) => {
 *   const midnightConfig = getMidnightViteConfig({ wasm, topLevelAwait });
 *
 *   return {
 *     plugins: [
 *       react(),
 *       ...midnightConfig.plugins,
 *     ],
 *     resolve: {
 *       dedupe: [
 *         ...midnightConfig.resolve.dedupe,
 *       ],
 *     },
 *     optimizeDeps: {
 *       include: [
 *         ...midnightConfig.optimizeDeps.include,
 *       ],
 *       exclude: [
 *         ...midnightConfig.optimizeDeps.exclude,
 *       ],
 *     },
 *   };
 * });
 * ```
 */
export function getMidnightViteConfig(plugins: MidnightVitePlugins): UserConfig {
  return {
    // WASM & Top-Level Await Support
    // Required for Midnight SDK's WASM modules and async initialization
    plugins: [plugins.wasm(), plugins.topLevelAwait()],

    resolve: {
      // Module Deduplication
      // CRITICAL: Maintains singleton state and prevents WASM context fragmentation
      // Multiple instances cause `setNetworkId()` to set one instance while
      // `getNetworkId()` reads from another, resulting in "Undeployed" errors
      dedupe: [
        '@midnight-ntwrk/compact-runtime',
        '@midnight-ntwrk/ledger',
        '@midnight-ntwrk/zswap',
        '@midnight-ntwrk/midnight-js-contracts',
        '@midnight-ntwrk/midnight-js-network-id', // CRITICAL: Singleton
      ],
    },

    optimizeDeps: {
      // Force Pre-Bundling (CommonJS → ESM conversion)
      // The Midnight SDK uses CommonJS modules that must be converted to ESM for
      // browser compatibility. These packages are force pre-bundled to ensure proper
      // module format conversion and singleton behavior.
      include: [
        // Browser polyfills (CommonJS → ESM conversion)
        'buffer', // Required by Midnight SDK for browser compatibility
        'events', // Node.js events polyfill for abstract-level

        // Midnight SDK core runtime packages
        // IMPORTANT: These are also in `dedupe` to prevent WASM context fragmentation
        '@midnight-ntwrk/compact-runtime',
        '@midnight-ntwrk/ledger',
        '@midnight-ntwrk/zswap',
        '@midnight-ntwrk/midnight-js-contracts',
        // NOTE: midnight-js-network-id is in `exclude` (not here) due to top-level await
        'object-inspect', // Required by compact-runtime

        // HTTP utilities (CommonJS/UMD → ESM conversion)
        'cross-fetch',
        'fetch-retry',

        // Midnight SDK providers (must be pre-bundled to properly handle their CommonJS dependencies)
        '@midnight-ntwrk/midnight-js-indexer-public-data-provider',

        // Utilities (CommonJS → ESM conversion)
        'lodash', // Used by Midnight SDK, requires ESM conversion

        // Protobufjs ecosystem (used by Midnight SDK for serialization)
        // Include main package and ALL submodules to ensure ESM named exports in the browser
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

        // LevelDB (private state storage in browser)
        'level',
        'classic-level',
        'abstract-level',
        'browser-level',

        // Apollo Client (used by indexer provider, requires CommonJS → ESM conversion)
        '@apollo/client',
        '@apollo/client/core',
      ],

      // Exclude from Pre-Bundling
      // These packages contain WASM or use top-level await and must be handled by
      // vite-plugin-wasm and vite-plugin-top-level-await at runtime, not pre-bundled.
      exclude: [
        '@midnight-ntwrk/onchain-runtime',
        '@midnight-ntwrk/midnight-js-types',
        '@midnight-ntwrk/midnight-js-utils',
        '@midnight-ntwrk/midnight-js-network-id',
        '@midnight-ntwrk/wallet-sdk-address-format',
        '@midnight-ntwrk/midnight-js-http-client-proof-provider',
        '@midnight-ntwrk/midnight-js-level-private-state-provider',
        '@midnight-ntwrk/midnight-js-node-zk-config-provider',
      ],
    },
  };
}
