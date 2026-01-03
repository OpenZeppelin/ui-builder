import type { ContractSchema } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { resolveExplorerConfig } from '../configuration/explorer';
import type { AbiItem, TypedEvmNetworkConfig } from '../types';
import { transformAbiToSchema } from './transformer';

/**
 * Result type for Etherscan ABI loading that includes the original ABI string
 */
export interface EtherscanAbiResult {
  schema: ContractSchema;
  originalAbi: string;
}

// Etherscan V2 unified API base URL
const ETHERSCAN_V2_BASE_URL = 'https://api.etherscan.io/v2/api';

/**
 * Builds a V2 API URL for Etherscan-compatible explorers
 */
function buildV2ApiUrl(
  chainId: number,
  module: string,
  action: string,
  params: Record<string, string>,
  apiKey?: string // Some explorers don't require an API key (routescan.io)
): string {
  const url = new URL(ETHERSCAN_V2_BASE_URL);
  url.searchParams.append('chainid', chainId.toString());
  url.searchParams.append('module', module);
  url.searchParams.append('action', action);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  if (apiKey) {
    url.searchParams.append('apikey', apiKey);
  }

  return url.toString();
}

/**
 * Checks if the network supports V2 API
 */
export function shouldUseV2Api(networkConfig: TypedEvmNetworkConfig): boolean {
  if (!networkConfig.supportsEtherscanV2) {
    return false;
  }

  return true;
}

/**
 * Fetches and parses an ABI from Etherscan V2 API using a contract address and network config.
 */
export async function loadAbiFromEtherscanV2(
  address: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<EtherscanAbiResult> {
  const explorerConfig = resolveExplorerConfig(networkConfig);

  const url = buildV2ApiUrl(
    networkConfig.chainId,
    'contract',
    'getabi',
    { address },
    explorerConfig.apiKey
  );

  let response: Response;
  try {
    logger.info(
      'loadAbiFromEtherscanV2',
      `Fetching ABI from Etherscan V2 API for address: ${address} on chain ${networkConfig.chainId}`
    );
    response = await fetch(url);
  } catch (networkError) {
    logger.error(
      'loadAbiFromEtherscanV2',
      `Network error fetching ABI from Explorer V2 API: ${networkError}`
    );
    throw new Error(`Network error fetching ABI: ${(networkError as Error).message}`);
  }

  if (!response.ok) {
    logger.error(
      'loadAbiFromEtherscanV2',
      `Explorer V2 API request failed with status: ${response.status}`
    );
    throw new Error(`Explorer V2 API request failed: ${response.status} ${response.statusText}`);
  }

  let apiResult: { status: string; message: string; result: string };
  try {
    apiResult = await response.json();
  } catch (jsonError) {
    logger.error(
      'loadAbiFromEtherscanV2',
      `Failed to parse Explorer V2 API response as JSON: ${jsonError}`
    );
    throw new Error('Invalid JSON response received from Explorer V2 API.');
  }

  if (apiResult.status !== '1') {
    logger.warn(
      'loadAbiFromEtherscanV2',
      `Explorer V2 API error: Status ${apiResult.status}, Message: ${apiResult.message}, Result: ${apiResult.result}`
    );

    // Handle specific V2 API error messages
    if (apiResult.message?.includes('NOTOK')) {
      if (apiResult.result?.includes('Invalid API Key')) {
        throw new Error(
          `Invalid API key for Etherscan V2. Please check your API key configuration.`
        );
      }
      if (apiResult.result?.includes('Contract source code not verified')) {
        throw new Error(
          `Contract not verified on ${networkConfig.name} explorer (address: ${address}). ABI not available. You can provide the contract's ABI manually.`
        );
      }
      if (apiResult.result?.includes('Invalid chain')) {
        throw new Error(
          `Chain ID ${networkConfig.chainId} is not supported by Etherscan V2 API. Please check if this chain is available.`
        );
      }
    }

    throw new Error(`Explorer V2 API Error: ${apiResult.result || apiResult.message}`);
  }

  // Store the original raw ABI string before parsing
  const originalAbiString = apiResult.result;

  let abi: AbiItem[];
  try {
    abi = JSON.parse(originalAbiString);
    if (!Array.isArray(abi)) {
      throw new Error('Parsed ABI from Explorer V2 API is not an array.');
    }
  } catch (error) {
    logger.error(
      'loadAbiFromEtherscanV2',
      `Failed to parse ABI JSON string from Explorer V2 API result: ${error}`
    );
    throw new Error(`Invalid ABI JSON received from Explorer V2 API: ${(error as Error).message}`);
  }

  logger.info(
    'loadAbiFromEtherscanV2',
    `Successfully parsed ABI for ${networkConfig.name} with ${abi.length} items using V2 API.`
  );

  // TODO: Fetch contract name?
  const contractName = `Contract_${address.substring(0, 6)}`;
  const schema = transformAbiToSchema(abi, contractName, address);

  return {
    schema,
    originalAbi: originalAbiString,
  };
}

/**
 * Test connection to Etherscan V2 API
 */
export async function testEtherscanV2Connection(
  networkConfig: TypedEvmNetworkConfig,
  apiKey?: string
): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  const requiresApiKey = networkConfig.requiresExplorerApiKey ?? true;

  if (requiresApiKey && !apiKey) {
    return {
      success: false,
      error: 'API key is required for testing connection to this explorer',
    };
  }

  try {
    // Test with a simple API call - get the latest block number
    const url = buildV2ApiUrl(networkConfig.chainId, 'proxy', 'eth_blockNumber', {}, apiKey);

    const response = await fetch(url);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        latency,
      };
    }

    const data = await response.json();

    // Check for API errors in the response
    if (data.status === '0' && data.message) {
      // Handle specific V2 API error messages
      if (data.result?.includes('Invalid API Key')) {
        return {
          success: false,
          error: 'Invalid API key. Please check your Etherscan API key.',
          latency,
        };
      }
      if (data.result?.includes('Invalid chain')) {
        return {
          success: false,
          error: `Chain ID ${networkConfig.chainId} is not supported by Etherscan V2 API.`,
          latency,
        };
      }

      return {
        success: false,
        error: data.result || data.message,
        latency,
      };
    }

    // Success if we got a valid response
    return {
      success: true,
      latency,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      latency: Date.now() - startTime,
    };
  }
}
