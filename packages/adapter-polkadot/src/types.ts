/**
 * @fileoverview Core type definitions for the Polkadot adapter.
 * These types extend the EVM core types with Polkadot-specific fields.
 */

import type { TypedEvmNetworkConfig } from '@openzeppelin/ui-builder-adapter-evm-core';

/**
 * Polkadot network execution types.
 * - 'evm': Networks using EVM via PolkaVM/REVM or native EVM (Moonbeam)
 * - 'substrate': Future - Native Substrate/Wasm chains (not implemented)
 */
export type PolkadotExecutionType = 'evm' | 'substrate';

/**
 * Network category for UI grouping.
 * - 'hub': Official Polkadot/Kusama system chains (displayed first)
 * - 'parachain': Independent parachains (displayed after hub networks)
 */
export type PolkadotNetworkCategory = 'hub' | 'parachain';

/**
 * The Polkadot/Kusama relay chain this network connects to.
 */
export type PolkadotRelayChain = 'polkadot' | 'kusama';

/**
 * Extended network configuration for Polkadot ecosystem.
 * Inherits all EVM fields for EVM-compatible networks.
 * Overrides the ecosystem field to 'polkadot'.
 */
export interface TypedPolkadotNetworkConfig extends Omit<TypedEvmNetworkConfig, 'ecosystem'> {
  /**
   * Ecosystem identifier - always 'polkadot' for this adapter.
   */
  ecosystem: 'polkadot';

  /**
   * Execution type determines which handler processes requests.
   * Currently only 'evm' is implemented; 'substrate' reserved for future.
   */
  executionType: PolkadotExecutionType;

  /**
   * Network category for UI grouping.
   * Hub networks appear before parachain networks in selectors.
   */
  networkCategory: PolkadotNetworkCategory;

  /**
   * Optional: The relay chain this network is connected to.
   * Used for display purposes and filtering.
   */
  relayChain?: PolkadotRelayChain;
}
