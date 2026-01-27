/**
 * Adapter-specific query wrapper for Polkadot EVM
 *
 * Wraps the core queryEvmViewFunction with adapter-specific functionality:
 * - Resolves RPC URL from network config (with user override support)
 *
 * @remarks
 * With ecosystem-agnostic core functions, TypedPolkadotNetworkConfig can be
 * passed directly without conversion.
 */

import {
  queryEvmViewFunction as coreQueryEvmViewFunction,
  isEvmViewFunction as isViewFunction,
  resolveRpcUrl,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { ContractSchema } from '@openzeppelin/ui-types';

import type { TypedPolkadotNetworkConfig } from '../../types';

// Re-export with ecosystem-agnostic name
export { isViewFunction };

/**
 * Query a view/pure function without wallet connection.
 * Delegates to adapter-evm-core.
 *
 * @remarks
 * With ecosystem-agnostic core functions, TypedPolkadotNetworkConfig can be
 * passed directly without conversion.
 */
export async function queryViewFunction(
  address: string,
  functionId: string,
  params: unknown[],
  schema: ContractSchema,
  networkConfig: TypedPolkadotNetworkConfig
): Promise<unknown> {
  // Pass networkConfig directly - core functions now accept any ecosystem
  const rpcUrl = resolveRpcUrl(networkConfig);
  return coreQueryEvmViewFunction(address, functionId, params, schema, rpcUrl, networkConfig);
}
