/**
 * Proxy Contract Detection Utilities
 *
 * Automatically detects proxy contracts and resolves implementation addresses
 * for UUPS, Transparent, Beacon, and other proxy patterns.
 */
import { createPublicClient, http, keccak256, parseAbi, toHex } from 'viem';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { resolveRpcUrl } from '../configuration';
import { AbiItem, TypedEvmNetworkConfig } from '../types';

export interface ProxyDetectionResult {
  isProxy: boolean;
  proxyType: 'uups' | 'transparent' | 'beacon' | 'diamond' | 'minimal' | 'unknown' | null;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
}

/**
 * Analyzes an ABI to determine if it belongs to a proxy contract
 */
export function detectProxyFromAbi(abi: AbiItem[]): ProxyDetectionResult {
  const functions = abi.filter((item) => item.type === 'function');
  const events = abi.filter((item) => item.type === 'event');
  const errors = abi.filter((item) => item.type === 'error');

  const indicators: string[] = [];
  let proxyType: ProxyDetectionResult['proxyType'] = null;
  let confidence: ProxyDetectionResult['confidence'] = 'low';

  // Check for UUPS proxy indicators
  const hasUpgradeEvent = events.some((e) => e.name === 'Upgraded');
  const hasImplementationFunction = functions.some((f) => f.name === 'implementation');
  const hasUUPSErrors = errors.some((e) => e.name?.includes('ERC1967'));
  const hasUpgradeToFunction = functions.some(
    (f) => f.name === 'upgradeToAndCall' || f.name === 'upgradeTo'
  );

  if (hasUpgradeEvent || hasUUPSErrors) {
    indicators.push('ERC1967 upgrade pattern detected');
    proxyType = 'uups';
    confidence = 'high';
  }

  if (hasImplementationFunction) {
    indicators.push('implementation() function found');
    if (proxyType === 'uups') {
      confidence = 'high';
    } else {
      proxyType = 'transparent';
      confidence = 'medium';
    }
  }

  if (hasUpgradeToFunction && proxyType === 'uups') {
    indicators.push('UUPS upgrade functions found');
    confidence = 'high';
  }

  // Check for Transparent proxy indicators
  const hasAdminFunction = functions.some((f) => f.name === 'admin');
  const hasProxyAdminErrors = errors.some((e) => e.name?.includes('ProxyDenied'));
  const hasChangeAdminFunction = functions.some((f) => f.name === 'changeAdmin');

  if (hasAdminFunction || hasProxyAdminErrors || hasChangeAdminFunction) {
    indicators.push('Transparent proxy admin pattern detected');
    if (proxyType === null) {
      proxyType = 'transparent';
      confidence = 'medium';
    }
  }

  // Check for Beacon proxy indicators
  const hasBeaconFunction = functions.some((f) => f.name === 'beacon');
  const hasBeaconUpgrade = events.some((e) => e.name === 'BeaconUpgraded');

  if (hasBeaconFunction || hasBeaconUpgrade) {
    indicators.push('Beacon proxy pattern detected');
    proxyType = 'beacon';
    confidence = 'high';
  }

  // Check for Diamond proxy indicators
  const hasDiamondCut = functions.some((f) => f.name === 'diamondCut');
  const hasFacets = functions.some((f) => f.name === 'facets');
  const hasFacetFunctionSelectors = functions.some((f) => f.name === 'facetFunctionSelectors');

  if (hasDiamondCut || (hasFacets && hasFacetFunctionSelectors)) {
    indicators.push('Diamond (EIP-2535) proxy pattern detected');
    proxyType = 'diamond';
    confidence = 'high';
  }

  // General proxy indicators
  const hasFallback = abi.some((item) => item.type === 'fallback');
  const hasProxyConstructor = abi.some(
    (item) =>
      item.type === 'constructor' &&
      item.inputs?.some(
        (input: AbiItem) =>
          input.name === 'implementation' || input.name === '_logic' || input.name === '_data'
      )
  );

  if (hasFallback) {
    indicators.push('Fallback function present');
  }

  if (hasProxyConstructor) {
    indicators.push('Proxy-style constructor detected');
  }

  // Minimal proxy (EIP-1167) detection
  const hasMinimalFunctions = functions.length <= 1; // Usually no functions except maybe implementation()
  const hasNoEvents = events.length === 0;

  if (hasMinimalFunctions && hasNoEvents && hasFallback && proxyType === null) {
    indicators.push('Minimal proxy pattern detected');
    proxyType = 'minimal';
    confidence = 'medium';
  }

  // Final proxy determination
  const isProxy =
    proxyType !== null ||
    (hasFallback && hasMinimalFunctions && (hasProxyConstructor || functions.length === 0));

  if (isProxy && proxyType === null) {
    proxyType = 'unknown';
    indicators.push('Generic proxy pattern detected');
    confidence = 'low';
  }

  return {
    isProxy,
    proxyType,
    confidence,
    indicators,
  };
}

