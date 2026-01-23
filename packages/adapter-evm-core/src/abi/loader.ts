import { isAddress } from 'viem';

import type {
  ContractDefinitionMetadata,
  ContractSchema,
  EvmNetworkConfig,
  ProxyInfo,
} from '@openzeppelin/ui-types';
import {
  appConfigService,
  logger,
  simpleHash,
  userNetworkServiceConfigService,
  withTimeout,
} from '@openzeppelin/ui-utils';

import { getEvmExplorerAddressUrl } from '../configuration/explorer';
import { detectProxyFromAbi, getAdminAddress, getImplementationAddress } from '../proxy/detection';
import type { AbiItem, TypedEvmNetworkConfig } from '../types/abi';
import type { EvmContractArtifacts } from '../types/artifacts';
import {
  EvmProviderKeys,
  isEvmProviderKey,
  type EvmContractDefinitionProviderKey,
} from '../types/providers';
import { loadAbiFromEtherscan } from './etherscan';
import { getSourcifyContractAppUrl, loadAbiFromSourcify } from './sourcify';
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
    logger.error('loadAbiFromJson', 'Failed to parse source string as JSON ABI:', error);
    throw new Error(`Invalid JSON ABI provided: ${(error as Error).message}`);
  }

  logger.info('loadAbiFromJson', `Successfully parsed JSON ABI with ${abi.length} items.`);
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

const PER_PROVIDER_TIMEOUT_MS = 4000;
const OVERALL_BUDGET_MS = 10000;

/**
 * Loads contract schema from artifacts provided by the UI, prioritizing manual ABI input.
 * Returns enhanced result with schema source information and automatic proxy detection.
 */
export async function loadEvmContract(
  artifacts: EvmContractArtifacts,
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

  // Extract optional forced provider (from adapter-specific field or generic 'service')
  const forcedRaw =
    (artifacts as unknown as { __forcedProvider?: string }).__forcedProvider ||
    (artifacts as unknown as { service?: string }).service;
  const forcedProvider: EvmContractDefinitionProviderKey | null = isEvmProviderKey(forcedRaw)
    ? (forcedRaw as EvmContractDefinitionProviderKey)
    : null;

  // 2. If no manual ABI, fall back to fetching from provider(s) with proxy detection.
  logger.info(
    'loadEvmContract',
    `No manual ABI detected. Attempting Etherscan fetch for address: ${contractAddress}...`
  );

  return await loadContractWithProxyDetection(
    contractAddress,
    networkConfig as TypedEvmNetworkConfig,
    options,
    forcedProvider
  );
}

/**
 * Builds a standard contract result with metadata
 */
