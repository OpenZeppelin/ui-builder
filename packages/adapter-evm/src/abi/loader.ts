import { isAddress } from 'viem';

import type {
  ContractSchema,
  ContractSchemaMetadata,
  EvmNetworkConfig,
  FormValues,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import type { AbiItem, TypedEvmNetworkConfig } from '../types';

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
 * Enhanced result type for ABI loading with metadata
 */
export interface EvmContractLoadResult {
  schema: ContractSchema;
  source: 'fetched' | 'manual';
  metadata?: ContractSchemaMetadata;
}

/**
 * Loads contract schema from artifacts provided by the UI, prioritizing manual ABI input.
 * Returns enhanced result with schema source information.
 */
export async function loadEvmContract(
  artifacts: FormValues,
  networkConfig: EvmNetworkConfig
): Promise<EvmContractLoadResult> {
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
      return {
        schema: { ...schema, address: contractAddress },
        source: 'manual',
        metadata: {
          contractName: schema.name,
          fetchTimestamp: new Date(),
        },
      };
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
    const schema = await loadAbiFromEtherscan(
      contractAddress,
      networkConfig as TypedEvmNetworkConfig
    );
    logger.info(
      'loadEvmContract',
      `Successfully fetched ABI from Etherscan for ${contractAddress}.`
    );

    // Create metadata for fetched ABI
    const explorerBaseUrl = networkConfig.explorerUrl || 'unknown';
    const metadata: ContractSchemaMetadata = {
      fetchedFrom: `${explorerBaseUrl}/address/${contractAddress}`,
      contractName: schema.name,
      verificationStatus: 'verified', // Assume verified if we got ABI from explorer
      fetchTimestamp: new Date(),
    };

    return {
      schema,
      source: 'fetched',
      metadata,
    };
  } catch (error) {
    logger.warn('loadEvmContract', `Etherscan ABI fetch failed for ${contractAddress}:`, error);
    // 3. If both manual ABI is missing and Etherscan fails, re-throw the specific error.
    // This preserves important details like missing API keys or network issues.
    throw error;
  }
}
