import { isAddress } from 'viem';

import type {
  ContractSchema,
  EvmNetworkConfig,
  FormValues,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import type { AbiItem } from '../types';

import { loadAbiFromEtherscan } from './etherscan';
import { transformAbiToSchema } from './transformer';

/**
 * Loads and parses an ABI directly from a JSON string.
 */
async function loadAbiFromJson(abiJsonString: string): Promise<ContractSchema> {
  let abi: AbiItem[];
  try {
    abi = JSON.parse(abiJsonString);
    if (!Array.isArray(abi)) {
      throw new Error('Parsed JSON is not an array.');
    }
  } catch (error) {
    console.error('loadAbiFromJson', 'Failed to parse source string as JSON ABI:', error);
    throw new Error(`Invalid JSON ABI provided: ${(error as Error).message}`);
  }

  console.info(`Successfully parsed JSON ABI with ${abi.length} items.`);
  const contractName = 'ContractFromABI'; // Default name for direct ABI
  return transformAbiToSchema(abi, contractName, undefined);
}

/**
 * Loads contract schema from artifacts provided by the UI, prioritizing manual ABI input.
 */
export async function loadEvmContract(
  artifacts: FormValues,
  networkConfig: EvmNetworkConfig
): Promise<ContractSchema> {
  const { contractAddress, abiJson } = artifacts;

  if (!contractAddress || typeof contractAddress !== 'string' || !isAddress(contractAddress)) {
    throw new Error('A valid contract address is required.');
  }

  // 1. Prioritize manual ABI input if provided.
  if (abiJson && typeof abiJson === 'string' && abiJson.trim().startsWith('[')) {
    logger.info('loadEvmContract', 'Manual ABI provided. Attempting to parse...');
    try {
      const schema = await loadAbiFromJson(abiJson);
      // Attach the address to the schema from the separate address field.
      return { ...schema, address: contractAddress };
    } catch (error) {
      logger.error('loadEvmContract', 'Failed to parse manually provided ABI:', error);
      // If manual ABI is provided but invalid, it's a hard error.
      throw new Error(`The provided ABI JSON is invalid: ${(error as Error).message}`);
    }
  }

  // 2. If no manual ABI, fall back to fetching from Etherscan.
  logger.info(
    'loadEvmContract',
    `No manual ABI detected. Attempting Etherscan fetch for address: ${contractAddress}...`
  );
  try {
    const schema = await loadAbiFromEtherscan(contractAddress, networkConfig);
    logger.info(
      'loadEvmContract',
      `Successfully fetched ABI from Etherscan for ${contractAddress}.`
    );
    return schema;
  } catch (error) {
    logger.warn('loadEvmContract', `Etherscan ABI fetch failed for ${contractAddress}:`, error);
    // 3. If both manual ABI is missing and Etherscan fails, throw an error.
    throw new Error(
      'Could not fetch ABI from block explorer. Please verify the address or provide the contract ABI JSON manually.'
    );
  }
}
