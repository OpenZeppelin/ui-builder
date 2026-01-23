import type { UserConfig } from 'vite';

/**
 * Get Vite configuration for EVM core module.
 *
 * This provides minimal configuration for applications that need to resolve
 * dependencies used by adapter-evm-core. Consuming adapters can merge this
 * with their own Vite configuration.
 *
 * @returns Vite UserConfig with EVM core optimizations
 */
export function getEvmCoreViteConfig(): Partial<UserConfig> {
  return {
    optimizeDeps: {
      include: ['viem', 'lodash'],
    },
    ssr: {
      noExternal: ['viem'],
    },
  };
}
