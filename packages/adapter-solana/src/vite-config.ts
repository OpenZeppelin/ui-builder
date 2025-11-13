/**
 * Solana Adapter: Vite Configuration Export
 *
 * This module exports Vite configuration fragments for the Solana adapter.
 * Currently minimal, but provides a consistent interface for adapter-specific
 * build requirements.
 *
 * USAGE:
 * 1. In the main builder app: Import and merge into packages/builder/vite.config.ts
 * 2. In exported apps: The export system injects these configs when Solana is used
 *
 * See: docs/ADAPTER_ARCHITECTURE.md § "Build-Time Requirements"
 */

import type { UserConfig } from 'vite';

/**
 * Returns the Vite configuration required for Solana adapter compatibility
 *
 * @returns Vite configuration object to be merged with your main vite.config
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { getSolanaViteConfig } from '@openzeppelin/ui-builder-adapter-solana/vite-config';
 *
 * export default defineConfig(({ mode }) => {
 *   const solanaConfig = getSolanaViteConfig();
 *
 *   return {
 *     plugins: [
 *       react(),
 *       ...solanaConfig.plugins,
 *     ],
 *     resolve: {
 *       dedupe: [
 *         ...solanaConfig.resolve.dedupe,
 *       ],
 *     },
 *   };
 * });
 * ```
 */
export function getSolanaViteConfig(): UserConfig {
  return {
    // Currently no Solana-specific plugins required
    plugins: [],

    resolve: {
      // Module Deduplication
      // Ensure singleton instances of shared dependencies
      dedupe: [
        // Solana-specific dependencies that may need deduplication
        '@solana/web3.js',
        '@solana/wallet-adapter-base',
        '@solana/wallet-adapter-react',
      ],
    },

    optimizeDeps: {
      // Force Pre-Bundling (CommonJS → ESM conversion)
      // Solana dependencies are typically already ESM, but we include them here
      // for consistency and to ensure proper module resolution
      include: [],
      exclude: [],
    },
  };
}
