import type { UserConfig } from 'vite';

/**
 * Get Vite configuration for Polkadot adapter.
 * Minimal config for EVM-only mode (no WASM needed).
 */
export function getPolkadotViteConfig(): Partial<UserConfig> {
  return {
    optimizeDeps: {
      include: ['viem', 'lodash'],
    },
    ssr: {
      noExternal: ['viem'],
    },
  };
}
