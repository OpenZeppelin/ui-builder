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
  // Try to get the API key from environment variables
  const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
  if (!apiKey) {
    console.error('loadAbiFromEtherscan', 'Etherscan API Key (VITE_ETHERSCAN_API_KEY) is missing.');
    throw new Error('Etherscan API Key is not configured.');
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
    console.info(`Fetching ABI from ${apiBaseUrl} for address: ${address}`);
    response = await fetch(url);
  } catch (networkError) {
    console.error('Network error fetching ABI from Etherscan:', networkError);
    throw new Error(`Network error fetching ABI: ${(networkError as Error).message}`);
  }

  if (!response.ok) {
    console.error(`Etherscan API request failed with status: ${response.status}`);
    throw new Error(`Etherscan API request failed: ${response.status} ${response.statusText}`);
  }

  let etherscanResult: { status: string; message: string; result: string };
  try {
    etherscanResult = await response.json();
  } catch (jsonError) {
    console.error('Failed to parse Etherscan API response as JSON:', jsonError);
    throw new Error('Invalid JSON response received from Etherscan API.');
  }

  if (etherscanResult.status !== '1') {
    console.warn(
      'Etherscan API error:',
      `Status ${etherscanResult.status}, Result: ${etherscanResult.result}`
    );
    if (etherscanResult.result?.includes('Contract source code not verified')) {
      throw new Error(
        `Contract not verified on ${networkConfig.name} explorer (address: ${address}). ABI not available.`
      );
    }
    throw new Error(`Etherscan API Error: ${etherscanResult.result || etherscanResult.message}`);
  }

  let abi: AbiItem[];
  try {
    abi = JSON.parse(etherscanResult.result);
    if (!Array.isArray(abi)) {
      throw new Error('Parsed ABI from Etherscan is not an array.');
    }
  } catch (error) {
    console.error('Failed to parse ABI JSON string from Etherscan result:', error);
    throw new Error(`Invalid ABI JSON received from Etherscan: ${(error as Error).message}`);
  }

  console.info(
    `Successfully parsed Etherscan ABI for ${networkConfig.name} with ${abi.length} items.`
  );
  // TODO: Fetch contract name?
  const contractName = `Contract_${address.substring(0, 6)}`;
  return transformAbiToSchema(abi, contractName, address);
}
