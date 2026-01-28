/**
 * Adapter-specific query wrapper
 *
 * Wraps the core queryEvmViewFunction with adapter-specific functionality:
 * - Resolves RPC URL from network config (with user override support)
 * - Supports loading contract schema for proxy implementations
 */
import {
  queryEvmViewFunction as coreQueryEvmViewFunction,
  resolveRpcUrl,
  type TypedEvmNetworkConfig,
  type WagmiWalletImplementation,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { ContractSchema } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

/**
 * Query a view function on an EVM contract.
 *
 * This adapter-specific version wraps the core queryEvmViewFunction to:
 * 1. Resolve the RPC URL from network config (supporting user overrides)
 * 2. Support optional wallet implementation for RPC context
 * 3. Support loading proxy implementation schemas via callback
 *
 * @param contractAddress The contract address to query
 * @param functionId The function ID to call
 * @param networkConfig The network configuration
 * @param params The parameters for the function call
 * @param contractSchema Optional contract schema (if not provided, will use loadContractCallback)
 * @param _walletImplementation Optional wallet implementation (reserved for future use)
 * @param loadContractCallback Optional callback to load contract schema when not provided
 * @returns The result of the view function call
 */
export async function queryEvmViewFunction(
  contractAddress: string,
  functionId: string,
  networkConfig: TypedEvmNetworkConfig,
  params: unknown[] = [],
  contractSchema?: ContractSchema,
  _walletImplementation?: WagmiWalletImplementation,
  loadContractCallback?: (address: string) => Promise<ContractSchema>
): Promise<unknown> {
  // Use provided schema or fall back to loading via callback
  let schema = contractSchema;
  if (!schema) {
    if (loadContractCallback) {
      logger.debug('adapter-query', `Loading contract schema for ${contractAddress} via callback`);
      schema = await loadContractCallback(contractAddress);
    } else {
      throw new Error(
        'Contract schema is required for view function query. ' +
          'Provide either a contractSchema or a loadContractCallback.'
      );
    }
  }

  // Resolve RPC URL from network config (supports user overrides)
  // Note: resolveRpcUrl throws if no valid URL can be resolved
  const rpcUrl = resolveRpcUrl(networkConfig);

  logger.debug('adapter-query', `Using RPC URL for query: ${rpcUrl}`);

  // Call core function with resolved RPC URL
  return coreQueryEvmViewFunction(
    contractAddress,
    functionId,
    params,
    schema,
    rpcUrl,
    networkConfig
  );
}
