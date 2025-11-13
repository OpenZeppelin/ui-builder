/**
 * EVM Adapter: Vite Configuration Export
 *
 * This module exports Vite configuration fragments for the EVM adapter.
 * Currently minimal, but provides a consistent interface for adapter-specific
 * build requirements.
 *
 * USAGE:
 * 1. In the main builder app: Import and merge into packages/builder/vite.config.ts
 * 2. In exported apps: The export system injects these configs when EVM is used
 *
 * See: docs/ADAPTER_ARCHITECTURE.md § "Build-Time Requirements"
 */

import type { UserConfig } from 'vite';

/**
 * Returns the Vite configuration required for EVM adapter compatibility
 *
 * @returns Vite configuration object to be merged with your main vite.config
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { getEvmViteConfig } from '@openzeppelin/ui-builder-adapter-evm/vite-config';
 *
 * export default defineConfig(({ mode }) => {
 *   const evmConfig = getEvmViteConfig();
 *
 *   return {
 *     plugins: [
 *       react(),
 *       ...evmConfig.plugins,
 *     ],
 *     resolve: {
 *       dedupe: [
 *         ...evmConfig.resolve.dedupe,
 *       ],
 *     },
 *   };
 * });
 * ```
 */
export function getEvmViteConfig(): UserConfig {
  return {
    // Currently no EVM-specific plugins required
    plugins: [],

    resolve: {
      // Module Deduplication
      // Ensure singleton instances of shared dependencies
      dedupe: [
        // EVM-specific dependencies that may need deduplication
        'viem',
        'wagmi',
        '@wagmi/core',
      ],
    },

    optimizeDeps: {
      // Force Pre-Bundling (CommonJS → ESM conversion)
      // Include wagmi and @wagmi/core to ensure they're properly resolved
      // when the EVM adapter is dynamically imported in production builds
      include: ['wagmi', '@wagmi/core', 'viem', '@tanstack/react-query'],
      exclude: [],
    },
  };
}
