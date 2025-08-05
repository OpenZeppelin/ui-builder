/**
 * Proxy Contract Detection Utilities
 *
 * Automatically detects proxy contracts and resolves implementation addresses
 * for UUPS, Transparent, Beacon, and other proxy patterns.
 */
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

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
      case 'transparent':
        return await getEIP1967Implementation(proxyAddress, networkConfig);

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
 * Reads a storage slot from a contract
 */
async function readStorageSlot(
  address: string,
  slot: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    const response = await fetch(networkConfig.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getStorageAt',
        params: [address, slot, 'latest'],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(`RPC error: ${result.error.message}`);
    }

    const storageValue = result.result;

    // Convert from 32-byte storage format to 20-byte address
    if (
      storageValue &&
      storageValue !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
      const address = '0x' + storageValue.slice(-40); // Last 20 bytes
      return address;
    }

    return null;
  } catch (error) {
    logger.warn('readStorageSlot', `Failed to read storage slot ${slot}: ${error}`);
    return null;
  }
}

/**
 * Calls a function on a contract
 */
async function callContractFunction(
  address: string,
  signature: string,
  _params: unknown[],
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    // For simple cases, we'll use eth_call
    // In a full implementation, you'd use web3 or ethers to encode the function call
    const functionSelector = signature.slice(0, 10); // First 4 bytes after '0x'

    const response = await fetch(networkConfig.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: address,
            data: functionSelector + '0'.repeat(56), // Pad to 32 bytes
          },
          'latest',
        ],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(`RPC error: ${result.error.message}`);
    }

    const returnData = result.result;

    // Extract address from return data (assume it's the first 32 bytes containing an address)
    if (returnData && returnData.length >= 66) {
      const address = '0x' + returnData.slice(-40); // Last 20 bytes
      return address;
    }

    return null;
  } catch (error) {
    logger.warn('callContractFunction', `Failed to call ${signature}: ${error}`);
    return null;
  }
}

/**
 * Gets contract bytecode
 */
async function getContractBytecode(
  address: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null> {
  try {
    const response = await fetch(networkConfig.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(`RPC error: ${result.error.message}`);
    }

    return result.result;
  } catch (error) {
    logger.warn('getContractBytecode', `Failed to get bytecode: ${error}`);
    return null;
  }
}
