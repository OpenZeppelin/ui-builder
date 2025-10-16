import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

import type {
  ContractSchema,
  MidnightNetworkConfig,
  NetworkConfig,
} from '@openzeppelin/ui-builder-types';
import { logger, userRpcConfigService } from '@openzeppelin/ui-builder-utils';

import { getWalletConfigIfAvailable } from '../configuration';
import {
  getNetworkId as getConfiguredNetworkId,
  getNumericNetworkId as getConfiguredNumericId,
} from '../utils';
import { validateContractAddress } from '../validation/address';
import { DEFAULT_QUERY_TIMEOUT, QueryExecutor } from './executor';
import { isMidnightViewFunction } from './view-checker';

/**
 * Queries a view function on a Midnight contract
 *
 * This is the main entry point for querying view functions in the Midnight adapter.
 * It creates providers, sets up a query executor, and returns the decoded result.
 *
 * @param contractAddress The contract address (68-char hex starting with 0200)
 * @param functionId The function identifier to query
 * @param networkConfig The network configuration
 * @param params Parameters for the query (if any)
 * @param contractSchema The contract schema (required for function lookup)
 * @param contractModule Optional compiled contract module code (for ledger() access)
 * @returns The query result (decoded JS values)
 * @throws {Error} if the query fails or times out
 */
export async function queryMidnightViewFunction(
  contractAddress: string,
  functionId: string,
  networkConfig: NetworkConfig,
  params: unknown[] = [],
  contractSchema?: ContractSchema,
  contractModule?: string
): Promise<unknown> {
  if (networkConfig.ecosystem !== 'midnight') {
    throw new Error('Invalid network configuration for Midnight query.');
  }

  if (!contractSchema) {
    throw new Error('Contract schema is required for Midnight queries');
  }

  // Early validation to align with EVM/Stellar patterns (defense-in-depth with executor)
  const addressValidation = validateContractAddress(contractAddress);
  if (!addressValidation.isValid) {
    throw new Error(`Invalid contract address provided: ${addressValidation.error}`);
  }

  // Confirm the function exists and is view-only
  const targetFunction = contractSchema.functions.find((fn) => fn.id === functionId);
  if (!targetFunction) {
    throw new Error(`Function with ID ${functionId} not found in contract schema.`);
  }
  if (!isMidnightViewFunction(targetFunction)) {
    throw new Error(`Function ${targetFunction.name} is not a view function.`);
  }

  const midnightConfig = networkConfig as MidnightNetworkConfig;

  logger.info(
    'queryMidnightViewFunction',
    `Querying function '${functionId}' on contract ${contractAddress}`
  );

  try {
    // Get wallet configuration if available (respects user privacy preferences)
    const walletConfig = await getWalletConfigIfAvailable();

    // Create Midnight providers for reading contract state
    // Priority: user RPC override > wallet config > network config (defaults)
    const { providers, numericNetworkId } = await getProvidersForQuery(
      midnightConfig,
      walletConfig
    );

    // Create a query executor
    const executor = new QueryExecutor(
      contractAddress,
      contractSchema,
      providers,
      DEFAULT_QUERY_TIMEOUT,
      contractModule, // Pass contract module for ledger() access
      numericNetworkId
    );

    // Execute the query
    const result = await executor.call(functionId, params);

    logger.info(
      'queryMidnightViewFunction',
      `Query completed successfully for function '${functionId}'`
    );

    return result;
  } catch (error) {
    logger.error('queryMidnightViewFunction', `Query failed for function '${functionId}'`, error);
    throw error;
  }
}

/**
 * Private helper to build Midnight providers with precedence:
 * user RPC override > wallet config > network config
 */