function buildContractResult(
  contractAddress: string,
  abiResult: { schema: ContractSchema; originalAbi: string },
  networkConfig: TypedEvmNetworkConfig,
  sourceProvider: EvmContractDefinitionProviderKey | null,
  proxyInfo?: ProxyInfo
): EvmContractLoadResult {
  // Determine provenance URL based on the provider that supplied the ABI
  let fetchedFrom: string | undefined = undefined;
  if (sourceProvider === EvmProviderKeys.Etherscan) {
    fetchedFrom = getEvmExplorerAddressUrl(contractAddress, networkConfig) || undefined;
  } else if (sourceProvider === EvmProviderKeys.Sourcify) {
    fetchedFrom = getSourcifyContractAppUrl(networkConfig.chainId, contractAddress);
  } else {
    // Fallback to resolved explorer URL when provider is unknown
    fetchedFrom = getEvmExplorerAddressUrl(contractAddress, networkConfig) || undefined;
  }

  return {
    schema: { ...abiResult.schema, address: contractAddress },
    source: 'fetched',
    contractDefinitionOriginal: abiResult.originalAbi,
    metadata: {
      fetchedFrom,
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
  networkConfig: TypedEvmNetworkConfig,
  initialProvider: EvmContractDefinitionProviderKey | null
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

  // Attempt to resolve admin address as well for display purposes
  const adminAddress = await getAdminAddress(contractAddress, networkConfig);

  if (!implementationAddress) {
    logger.info('handleProxyDetection', 'Proxy detected but implementation address not found');

    // Return proxy ABI with proxy info indicating detection failure
    return buildContractResult(contractAddress, initialResult, networkConfig, initialProvider, {
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

  const baseProxyInfo = {
    isProxy: true,
    proxyType,
    implementationAddress,
    proxyAddress: contractAddress,
    detectionMethod: 'automatic',
    ...(adminAddress ? { adminAddress } : {}),
  };

  if (implementationResult) {
    // Use implementation ABI with proxy metadata
    // Implementation ABI was fetched from Etherscan
    return buildContractResult(
      contractAddress,
      implementationResult,
      networkConfig,
      EvmProviderKeys.Etherscan,
      baseProxyInfo
    );
  } else {
    // Fall back to proxy ABI with proxy info (provenance from initial provider)
    return buildContractResult(
      contractAddress,
      initialResult,
      networkConfig,
      initialProvider,
      baseProxyInfo
    );
  }
}

/**
 * Loads contract with automatic proxy detection and implementation resolution
 */
async function loadContractWithProxyDetection(
  contractAddress: string,
  networkConfig: TypedEvmNetworkConfig,
  options: ContractLoadOptions = {},
  forcedProvider: EvmContractDefinitionProviderKey | null = null
): Promise<EvmContractLoadResult> {
  try {
    // Determine provider precedence based on forced provider and user config
    let uiDefault: EvmContractDefinitionProviderKey | null = null;
    // 1) New generic per-service config
    const svcCfg = userNetworkServiceConfigService.get(networkConfig.id, 'contract-definitions');
    if (svcCfg && typeof svcCfg === 'object' && 'defaultProvider' in svcCfg) {
      const raw = (svcCfg as Record<string, unknown>).defaultProvider;
      if (isEvmProviderKey(raw)) uiDefault = raw as EvmContractDefinitionProviderKey;
    }
    // App-config default provider (optional)
    const appDefaultRaw = appConfigService.getGlobalServiceParam(
      'contractdefinition',
      'defaultProvider'
    );
    const appDefault: EvmContractDefinitionProviderKey | null =
      typeof appDefaultRaw === 'string' && isEvmProviderKey(appDefaultRaw)
        ? (appDefaultRaw as EvmContractDefinitionProviderKey)
        : null;

    // Helper function to build provider array from primary provider
    const buildProviderArray = (
      primary: EvmContractDefinitionProviderKey
    ): Array<EvmContractDefinitionProviderKey> => [
      primary,
      primary === EvmProviderKeys.Etherscan ? EvmProviderKeys.Sourcify : EvmProviderKeys.Etherscan,
    ];

    const providers: Array<EvmContractDefinitionProviderKey> = forcedProvider
      ? [forcedProvider]
      : uiDefault
        ? buildProviderArray(uiDefault)
        : appDefault
          ? buildProviderArray(appDefault)
          : [EvmProviderKeys.Etherscan, EvmProviderKeys.Sourcify];

    const overallDeadline = Date.now() + OVERALL_BUDGET_MS;
    let initialResult: { schema: ContractSchema; originalAbi: string } | null = null;
    let lastError: unknown = null;
    let usedProvider: EvmContractDefinitionProviderKey | null = null;
    for (const provider of providers) {
      try {
        const remainingOverall = Math.max(100, overallDeadline - Date.now());
        const attemptTimeout = Math.min(PER_PROVIDER_TIMEOUT_MS, remainingOverall);

        if (provider === EvmProviderKeys.Etherscan) {
          initialResult = await withTimeout(
            loadAbiFromEtherscan(contractAddress, networkConfig),
            attemptTimeout,
            'etherscan'
          );
        } else if (provider === EvmProviderKeys.Sourcify) {
          initialResult = await withTimeout(
            loadAbiFromSourcify(contractAddress, networkConfig, attemptTimeout),
            attemptTimeout,
            'sourcify'
          );
        }
        if (initialResult) {
          usedProvider = provider;
          break;
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }
    if (!initialResult) throw lastError ?? new Error('No provider succeeded');

    logger.info(
      'loadContractWithProxyDetection',
      `Successfully fetched initial ABI for ${contractAddress} with ${initialResult.schema.functions.length} functions`
    );

    // Step 2: Handle proxy detection if enabled
    if (!options.skipProxyDetection && !options.treatAsImplementation) {
      const proxyResult = await handleProxyDetection(
        contractAddress,
        initialResult,
        networkConfig,
        usedProvider
      );
      if (proxyResult) {
        return proxyResult;
      }
    }

    // Step 3: Not a proxy or proxy detection skipped - return original ABI
    return buildContractResult(contractAddress, initialResult, networkConfig, usedProvider);
  } catch (error) {
    logger.warn('loadContractWithProxyDetection', `Contract loading failed: ${error}`);

    // If a forced provider was specified, honor it and do NOT fallback automatically
    if (forcedProvider) {
      throw error;
    }

    // Check if this is a "contract not verified" error
    const errorMessage = (error as Error).message || '';
    if (errorMessage.includes('Contract not verified')) {
      throw new Error(
        `Contract at ${contractAddress} is not verified on the block explorer. ` +
          `Verification status: unverified. Please provide the contract ABI manually.`
      );
    }
    // Otherwise, rethrow the last error from provider attempts
    throw error;
  }
}