/**
 * Attempts to resolve the implementation address for a proxy contract
 */
export async function getImplementationAddress(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig,
  proxyType: string
): Promise<string | null> {
  logger.info(
    'getImplementationAddress',
    `Resolving implementation for ${proxyType} proxy: ${proxyAddress}`
  );

  try {
    switch (proxyType) {
      case 'uups':
      case 'transparent': {
        // Try modern EIP-1967 slot first
        const eip1967Impl = await getEIP1967Implementation(proxyAddress, networkConfig);
        if (eip1967Impl) return eip1967Impl;

        // Fall back to legacy OZ Unstructured Storage slot used by older proxies
        const legacyImpl = await getLegacyOZImplementation(proxyAddress, networkConfig);
        if (legacyImpl) return legacyImpl;

        return null;
      }

      case 'beacon':
        return await getBeaconImplementation(proxyAddress, networkConfig);

      case 'diamond':
        // Diamond proxies don't have a single implementation
        // Would need to handle facets separately
        logger.info('getImplementationAddress', 'Diamond proxies not fully supported yet');
        return null;

      case 'minimal':
        return await getMinimalProxyImplementation(proxyAddress, networkConfig);

      default:
        // Try common methods for unknown proxy types
        return await tryCommonImplementationMethods(proxyAddress, networkConfig);
    }
  } catch (error) {
    logger.warn('getImplementationAddress', `Failed to resolve implementation: ${error}`);
    return null;
  }
}

/**
 * Attempts to resolve the admin address for a proxy contract
 * Tries EIP-1967 admin slot first, then legacy OZ slot
 */
export async function getAdminAddress(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    const eip1967Admin = await getEIP1967Admin(proxyAddress, networkConfig);
    if (eip1967Admin) return eip1967Admin;

    const legacyAdmin = await getLegacyOZAdmin(proxyAddress, networkConfig);
    if (legacyAdmin) return legacyAdmin;

    return null;
  } catch (error) {
    logger.warn('getAdminAddress', `Failed to resolve admin: ${error}`);
    return null;
  }
}

/**
 * Reads implementation address from EIP-1967 storage slot
 */
async function getEIP1967Implementation(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  // EIP-1967 implementation storage slot
  const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

  return await readStorageSlot(proxyAddress, implementationSlot, networkConfig);
}

/**
 * Reads admin address from EIP-1967 admin storage slot
 * Slot: bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
 */
async function getEIP1967Admin(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  const adminSlot = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
  return await readStorageSlot(proxyAddress, adminSlot, networkConfig);
}

/**
 * Reads admin address from legacy OpenZeppelin Unstructured Storage slot
 * Slot: keccak256("org.zeppelinos.proxy.admin")
 */
async function getLegacyOZAdmin(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    const slot = keccak256(toHex('org.zeppelinos.proxy.admin'));
    logger.info('getLegacyOZAdmin', `Trying legacy OZ admin slot: ${slot}`);
    return await readStorageSlot(proxyAddress, slot, networkConfig);
  } catch (error) {
    logger.warn('getLegacyOZAdmin', `Failed computing or reading legacy admin slot: ${error}`);
    return null;
  }
}

/**
 * Reads implementation address from legacy OpenZeppelin Unstructured Storage slot
 * Slot: keccak256("org.zeppelinos.proxy.implementation")
 */
async function getLegacyOZImplementation(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    // Compute slot deterministically at runtime to avoid hardcoding
    const slot = keccak256(toHex('org.zeppelinos.proxy.implementation'));
    logger.info('getLegacyOZImplementation', `Trying legacy OZ slot: ${slot}`);
    return await readStorageSlot(proxyAddress, slot, networkConfig);
  } catch (error) {
    logger.warn('getLegacyOZImplementation', `Failed computing or reading legacy slot: ${error}`);
    return null;
  }
}

/**
 * Resolves implementation through beacon proxy pattern
 */
