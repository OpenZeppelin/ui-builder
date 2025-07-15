import type { ContractSchema, EvmNetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { resolveExplorerConfig } from '../configuration/explorer';
import type { AbiItem } from '../types';

import { transformAbiToSchema } from './transformer';

/**
 * Fetches and parses an ABI from Etherscan-compatible explorers using a contract address and network config.
 */
export async function loadAbiFromEtherscan(
  address: string,
  networkConfig: EvmNetworkConfig
): Promise<ContractSchema> {
  const explorerConfig = resolveExplorerConfig(networkConfig);

  if (!explorerConfig.apiUrl) {
    logger.error(
      'loadAbiFromEtherscan',
      `API URL is missing for ${networkConfig.name} (ID: ${networkConfig.id}).`
    );
    throw new Error(`Explorer API URL is not configured for network: ${networkConfig.name}`);
  }

  if (!explorerConfig.apiKey) {
    logger.error('loadAbiFromEtherscan', `API key is missing for ${networkConfig.name} explorer.`);
    throw new Error(
      `API key for ${networkConfig.name} explorer is not configured. Please configure your explorer API key.`
    );
  }

  const url = `${explorerConfig.apiUrl}?module=contract&action=getabi&address=${address}&apikey=${explorerConfig.apiKey}`;

  let response: Response;
  try {
    logger.info(
      'loadAbiFromEtherscan',
      `Fetching ABI from ${explorerConfig.apiUrl} for address: ${address}`
    );
    response = await fetch(url);
  } catch (networkError) {
    logger.error(
      'loadAbiFromEtherscan',
      `Network error fetching ABI from Explorer API: ${networkError}`
    );
    throw new Error(`Network error fetching ABI: ${(networkError as Error).message}`);
  }

  if (!response.ok) {
    logger.error(
      'loadAbiFromEtherscan',
      `Explorer API request failed with status: ${response.status}`
    );
    throw new Error(`Explorer API request failed: ${response.status} ${response.statusText}`);
  }

  let apiResult: { status: string; message: string; result: string };
  try {
    apiResult = await response.json();
  } catch (jsonError) {
    logger.error(
      'loadAbiFromEtherscan',
      `Failed to parse Explorer API response as JSON: ${jsonError}`
    );
    throw new Error('Invalid JSON response received from Explorer API.');
  }

  if (apiResult.status !== '1') {
    logger.warn(
      'loadAbiFromEtherscan',
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
      'loadAbiFromEtherscan',
      `Failed to parse ABI JSON string from Explorer API result: ${error}`
    );
    throw new Error(`Invalid ABI JSON received from Explorer API: ${(error as Error).message}`);
  }

  logger.info(
    'loadAbiFromEtherscan',
    `Successfully parsed ABI for ${networkConfig.name} with ${abi.length} items.`
  );
  // TODO: Fetch contract name?
  const contractName = `Contract_${address.substring(0, 6)}`;
  return transformAbiToSchema(abi, contractName, address);
}
