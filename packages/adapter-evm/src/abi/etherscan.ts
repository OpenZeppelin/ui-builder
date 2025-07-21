import type { ContractSchema } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { resolveExplorerConfig } from '../configuration/explorer';
import type { AbiItem, TypedEvmNetworkConfig } from '../types';

import { loadAbiFromEtherscanV2, shouldUseV2Api } from './etherscan-v2';
import { transformAbiToSchema } from './transformer';

/**
 * IMPORTANT: Etherscan V1 API Deprecation Notice
 *
 * Etherscan has announced the deprecation of their V1 API endpoints in favor of the new V2 unified API.
 * The V2 API provides a single endpoint that works across all EVM chains, making it more scalable and
 * easier to maintain.
 *
 * Key differences:
 * - V1: Each chain has its own API endpoint (e.g., api.etherscan.io, api.bscscan.com, etc.)
 * - V2: Single unified endpoint (api.etherscan.io/v2/api) with chainId parameter
 *
 * Migration strategy:
 * - Networks with `supportsEtherscanV2: true` will automatically use V2 API
 * - Legacy networks without V2 support will continue using V1 until they're updated
 * - New networks should always be configured with V2 support
 *
 * The V1 API functions are maintained for backward compatibility but should be considered
 * deprecated and will be removed in a future release.
 */

/**
 * Fetches and parses an ABI from Etherscan-compatible explorers using a contract address and network config.
 * Automatically selects V1 or V2 API based on network support and user configuration.
 */
export async function loadAbiFromEtherscan(
  address: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<ContractSchema> {
  if (shouldUseV2Api(networkConfig)) {
    logger.info('loadAbiFromEtherscan', 'Using V2 API for fetching ABI');
    return loadAbiFromEtherscanV2(address, networkConfig);
  }

  // Use V1 API (legacy)
  logger.info('loadAbiFromEtherscan', 'Using V1 API for fetching ABI');
  return loadAbiFromEtherscanV1(address, networkConfig);
}

/**
 * Fetches and parses an ABI from Etherscan V1 API using a contract address and network config.
 */
export async function loadAbiFromEtherscanV1(
  address: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<ContractSchema> {
  const explorerConfig = resolveExplorerConfig(networkConfig);

  // Check if API key is required for this network (default to true if not specified)
  const requiresApiKey = networkConfig.requiresExplorerApiKey ?? true;

  if (requiresApiKey && !explorerConfig.apiKey) {
    logger.error(
      'loadAbiFromEtherscanV1',
      `API key is missing for ${networkConfig.name} explorer.`
    );
    throw new Error(
      `API key for ${networkConfig.name} explorer is not configured. Please configure your explorer API key.`
    );
  }

  if (!explorerConfig.apiUrl) {
    logger.error(
      'loadAbiFromEtherscanV1',
      `API URL is missing for ${networkConfig.name} explorer.`
    );
    throw new Error(`Explorer API URL for ${networkConfig.name} is not configured.`);
  }

  const url = new URL(explorerConfig.apiUrl);
  url.searchParams.append('module', 'contract');
  url.searchParams.append('action', 'getabi');
  url.searchParams.append('address', address);

  // Only append API key if provided
  if (explorerConfig.apiKey) {
    url.searchParams.append('apikey', explorerConfig.apiKey);
  }

  let response: Response;
  try {
    logger.info(
      'loadAbiFromEtherscanV1',
      `Fetching ABI from ${explorerConfig.apiUrl} for address: ${address}`
    );
    response = await fetch(url);
  } catch (networkError) {
    logger.error(
      'loadAbiFromEtherscanV1',
      `Network error fetching ABI from Explorer API: ${networkError}`
    );
    throw new Error(`Network error fetching ABI: ${(networkError as Error).message}`);
  }

  if (!response.ok) {
    logger.error(
      'loadAbiFromEtherscanV1',
      `Explorer API request failed with status: ${response.status}`
    );
    throw new Error(`Explorer API request failed: ${response.status} ${response.statusText}`);
  }

  let apiResult: { status: string; message: string; result: string };
  try {
    apiResult = await response.json();
  } catch (jsonError) {
    logger.error(
      'loadAbiFromEtherscanV1',
      `Failed to parse Explorer API response as JSON: ${jsonError}`
    );
    throw new Error('Invalid JSON response received from Explorer API.');
  }

  if (apiResult.status !== '1') {
    logger.warn(
      'loadAbiFromEtherscanV1',
      `Explorer API error: Status ${apiResult.status}, Message: ${apiResult.message}, Result: ${apiResult.result}`
    );
    if (apiResult.result?.includes('Contract source code not verified')) {
      throw new Error(
        `Contract not verified on ${networkConfig.name} explorer (address: ${address}). ABI not available.`
      );
    }
    throw new Error(`Explorer API Error: ${apiResult.result || apiResult.message}`);
  }

  let abi: AbiItem[];
  try {
    abi = JSON.parse(apiResult.result);
    if (!Array.isArray(abi)) {
      throw new Error('Parsed ABI from Explorer API is not an array.');
    }
  } catch (error) {
    logger.error(
      'loadAbiFromEtherscanV1',
      `Failed to parse ABI JSON string from Explorer API result: ${error}`
    );
    throw new Error(`Invalid ABI JSON received from Explorer API: ${(error as Error).message}`);
  }

  logger.info(
    'loadAbiFromEtherscanV1',
    `Successfully parsed ABI for ${networkConfig.name} with ${abi.length} items.`
  );
  // TODO: Fetch contract name?
  const contractName = `Contract_${address.substring(0, 6)}`;
  return transformAbiToSchema(abi, contractName, address);
}