async function getBeaconImplementation(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  // EIP-1967 beacon storage slot
  const beaconSlot = '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50';

  const beaconAddress = await readStorageSlot(proxyAddress, beaconSlot, networkConfig);
  if (!beaconAddress) {
    return null;
  }

  // Call implementation() on the beacon contract
  return await callContractFunction(beaconAddress, 'implementation()', [], networkConfig);
}

/**
 * Extracts implementation from minimal proxy bytecode
 */
async function getMinimalProxyImplementation(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    // Get the contract bytecode
    const bytecode = await getContractBytecode(proxyAddress, networkConfig);

    if (!bytecode || bytecode.length < 42) {
      return null;
    }

    // Minimal proxy (EIP-1167) has a specific bytecode pattern
    // 0x363d3d373d3d3d363d73{implementation}5af43d82803e903d91602b57fd5bf3
    if (
      bytecode.startsWith('0x363d3d373d3d3d363d73') &&
      bytecode.includes('5af43d82803e903d91602b57fd5bf3')
    ) {
      // Extract the 20-byte implementation address
      const implementationHex = bytecode.slice(22, 62); // Skip prefix, take 20 bytes (40 hex chars)
      return '0x' + implementationHex;
    }

    return null;
  } catch (error) {
    logger.warn('getMinimalProxyImplementation', `Error reading bytecode: ${error}`);
    return null;
  }
}

/**
 * Tries common proxy implementation methods
 */
async function tryCommonImplementationMethods(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  const commonMethods = [
    'implementation()',
    'getImplementation()',
    '_implementation()',
    'target()',
  ];

  for (const method of commonMethods) {
    try {
      const result = await callContractFunction(proxyAddress, method, [], networkConfig);
      if (result && result !== '0x0000000000000000000000000000000000000000') {
        logger.info(
          'tryCommonImplementationMethods',
          `Found implementation via ${method}: ${result}`
        );
        return result;
      }
    } catch {
      // Continue to next method
      continue;
    }
  }

  // Try EIP-1967 storage as last resort
  return await getEIP1967Implementation(proxyAddress, networkConfig);
}

/**
 * Creates a viem public client for the given network configuration
 */
function createViemClient(networkConfig: TypedEvmNetworkConfig) {
  // Honor user/app RPC overrides
  const rpcUrl = resolveRpcUrl(networkConfig);
  return createPublicClient({
    transport: http(rpcUrl),
  });
}

/**
 * Reads a storage slot from a contract using viem
 */
async function readStorageSlot(
  address: string,
  slot: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    const client = createViemClient(networkConfig);

    const storageValue = await client.getStorageAt({
      address: address as `0x${string}`,
      slot: slot as `0x${string}`,
    });

    // Convert from 32-byte storage format to 20-byte address
    if (
      storageValue &&
      storageValue !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
      logger.info('readStorageSlot', `Found non-zero value at slot ${slot}: ${storageValue}`);
      const implAddress = '0x' + storageValue.slice(-40); // Last 20 bytes
      return implAddress;
    }

    return null;
  } catch (error) {
    logger.warn('readStorageSlot', `Failed to read storage slot ${slot}: ${error}`);
    return null;
  }
}

/**
 * Calls a function on a contract using viem's readContract
 * Supports functions with parameters and proper return value decoding
 */
async function callContractFunction(
  address: string,
  signature: string,
  params: unknown[],
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    const client = createViemClient(networkConfig);

    // Parse the function signature to get proper ABI format
    const abi = parseAbi([signature]);
    const func = abi[0] as { name: string; type: 'function' };

    // Use viem's readContract for cleaner, more robust contract calls
    const result = await client.readContract({
      address: address as `0x${string}`,
      abi,
      functionName: func.name,
      args: params as readonly unknown[],
    });

    // For proxy functions, we expect an address return value
    const addressResult = result as string;
    if (addressResult && addressResult !== '0x0000000000000000000000000000000000000000') {
      return addressResult;
    }

    return null;
  } catch (error) {
    logger.warn('callContractFunction', `Failed to call ${signature}: ${error}`);
    return null;
  }
}

/**
 * Gets contract bytecode using viem
 */
async function getContractBytecode(
  address: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    const client = createViemClient(networkConfig);

    const bytecode = await client.getCode({
      address: address as `0x${string}`,
    });

    return bytecode || null;
  } catch (error) {
    logger.warn('getContractBytecode', `Failed to get bytecode: ${error}`);
    return null;
  }
}
