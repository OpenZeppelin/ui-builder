import { createRequire } from 'node:module';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import type { UserConfig } from 'vite';
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
 * apps/builder/src/docs/cross-package-imports.md
 */

/**
 * Dynamically loads adapter-specific Vite configurations
 *
 * This allows each adapter to provide its own build-time requirements
 * (e.g., WASM plugins for Midnight, module deduplication for EVM)
 * while maintaining the chain-agnostic architecture of the builder app.
 *
 * Fail-fast behavior: If any adapter's config fails to load, the build
 * will fail immediately. This ensures all adapters are properly configured
 * and prevents silent build issues.
 */
async function loadAdapterViteConfigs(): Promise<{
  plugins: UserConfig['plugins'];
  resolve: UserConfig['resolve'];
  optimizeDeps: UserConfig['optimizeDeps'];
}> {
  const plugins: UserConfig['plugins'] = [];
  const dedupe: string[] = [];
  const optimizeDepsInclude: string[] = [];
  const optimizeDepsExclude: string[] = [];

  // Load EVM adapter config
  try {
    const { getEvmViteConfig } = await import('@openzeppelin/ui-builder-adapter-evm/vite-config');
    const evmConfig = getEvmViteConfig();
    if (evmConfig.plugins) {
      plugins.push(...(Array.isArray(evmConfig.plugins) ? evmConfig.plugins : []));
    }
    if (evmConfig.resolve?.dedupe) {
      dedupe.push(...(Array.isArray(evmConfig.resolve.dedupe) ? evmConfig.resolve.dedupe : []));
    }
    if (evmConfig.optimizeDeps?.include) {
      optimizeDepsInclude.push(
        ...(Array.isArray(evmConfig.optimizeDeps.include) ? evmConfig.optimizeDeps.include : [])
      );
    }
    if (evmConfig.optimizeDeps?.exclude) {
      optimizeDepsExclude.push(
        ...(Array.isArray(evmConfig.optimizeDeps.exclude) ? evmConfig.optimizeDeps.exclude : [])
      );
    }
  } catch (error) {
    logger.error(`Failed to load EVM adapter Vite config: ${error}`);
    throw new Error(
      `Failed to load EVM adapter Vite configuration. This is a build error. ` +
        `Ensure @openzeppelin/ui-builder-adapter-evm is built and exports vite-config. ` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Load Midnight adapter config
  try {
    const { getMidnightViteConfig } = await import(
      '@openzeppelin/ui-builder-adapter-midnight/vite-config'
    );
    const midnightConfig = getMidnightViteConfig({ wasm, topLevelAwait });
    if (midnightConfig.plugins) {
      plugins.push(...(Array.isArray(midnightConfig.plugins) ? midnightConfig.plugins : []));
    }
    if (midnightConfig.resolve?.dedupe) {
      dedupe.push(
        ...(Array.isArray(midnightConfig.resolve.dedupe) ? midnightConfig.resolve.dedupe : [])
      );
    }
    if (midnightConfig.optimizeDeps?.include) {
      optimizeDepsInclude.push(
        ...(Array.isArray(midnightConfig.optimizeDeps.include)
          ? midnightConfig.optimizeDeps.include
          : [])
      );
    }
    if (midnightConfig.optimizeDeps?.exclude) {
      optimizeDepsExclude.push(
        ...(Array.isArray(midnightConfig.optimizeDeps.exclude)
          ? midnightConfig.optimizeDeps.exclude
          : [])
      );
    }
  } catch (error) {
    logger.error(`Failed to load Midnight adapter Vite config: ${error}`);
    throw new Error(
      `Failed to load Midnight adapter Vite configuration. This is a build error. ` +
        `Ensure @openzeppelin/ui-builder-adapter-midnight is built and exports vite-config. ` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Load Solana adapter config
  try {
    const { getSolanaViteConfig } = await import(
      '@openzeppelin/ui-builder-adapter-solana/vite-config'
    );
    const solanaConfig = getSolanaViteConfig();
    if (solanaConfig.plugins) {
      plugins.push(...(Array.isArray(solanaConfig.plugins) ? solanaConfig.plugins : []));
    }
    if (solanaConfig.resolve?.dedupe) {
      dedupe.push(
        ...(Array.isArray(solanaConfig.resolve.dedupe) ? solanaConfig.resolve.dedupe : [])
      );
    }
    if (solanaConfig.optimizeDeps?.include) {
      optimizeDepsInclude.push(
        ...(Array.isArray(solanaConfig.optimizeDeps.include)
          ? solanaConfig.optimizeDeps.include
          : [])
      );
    }
    if (solanaConfig.optimizeDeps?.exclude) {
      optimizeDepsExclude.push(
        ...(Array.isArray(solanaConfig.optimizeDeps.exclude)
          ? solanaConfig.optimizeDeps.exclude
          : [])
      );
    }
  } catch (error) {
    logger.error(`Failed to load Solana adapter Vite config: ${error}`);
    throw new Error(
      `Failed to load Solana adapter Vite configuration. This is a build error. ` +
        `Ensure @openzeppelin/ui-builder-adapter-solana is built and exports vite-config. ` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Load Stellar adapter config
  try {
    const { getStellarViteConfig } = await import(
      '@openzeppelin/ui-builder-adapter-stellar/vite-config'
    );
    const stellarConfig = getStellarViteConfig();
    if (stellarConfig.plugins) {
      plugins.push(...(Array.isArray(stellarConfig.plugins) ? stellarConfig.plugins : []));
    }
    if (stellarConfig.resolve?.dedupe) {
      dedupe.push(
        ...(Array.isArray(stellarConfig.resolve.dedupe) ? stellarConfig.resolve.dedupe : [])
      );
    }
    if (stellarConfig.optimizeDeps?.include) {
      optimizeDepsInclude.push(
        ...(Array.isArray(stellarConfig.optimizeDeps.include)
          ? stellarConfig.optimizeDeps.include
          : [])
      );
    }
    if (stellarConfig.optimizeDeps?.exclude) {
      optimizeDepsExclude.push(
        ...(Array.isArray(stellarConfig.optimizeDeps.exclude)
          ? stellarConfig.optimizeDeps.exclude
          : [])
      );
    }
  } catch (error) {
    logger.error(`Failed to load Stellar adapter Vite config: ${error}`);
    throw new Error(
      `Failed to load Stellar adapter Vite configuration. This is a build error. ` +
        `Ensure @openzeppelin/ui-builder-adapter-stellar is built and exports vite-config. ` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    plugins,
    resolve: {
      dedupe: dedupe.length > 0 ? dedupe : undefined,
    },
    optimizeDeps: {
      include: optimizeDepsInclude.length > 0 ? optimizeDepsInclude : undefined,
      exclude: optimizeDepsExclude.length > 0 ? optimizeDepsExclude : undefined,
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(async (): Promise<UserConfig> => {
  const require = createRequire(import.meta.url);
  const bufferPolyfillPath = require.resolve('buffer/');

  // Load adapter-specific Vite configurations
  const adapterConfigs = await loadAdapterViteConfigs();

  const config: UserConfig = {
    customLogger: logger,
    plugins: [
      // Adapter-specific plugins (e.g., WASM for Midnight)
      ...(adapterConfigs.plugins || []),

      // Core framework plugins
      react(),
      tailwindcss(),

      // Custom builder plugins
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

      // Module Deduplication (from adapter configs)
      dedupe: adapterConfigs.resolve?.dedupe || [],
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

      // App-level dependencies + Adapter-specific pre-bundling configuration
      // With noDiscovery: true, ALL deps must be listed here
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
        '@openzeppelin/relayer-sdk',

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
        'lodash',

        // JSZip for exports
        'jszip',

        // Adapter-specific dependencies
        ...(adapterConfigs.optimizeDeps?.include || []),
      ],
      exclude: [
        // Workspace adapter packages should NOT be pre-bundled (treat as source)
        '@openzeppelin/ui-builder-adapter-evm',
        '@openzeppelin/ui-builder-adapter-midnight',
        '@openzeppelin/ui-builder-adapter-solana',
        '@openzeppelin/ui-builder-adapter-stellar',
        // Adapter-specific exclusions
        ...(adapterConfigs.optimizeDeps?.exclude || []),
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
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-accordion', '@radix-ui/react-checkbox', '@radix-ui/react-dialog'],
            web3: ['viem', '@tanstack/react-query'],
            // Wagmi dependencies - required by EVM adapter for dynamic imports
            wagmi: ['wagmi', '@wagmi/core'],
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
      // Remove console and debugger in staging/production builds
      minify: 'esbuild',
    },
  };
  return config;
});
