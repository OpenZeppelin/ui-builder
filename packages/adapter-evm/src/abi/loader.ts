import { isAddress } from 'viem';

import type {
  ContractDefinitionMetadata,
  ContractSchema,
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
  contractDefinitionOriginal?: string;
  metadata?: ContractDefinitionMetadata;
}

/**
 * Loads contract schema from artifacts provided by the UI, prioritizing manual ABI input.
 * Returns enhanced result with schema source information.
 */
export async function loadEvmContract(
  artifacts: FormValues,
  networkConfig: EvmNetworkConfig
): Promise<EvmContractLoadResult> {
  const { contractAddress, contractDefinition } = artifacts;

  if (!contractAddress || typeof contractAddress !== 'string' || !isAddress(contractAddress)) {
    throw new Error('A valid contract address is required.');
  }

  // 1. Prioritize manual contract definition input if provided.
  if (
    contractDefinition &&
    typeof contractDefinition === 'string' &&
    contractDefinition.trim().length > 0
  ) {
    // Try to detect if this looks like JSON
    const trimmed = contractDefinition.trim();
    const hasJsonContent = trimmed.includes('[') && trimmed.includes(']') && trimmed.includes('{');

    if (hasJsonContent) {
      logger.info('loadEvmContract', 'Manual contract definition provided. Attempting to parse...');
      try {
        const schema = await loadAbiFromJson(contractDefinition);
        // Attach the address to the schema from the separate address field.
        return {
          schema: { ...schema, address: contractAddress },
          source: 'manual' as const,
          contractDefinitionOriginal: contractDefinition,
          metadata: {
            contractName: schema.name,
            fetchTimestamp: new Date(),
            verificationStatus: 'unknown', // Manual ABI - verification status unknown
          },
        };
      } catch (error) {
        logger.error('loadEvmContract', 'Failed to parse manually provided ABI:', error);
        // If manual ABI is provided but invalid, it's a hard error.
        throw new Error(`The provided ABI JSON is invalid: ${(error as Error).message}`);
      }
    }
  }

  // 2. If no manual ABI, fall back to fetching from Etherscan.
  logger.info(
    'loadEvmContract',
    `No manual ABI detected. Attempting Etherscan fetch for address: ${contractAddress}...`
  );
  try {
    const result = await loadAbiFromEtherscan(
      contractAddress,
      networkConfig as TypedEvmNetworkConfig
    );
    logger.info(
      'loadEvmContract',
      `Successfully fetched ABI from Etherscan for ${contractAddress}.`
    );

    // Create metadata for fetched ABI including the original ABI string
    const explorerBaseUrl = networkConfig.explorerUrl || 'unknown';

    const metadata: ContractDefinitionMetadata = {
      fetchedFrom: `${explorerBaseUrl}/address/${contractAddress}`,
      contractName: result.schema.name,
      verificationStatus: 'verified', // Assume verified if we got ABI from explorer
      fetchTimestamp: new Date(),
    };

    return {
      schema: result.schema,
      source: 'fetched',
      contractDefinitionOriginal: result.originalAbi,
      metadata,
    };
  } catch (error) {
    logger.warn('loadEvmContract', `Etherscan ABI fetch failed for ${contractAddress}:`, error);

    // Check if this is a "contract not verified" error
    const errorMessage = (error as Error).message || '';
    if (errorMessage.includes('Contract not verified')) {
      // For unverified contracts, we can't provide a schema but we should indicate the status
      throw new Error(
        `Contract at ${contractAddress} is not verified on the block explorer. ` +
          `Verification status: unverified. Please provide the contract ABI manually.`
      );
    }

    // 3. For other errors (API issues, network problems), re-throw the original error
    throw error;
  }
}
