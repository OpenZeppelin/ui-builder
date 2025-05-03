import { isAddress } from 'viem';

import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

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
 * Loads contract schema by detecting if the source is an address (fetch from Etherscan)
 * or a JSON string (parse directly).
 *
 * This is the primary function exported for use by the EvmAdapter.
 */
export async function loadEvmContract(source: string): Promise<ContractSchema> {
  if (isAddress(source)) {
    console.info(`Detected address: ${source}. Attempting Etherscan ABI fetch...`);
    return loadAbiFromEtherscan(source);
  } else {
    console.info('Input is not an address. Attempting to parse as JSON ABI...');
    return loadAbiFromJson(source);
  }
}
