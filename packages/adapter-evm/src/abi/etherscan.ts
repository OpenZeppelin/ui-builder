import { appConfigService } from '@openzeppelin/transaction-form-renderer';
import type { ContractSchema, EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

import type { AbiItem } from '../types';

import { transformAbiToSchema } from './transformer';

/**
 * Fetches and parses an ABI from Etherscan-compatible explorers using a contract address and network config.
 */
export async function loadAbiFromEtherscan(
  address: string,
  networkConfig: EvmNetworkConfig
): Promise<ContractSchema> {
  const serviceIdentifier = networkConfig.explorerApiIdentifier;

  if (!serviceIdentifier) {
    console.error(
      'loadAbiFromEtherscan',
      `explorerApiIdentifier is missing in the network configuration for ${networkConfig.name} (ID: ${networkConfig.id}).`
    );
    throw new Error(`Explorer API identifier not configured for network: ${networkConfig.name}`);
  }

  const apiKey = appConfigService.getExplorerApiKey(serviceIdentifier);

  if (!apiKey) {
    console.error(
      'loadAbiFromEtherscan',
      `API key for service '${serviceIdentifier}' is missing in AppConfigService.`
    );
    throw new Error(`API key for ${networkConfig.name} explorer is not configured.`);
  }

  const apiBaseUrl = networkConfig.apiUrl;

  if (!apiBaseUrl) {
    console.error(
      'loadAbiFromEtherscan',
      `API URL (apiUrl) is missing in the network configuration for ${networkConfig.name} (ID: ${networkConfig.id}).`
    );
    throw new Error(
      `Etherscan-compatible API URL is not configured for network: ${networkConfig.name}`
    );
  }

  const url = `${apiBaseUrl}?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;

  let response: Response;
  try {
    console.info(
      `Fetching ABI from ${apiBaseUrl} for address: ${address} using service ID: ${serviceIdentifier}`
    );
    response = await fetch(url);
  } catch (networkError) {
    console.error('Network error fetching ABI from Etherscan-compatible API:', networkError);
    throw new Error(`Network error fetching ABI: ${(networkError as Error).message}`);
  }

  if (!response.ok) {
    console.error(`Explorer API request failed with status: ${response.status} for URL: ${url}`);
    throw new Error(`Explorer API request failed: ${response.status} ${response.statusText}`);
  }

  let apiResult: { status: string; message: string; result: string };
  try {
    apiResult = await response.json();
  } catch (jsonError) {
    console.error('Failed to parse Explorer API response as JSON:', jsonError);
    throw new Error('Invalid JSON response received from Explorer API.');
  }

  if (apiResult.status !== '1') {
    console.warn(
      'Explorer API error:',
      `Status ${apiResult.status}, Message: ${apiResult.message}, Result: ${apiResult.result}`
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
    console.error('Failed to parse ABI JSON string from Explorer API result:', error);
    throw new Error(`Invalid ABI JSON received from Explorer API: ${(error as Error).message}`);
  }

  console.info(
    `Successfully parsed ABI for ${networkConfig.name} (service: ${serviceIdentifier}) with ${abi.length} items.`
  );
  // TODO: Fetch contract name?
  const contractName = `Contract_${address.substring(0, 6)}`;
  return transformAbiToSchema(abi, contractName, address);
}
