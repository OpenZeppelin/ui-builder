/**
 * @fileoverview Core type definitions for the Polkadot adapter.
 * These types extend the base types from `@openzeppelin/ui-types` with
 * adapter-level refinements (e.g. strongly-typed viem Chain).
 *
 * ## Developer Notes: Future Substrate Extension
 *
 * When adding Substrate (non-EVM) support, consider:
 *
 * 1. **New Base Type**: Substrate networks won't inherit from TypedEvmNetworkConfig.
 *    Create TypedSubstrateNetworkConfig with:
 *    - wsEndpoint (WebSocket RPC)
 *    - ss58Prefix (address format)
 *    - runtime metadata endpoint
 *
 * 2. **Union Type**: TypedPolkadotNetworkConfig could become:
 *    ```typescript
 *    type TypedPolkadotNetworkConfig =
 *      | TypedPolkadotEvmNetworkConfig    // Current type (EVM-based)
 *      | TypedPolkadotSubstrateNetworkConfig; // New type (ink!/Wasm)
 *    ```
 *
 * 3. **Runtime Detection**: Use executionType to discriminate at runtime
 */

import type { Chain } from 'viem';

import type { PolkadotNetworkConfig } from '@openzeppelin/ui-types';

/**
 * Re-exported from `@openzeppelin/ui-types` for convenience.
 *
 * - `PolkadotExecutionType`: `'evm' | 'substrate'`
 *   [SUBSTRATE TODO]: When adding Substrate support, the adapter will route
 *   operations based on this type. Networks with executionType: 'substrate'
 *   will use polkadot-api for queries and transactions instead of viem/wagmi.
 *
 * - `PolkadotNetworkCategory`: `'hub' | 'parachain'`
 *   'hub' = Official Polkadot/Kusama system chains (displayed first)
 *   'parachain' = Independent parachains (displayed after hub networks)
 *
 * - `PolkadotRelayChain`: `'polkadot' | 'kusama'`
 */
export type {
  PolkadotExecutionType,
  PolkadotNetworkCategory,
  PolkadotRelayChain,
} from '@openzeppelin/ui-types';

/**
 * Extended network configuration for Polkadot ecosystem.
 *
 * Extends {@link PolkadotNetworkConfig} from `@openzeppelin/ui-types`
 * (which already defines ecosystem, executionType, networkCategory, relayChain,
 * and all inherited EVM fields) with a strongly-typed `viemChain` field
 * (narrowed from `unknown` to viem {@link Chain}).
 */
export interface TypedPolkadotNetworkConfig extends PolkadotNetworkConfig {
  viemChain?: Chain;
}