async function getProvidersForQuery(
  networkConfig: MidnightNetworkConfig,
  walletConfig?: {
    indexerUri?: string;
    indexerWsUri?: string;
    substrateNodeUri?: string;
    proverServerUri?: string;
    networkId?: string;
  }
): Promise<{ providers: MidnightProviders; numericNetworkId?: number }> {
  // Resolve indexer endpoints with precedence
  const customRpcConfig = userRpcConfigService.getUserRpcConfig(networkConfig.id);

  let indexerUri: string;
  let indexerWsUri: string;

  if (customRpcConfig?.url) {
    // Derive indexer endpoints from user RPC override
    const derivedHttp = deriveIndexerUri(customRpcConfig.url);
    const derivedWs = deriveIndexerWsUri(customRpcConfig.url);
    indexerUri = derivedHttp;
    indexerWsUri = derivedWs;
    logger.info('getProvidersForQuery', 'Using user RPC override to derive indexer URIs', {
      rpcUrl: customRpcConfig.url,
      indexerUri,
    });
  } else if (walletConfig?.indexerUri && walletConfig?.indexerWsUri) {
    // Respect user privacy preferences from wallet
    indexerUri = walletConfig.indexerUri;
    indexerWsUri = walletConfig.indexerWsUri;
    logger.info('getProvidersForQuery', 'Using wallet-provided indexer URIs');
  } else if (networkConfig.indexerUri && networkConfig.indexerWsUri) {
    // Explicit network configuration
    indexerUri = networkConfig.indexerUri;
    indexerWsUri = networkConfig.indexerWsUri;
    logger.info('getProvidersForQuery', 'Using explicit network-configured indexer URIs');
  } else {
    // Derive from default RPC endpoint as a fallback
    const rpcUrl = getDefaultRpcUrl(networkConfig);
    indexerUri = deriveIndexerUri(rpcUrl);
    indexerWsUri = deriveIndexerWsUri(rpcUrl);
    logger.info('getProvidersForQuery', 'Derived indexer URIs from network RPC endpoint', {
      rpcUrl,
      indexerUri,
    });
  }

  // Set network ID in Midnight SDK and global override (workaround for provider patches)
  const { NetworkId, setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
  // Read mapping: expect a single entry, take [numeric, name]
  let numericNetworkId: number | undefined = getConfiguredNumericId(networkConfig);
  let networkName: string = getConfiguredNetworkId(networkConfig) || 'TestNet';
  const resolvedEnum = (NetworkId as Record<string, unknown>)[networkName];
  if (!resolvedEnum) {
    throw new Error(
      `Invalid networkIdMapping value '${networkName}' for network ${networkConfig.id}`
    );
  }
  setNetworkId(resolvedEnum as never);
  // @ts-expect-error: global workaround for patched providers
  if (!globalThis.__OPENZEPPELIN_MIDNIGHT__) {
    globalThis.__OPENZEPPELIN_MIDNIGHT__ = {};
  }
  globalThis.__OPENZEPPELIN_MIDNIGHT__.networkId = resolvedEnum;
  logger.debug('getProvidersForQuery', `Set network ID to: ${networkName} (${numericNetworkId})`);

  // Create public data provider
  const publicDataProvider = indexerPublicDataProvider(indexerUri, indexerWsUri);

  return { providers: { publicDataProvider } as MidnightProviders, numericNetworkId };
}

function getDefaultRpcUrl(networkConfig: MidnightNetworkConfig): string {
  const rpcUrl = networkConfig.rpcEndpoints?.default;
  if (!rpcUrl) {
    throw new Error(`No RPC endpoint configured for network: ${networkConfig.name}`);
  }
  return rpcUrl;
}

function deriveIndexerUri(rpcUrl: string): string {
  const url = new URL(rpcUrl);
  url.protocol = url.protocol.replace('ws', 'http');
  return `${url.origin}/indexer`;
}

function deriveIndexerWsUri(rpcUrl: string): string {
  const url = new URL(rpcUrl);
  url.protocol = url.protocol.replace('http', 'ws');
  return `${url.origin}/indexer`;
}
