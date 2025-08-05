import { isAddress } from 'viem';

import type {
  ContractDefinitionMetadata,
  ContractSchema,
  EvmNetworkConfig,
  FormValues,
  ProxyInfo,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger, simpleHash } from '@openzeppelin/contracts-ui-builder-utils';

import { detectProxyFromAbi, getImplementationAddress } from '../proxy/detection';
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
 * Enhanced result type for ABI loading with metadata and proxy information
 */
export interface EvmContractLoadResult {
  schema: ContractSchema;
  source: 'fetched' | 'manual';
  contractDefinitionOriginal?: string;
  metadata?: ContractDefinitionMetadata;
  proxyInfo?: ProxyInfo;
}

/**
 * Options for contract loading behavior
 */
export interface ContractLoadOptions {
  /** Skip proxy detection and load the contract ABI as-is */
  skipProxyDetection?: boolean;
  /** Force treating the address as an implementation contract */
  treatAsImplementation?: boolean;
}

/**
 * Loads contract schema from artifacts provided by the UI, prioritizing manual ABI input.
 * Returns enhanced result with schema source information and automatic proxy detection.
 */
export async function loadEvmContract(
  artifacts: FormValues,
  networkConfig: EvmNetworkConfig,
  options: ContractLoadOptions = {}
): Promise<EvmContractLoadResult> {
  const { contractAddress, contractDefinition, __proxyDetectionOptions } = artifacts;

  // Extract proxy detection options from form data if present
  const proxyOptions = __proxyDetectionOptions as { skipProxyDetection?: boolean } | undefined;
  if (proxyOptions?.skipProxyDetection) {
    options.skipProxyDetection = true;
  }

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
          // Note: No proxy detection for manual ABIs - user provides what they want
        };
      } catch (error) {
        logger.error('loadEvmContract', 'Failed to parse manually provided ABI:', error);
        // If manual ABI is provided but invalid, it's a hard error.
        throw new Error(`The provided ABI JSON is invalid: ${(error as Error).message}`);
      }
    }
  }

  // 2. If no manual ABI, fall back to fetching from Etherscan with proxy detection.
  logger.info(
    'loadEvmContract',
    `No manual ABI detected. Attempting Etherscan fetch for address: ${contractAddress}...`
  );

  return await loadContractWithProxyDetection(
    contractAddress,
    networkConfig as TypedEvmNetworkConfig,
    options
  );
}

/**
 * Builds a standard contract result with metadata
 */
function buildContractResult(
  contractAddress: string,
  abiResult: { schema: ContractSchema; originalAbi: string },
  networkConfig: TypedEvmNetworkConfig,
  proxyInfo?: ProxyInfo
): EvmContractLoadResult {
  const explorerBaseUrl = networkConfig.explorerUrl || 'unknown';

  return {
    schema: { ...abiResult.schema, address: contractAddress },
    source: 'fetched',
    contractDefinitionOriginal: abiResult.originalAbi,
    metadata: {
      fetchedFrom: `${explorerBaseUrl}/address/${contractAddress}`,
      contractName: abiResult.schema.name,
      verificationStatus: 'verified',
      fetchTimestamp: new Date(),
      definitionHash: simpleHash(abiResult.originalAbi),
    },
    proxyInfo,
  };
}

/**
 * Attempts to load implementation ABI for a detected proxy
 */
async function loadImplementationAbi(
  _contractAddress: string,
  implementationAddress: string,
  networkConfig: TypedEvmNetworkConfig,
  _proxyType: string
): Promise<{ schema: ContractSchema; originalAbi: string } | null> {
  try {
    const implementationResult = await loadAbiFromEtherscan(implementationAddress, networkConfig);

    logger.info(
      'loadImplementationAbi',
      `Successfully fetched implementation ABI with ${implementationResult.schema.functions.length} functions`
    );

    return implementationResult;
  } catch (implementationError) {
    logger.warn(
      'loadImplementationAbi',
      `Failed to load implementation ABI: ${implementationError}`
    );
    return null;
  }
}

/**
 * Handles the proxy detection flow and returns appropriate result
 */
async function handleProxyDetection(
  contractAddress: string,
  initialResult: { schema: ContractSchema; originalAbi: string },
  networkConfig: TypedEvmNetworkConfig
): Promise<EvmContractLoadResult | null> {
  // Parse the ABI to check for proxy patterns
  const abi: AbiItem[] = JSON.parse(initialResult.originalAbi);
  const proxyDetection = detectProxyFromAbi(abi);

  if (!proxyDetection.isProxy) {
    return null; // Not a proxy, let caller handle normal flow
  }

  logger.info(
    'handleProxyDetection',
    `Proxy detected: ${proxyDetection.proxyType} (confidence: ${proxyDetection.confidence})`
  );

  const proxyType = proxyDetection.proxyType || 'unknown';
  const implementationAddress = await getImplementationAddress(
    contractAddress,
    networkConfig,
    proxyType
  );

  if (!implementationAddress) {
    logger.info('handleProxyDetection', 'Proxy detected but implementation address not found');

    // Return proxy ABI with proxy info indicating detection failure
    return buildContractResult(contractAddress, initialResult, networkConfig, {
      isProxy: true,
      proxyType,
      proxyAddress: contractAddress,
      detectionMethod: 'automatic',
    });
  }

  logger.info('handleProxyDetection', `Found implementation at: ${implementationAddress}`);

  // Try to load implementation ABI
  const implementationResult = await loadImplementationAbi(
    contractAddress,
    implementationAddress,
    networkConfig,
    proxyType
  );

  const baseProxyInfo: ProxyInfo = {
    isProxy: true,
    proxyType,
    implementationAddress,
    proxyAddress: contractAddress,
    detectionMethod: 'automatic',
  };

  if (implementationResult) {
    // Use implementation ABI with proxy metadata
    return buildContractResult(contractAddress, implementationResult, networkConfig, baseProxyInfo);
  } else {
    // Fall back to proxy ABI with proxy info
    return buildContractResult(contractAddress, initialResult, networkConfig, baseProxyInfo);
  }
}

/**
 * Loads contract with automatic proxy detection and implementation resolution
 */
async function loadContractWithProxyDetection(
  contractAddress: string,
  networkConfig: TypedEvmNetworkConfig,
  options: ContractLoadOptions = {}
): Promise<EvmContractLoadResult> {
  try {
    // Step 1: Get the initial ABI from the provided address
    const initialResult = await loadAbiFromEtherscan(contractAddress, networkConfig);

    logger.info(
      'loadContractWithProxyDetection',
      `Successfully fetched initial ABI for ${contractAddress} with ${initialResult.schema.functions.length} functions`
    );

    // Step 2: Handle proxy detection if enabled
    if (!options.skipProxyDetection && !options.treatAsImplementation) {
      const proxyResult = await handleProxyDetection(contractAddress, initialResult, networkConfig);
      if (proxyResult) {
        return proxyResult;
      }
    }

    // Step 3: Not a proxy or proxy detection skipped - return original ABI
    return buildContractResult(contractAddress, initialResult, networkConfig);
  } catch (error) {
    logger.warn('loadContractWithProxyDetection', `Contract loading failed: ${error}`);

    // Check if this is a "contract not verified" error
    const errorMessage = (error as Error).message || '';
    if (errorMessage.includes('Contract not verified')) {
      throw new Error(
        `Contract at ${contractAddress} is not verified on the block explorer. ` +
          `Verification status: unverified. Please provide the contract ABI manually.`
      );
    }

    // For other errors (API issues, network problems), re-throw the original error
    throw error;
  }
}
