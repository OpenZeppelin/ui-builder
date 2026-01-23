/**
 * Adapter-specific query wrapper
 *
 * Wraps the core queryEvmViewFunction with adapter-specific functionality:
 * - Resolves RPC URL from network config
 * - Handles wallet implementation for RPC URL override
 * - Supports loading contract schema for proxy implementations
 */
import {
  queryEvmViewFunction as coreQueryEvmViewFunction,
  resolveRpcUrl,
  type TypedEvmNetworkConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { ContractSchema } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { WagmiWalletImplementation } from '../wallet/implementation/wagmi-implementation';

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
 * @param contractSchema Optional contract schema (if not provided, will error)
 * @param _walletImplementation Optional wallet implementation (reserved for future use)
 * @param _loadContractCallback Optional callback to load contract schema for proxies (reserved for future use)
 * @returns The result of the view function call
 */
export async function queryEvmViewFunction(
  contractAddress: string,
  functionId: string,
  networkConfig: TypedEvmNetworkConfig,
  params: unknown[] = [],
  contractSchema?: ContractSchema,
  _walletImplementation?: WagmiWalletImplementation,
  _loadContractCallback?: (address: string) => Promise<ContractSchema>
): Promise<unknown> {
  if (!contractSchema) {
    throw new Error('Contract schema is required for view function query');
  }

  // Resolve RPC URL from network config (supports user overrides)
  const rpcUrl = resolveRpcUrl(networkConfig);
  if (!rpcUrl) {
    throw new Error(
      `No RPC URL available for network ${networkConfig.name}. Configure an RPC endpoint.`
    );
  }

  logger.debug('adapter-query', `Using RPC URL for query: ${rpcUrl}`);

  // Call core function with resolved RPC URL
  return coreQueryEvmViewFunction(
    contractAddress,
    functionId,
    params,
    contractSchema,
    rpcUrl,
    networkConfig
  );
}
