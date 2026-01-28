import type { Chain } from 'viem';

import type { EvmNetworkConfig } from '@openzeppelin/ui-types';

/**
 * Network configuration types for EVM-compatible networks
 */

/**
 * Base interface for any EVM-compatible network configuration.
 * This allows core functions to work with both EVM and Polkadot (and future) adapters.
 * The ecosystem field is generic to allow strict typing while maintaining flexibility.
 *
 * @typeParam E - The ecosystem type, defaults to `string` for maximum flexibility.
 *                Adapters can use specific string literals (e.g., `'polkadot'`) for stricter typing.
 *
 * @remarks
 * Core functions don't actually use the `ecosystem` field at runtime - they rely on
 * `chainId`, `rpcUrl`, and other EVM-compatible fields. This type relaxation eliminates
 * the need for adapter wrapper functions that only exist to convert types.
 *
 * @example
 * ```typescript
 * // Flexible usage (defaults to string)
 * function processConfig(config: EvmCompatibleNetworkConfig) { ... }
 *
 * // Strict typing for specific adapters
 * type PolkadotConfig = EvmCompatibleNetworkConfig<'polkadot'>;
 * ```
 */
export interface EvmCompatibleNetworkConfig<E extends string = string>
  extends Omit<EvmNetworkConfig, 'ecosystem'> {
  /**
   * Ecosystem identifier. Generic type parameter allows strict typing while
   * maintaining flexibility. Defaults to `string` so core functions can accept
   * configs from any EVM-compatible adapter (EVM, Polkadot, etc.).
   */
  ecosystem: E;

  /**
   * Viem Chain object for this EVM network.
   * If provided, this will be used directly by Viem clients.
   * If not provided, a fallback chain object will be created.
   */
  viemChain?: Chain;
}

/**
 * EVM-specific network configuration with strict `ecosystem: 'evm'` constraint.
 * Use this type in EVM-only contexts where you want strict ecosystem typing.
 *
 * For function signatures that should accept configs from multiple adapters
 * (EVM, Polkadot, etc.), use `EvmCompatibleNetworkConfig` instead.
 */
export type TypedEvmNetworkConfig = EvmCompatibleNetworkConfig<'evm'>;
