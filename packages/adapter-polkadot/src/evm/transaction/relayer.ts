/**
 * Relayer Execution Strategy for Polkadot EVM Adapter
 *
 * Provides relayer integration for transaction execution.
 *
 * @remarks
 * With ecosystem-agnostic core functions, TypedPolkadotNetworkConfig can be
 * passed directly without conversion.
 */

import {
  RelayerExecutionStrategy,
  type EvmRelayerTransactionOptions,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { RelayerDetails, RelayerDetailsRich } from '@openzeppelin/ui-types';

import type { TypedPolkadotNetworkConfig } from '../../types';

// Re-export core types
export { RelayerExecutionStrategy, type EvmRelayerTransactionOptions };

/**
 * Get available relayers for a network.
 * Uses RelayerExecutionStrategy from adapter-evm-core.
 *
 * @remarks
 * With ecosystem-agnostic core functions, TypedPolkadotNetworkConfig can be
 * passed directly without conversion.
 */
export async function getRelayers(
  serviceUrl: string,
  accessToken: string,
  networkConfig: TypedPolkadotNetworkConfig
): Promise<RelayerDetails[]> {
  const relayerStrategy = new RelayerExecutionStrategy();
  // Pass networkConfig directly - core functions now accept any ecosystem
  return relayerStrategy.getEvmRelayers(serviceUrl, accessToken, networkConfig);
}

/**
 * Get a specific relayer by ID.
 * Uses RelayerExecutionStrategy from adapter-evm-core.
 *
 * @remarks
 * With ecosystem-agnostic core functions, TypedPolkadotNetworkConfig can be
 * passed directly without conversion.
 */
export async function getRelayer(
  serviceUrl: string,
  accessToken: string,
  relayerId: string,
  networkConfig: TypedPolkadotNetworkConfig
): Promise<RelayerDetailsRich> {
  const relayerStrategy = new RelayerExecutionStrategy();
  // Pass networkConfig directly - core functions now accept any ecosystem
  return relayerStrategy.getEvmRelayer(serviceUrl, accessToken, relayerId, networkConfig);
}
