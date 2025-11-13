/**
 * Stellar Adapter: Vite Configuration Export
 *
 * This module exports Vite configuration fragments for the Stellar adapter.
 * Currently minimal, but provides a consistent interface for adapter-specific
 * build requirements.
 *
 * USAGE:
 * 1. In the main builder app: Import and merge into packages/builder/vite.config.ts
 * 2. In exported apps: The export system injects these configs when Stellar is used
 *
 * See: docs/ADAPTER_ARCHITECTURE.md § "Build-Time Requirements"
 */

import type { UserConfig } from 'vite';

/**
 * Returns the Vite configuration required for Stellar adapter compatibility
 *
 * @returns Vite configuration object to be merged with your main vite.config
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { getStellarViteConfig } from '@openzeppelin/ui-builder-adapter-stellar/vite-config';
 *
 * export default defineConfig(({ mode }) => {
 *   const stellarConfig = getStellarViteConfig();
 *
 *   return {
 *     plugins: [
 *       react(),
 *       ...stellarConfig.plugins,
 *     ],
 *     resolve: {
 *       dedupe: [
 *         ...stellarConfig.resolve.dedupe,
 *       ],
 *     },
 *   };
 * });
 * ```
 */
export function getStellarViteConfig(): UserConfig {
  return {
    // Currently no Stellar-specific plugins required
    plugins: [],

    resolve: {
      // Module Deduplication
      // Ensure singleton instances of shared dependencies
      dedupe: [
        // Stellar-specific dependencies that may need deduplication
        '@stellar/stellar-sdk',
        '@creit.tech/stellar-wallets-kit',
      ],
    },

    optimizeDeps: {
      // Force Pre-Bundling (CommonJS → ESM conversion)
      // Stellar dependencies are typically already ESM, but we include them here
      // for consistency and to ensure proper module resolution
      include: [],
      exclude: [],
    },
  };
}
