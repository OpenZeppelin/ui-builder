/**
 * Configuration for the Midnight adapter
 *
 * This file defines the dependencies required by the Midnight adapter
 * when generating exported projects. It follows the AdapterConfig
 * interface to provide a structured approach to dependency management.
 */
import type { AdapterConfig } from '@openzeppelin/ui-types';

export const midnightAdapterConfig: AdapterConfig = {
  /**
   * Dependencies required by the Midnight adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // Runtime dependencies
    runtime: {
      // Core Midnight SDK packages (with exact versions for patch compatibility)
      '@midnight-ntwrk/compact-runtime': '0.9.0',
      '@midnight-ntwrk/onchain-runtime': '^0.3.0',
      '@midnight-ntwrk/ledger': '4.0.0',
      '@midnight-ntwrk/zswap': '4.0.0',
      '@midnight-ntwrk/wallet-sdk-address-format': '2.0.0',

      // Midnight SDK JS libraries (with patches)
      '@midnight-ntwrk/midnight-js-contracts': '^2.0.2',
      '@midnight-ntwrk/midnight-js-network-id': '^2.0.2',
      '@midnight-ntwrk/midnight-js-types': '^2.0.2',
      '@midnight-ntwrk/midnight-js-utils': '^2.0.2',
      '@midnight-ntwrk/midnight-js-indexer-public-data-provider': '^2.0.2',
      '@midnight-ntwrk/midnight-js-http-client-proof-provider': '^2.0.2',
      '@midnight-ntwrk/midnight-js-level-private-state-provider': '^2.0.2',
      '@midnight-ntwrk/midnight-js-fetch-zk-config-provider': '^2.0.2',
      '@midnight-ntwrk/midnight-js-node-zk-config-provider': '^2.0.2',

      // Wallet integration
      '@midnight-ntwrk/dapp-connector-api': '^3.0.0',

      // Reactive state management
      rxjs: '^7.8.1',

      // ZIP file handling for contract artifacts
      jszip: '^3.10.1',

      // Protocol Buffers (required for Midnight SDK serialization)
      // These are transitive dependencies but must be explicit for Vite optimizeDeps
      protobufjs: '^7.4.0',
      '@protobufjs/float': '^1.0.2',
      '@protobufjs/utf8': '^1.1.0',
      '@protobufjs/base64': '^1.1.2',
      '@protobufjs/inquire': '^1.1.0',
      '@protobufjs/pool': '^1.1.0',
      '@protobufjs/aspromise': '^1.1.2',
      '@protobufjs/eventemitter': '^1.1.0',
      '@protobufjs/fetch': '^1.1.0',
      '@protobufjs/path': '^1.1.2',
      '@protobufjs/codegen': '^2.0.4',

      // Browser polyfills (required for Midnight SDK browser compatibility)
      buffer: '^6.0.3',
      events: '^3.3.0', // Node.js events polyfill for abstract-level

      // Additional transitive dependencies required by Midnight SDK
      'object-inspect': '^1.13.3',
      'cross-fetch': '^4.1.0',
      'fetch-retry': '^6.0.0',
      lodash: '^4.17.21',
      level: '^8.0.1',
      'classic-level': '^1.4.1',
      'abstract-level': '^2.0.0',
      'browser-level': '^1.0.1',
      '@apollo/client': '^3.14.0',

      // UI framework
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },

    // Development dependencies
    dev: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
    },

    // Build tool dependencies (Vite plugins for WASM support)
    build: {
      'vite-plugin-wasm': '^3.3.0',
      'vite-plugin-top-level-await': '^1.4.4',
    },
  },

  /**
   * Package version overrides to ensure exact versions that have patches
   * These force pnpm to install the exact versions for which patches exist
   */
  overrides: {
    '@midnight-ntwrk/compact-runtime': '0.9.0',
    '@midnight-ntwrk/midnight-js-contracts': '2.0.2',
    '@midnight-ntwrk/midnight-js-network-id': '2.0.2',
    '@midnight-ntwrk/midnight-js-types': '2.0.2',
    '@midnight-ntwrk/midnight-js-utils': '2.0.2',
    '@midnight-ntwrk/midnight-js-indexer-public-data-provider': '2.0.2',
    '@midnight-ntwrk/midnight-js-http-client-proof-provider': '2.0.2',
  },

  /**
   * Vite configuration for exported applications
   * Provides the necessary build configuration for Midnight SDK's WASM modules
   */
  viteConfig: {
    imports: [
      "import topLevelAwait from 'vite-plugin-top-level-await';",
      "import wasm from 'vite-plugin-wasm';",
      '',
      "import { getMidnightViteConfig } from '@openzeppelin/ui-builder-adapter-midnight/vite-config';",
    ],
    configInit: 'const midnightConfig = getMidnightViteConfig({ wasm, topLevelAwait });',
    plugins: '...(midnightConfig.plugins || []),',
    dedupe: 'dedupe: [...(midnightConfig.resolve?.dedupe || [])],',
    optimizeDeps: {
      include: 'include: [...(midnightConfig.optimizeDeps?.include || [])],',
      exclude: 'exclude: [...(midnightConfig.optimizeDeps?.exclude || [])],',
    },
  },

  /**
   * Note: Midnight SDK patches are bundled with this adapter package.
   * When this adapter is installed via npm/pnpm, the patches are automatically
   * applied thanks to the pnpm.patchedDependencies configuration in this package's
   * package.json. No additional configuration is needed in consuming applications.
   *
   * See packages/adapter-midnight/patches/ for the patch files.
   * See packages/adapter-midnight/package.json "pnpm.patchedDependencies" for the configuration.
   */
};
