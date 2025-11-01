import { NetworkConfig, UserExplorerConfig } from '@openzeppelin/ui-builder-types';
import {
  appConfigService,
  logger,
  userNetworkServiceConfigService,
} from '@openzeppelin/ui-builder-utils';

import { shouldUseV2Api, testEtherscanV2Connection } from '../abi/etherscan-v2';
import { TypedEvmNetworkConfig } from '../types';
import { isValidEvmAddress } from '../utils';

/**
 * Resolves the explorer configuration for a given EVM network.
 * Priority order:
 * 1. User-configured explorer (from UserExplorerConfigService)
 * 2. For V2 API networks: Global Etherscan V2 API key (from AppConfigService global service configs)
 * 3. App-configured explorer API key (from AppConfigService network service configs)
 * 4. Default network explorer (from NetworkConfig)
 *
 * @param networkConfig - The EVM network configuration.
 * @returns The resolved explorer configuration.
 */
export function resolveExplorerConfig(networkConfig: TypedEvmNetworkConfig): UserExplorerConfig {
  // Precompute app-level keys and defaults for merging
  const isV2 =
    networkConfig.supportsEtherscanV2 &&
    networkConfig.primaryExplorerApiIdentifier === 'etherscan-v2';
  const globalV2ApiKey = isV2
    ? (appConfigService.getGlobalServiceConfig('etherscanv2')?.apiKey as string | undefined)
    : undefined;
  const appApiKey = networkConfig.primaryExplorerApiIdentifier
    ? appConfigService.getExplorerApiKey(networkConfig.primaryExplorerApiIdentifier)
    : undefined;

  // 1. Check for user-configured explorer via new generic service
  const rawCfg = userNetworkServiceConfigService.get(networkConfig.id, 'explorer');
  if (rawCfg && typeof rawCfg === 'object') {
    const userCfg = rawCfg as Record<string, unknown>;
    logger.info('ExplorerConfig', `Using user-configured explorer for ${networkConfig.name}`);
    return {
      explorerUrl: (userCfg.explorerUrl as string | undefined) ?? networkConfig.explorerUrl,
      apiUrl: (userCfg.apiUrl as string | undefined) ?? networkConfig.apiUrl,
      apiKey: (userCfg.apiKey as string | undefined) ?? globalV2ApiKey ?? appApiKey,
      name: `${networkConfig.name} Explorer`,
      isCustom: true,
    };
  }

  // 2. For V2 API networks using 'etherscan-v2' identifier, check for global Etherscan V2 API key
  if (isV2 && globalV2ApiKey) {
    logger.info('ExplorerConfig', `Using global Etherscan V2 API key for ${networkConfig.name}`);
    return {
      explorerUrl: networkConfig.explorerUrl,
      apiUrl: networkConfig.apiUrl,
      apiKey: globalV2ApiKey,
      name: `${networkConfig.name} Explorer (V2 API)`,
      isCustom: false,
    };
  }

  // 3. Check for app-configured API key (V1 style or other identifiers)
  if (appApiKey) {
    logger.info('ExplorerConfig', `Using app-configured API key for ${networkConfig.name}`);
    return {
      explorerUrl: networkConfig.explorerUrl,
      apiUrl: networkConfig.apiUrl,
      apiKey: appApiKey,
      name: `${networkConfig.name} Explorer`,
      isCustom: false,
    };
  }

  // 4. Use default network explorer (no API key)
  logger.info(
    'ExplorerConfig',
    `Using default explorer for ${networkConfig.name} (no API key configured)`
  );
  return {
    explorerUrl: networkConfig.explorerUrl,
    apiUrl: networkConfig.apiUrl,
    name: `${networkConfig.name} Explorer`,
    isCustom: false,
  };
}

/**
 * Gets a blockchain explorer URL for an EVM address.
 * Uses the resolved explorer configuration.
 */
export function getEvmExplorerAddressUrl(
  address: string,
  networkConfig: NetworkConfig
): string | null {
  if (!isValidEvmAddress(address)) {
    return null;
  }

  const explorerConfig = resolveExplorerConfig(networkConfig as TypedEvmNetworkConfig);
  if (!explorerConfig.explorerUrl) {
    return null;
  }

  // Construct the URL using the explorerUrl from the config
  const baseUrl = explorerConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/address/${address}`;
}

/**
 * Gets a blockchain explorer URL for an EVM transaction.
 * Uses the resolved explorer configuration.
 */
export function getEvmExplorerTxUrl(txHash: string, networkConfig: NetworkConfig): string | null {
  if (!txHash) {
    return null;
  }

  const explorerConfig = resolveExplorerConfig(networkConfig as TypedEvmNetworkConfig);
  if (!explorerConfig.explorerUrl) {
    return null;
  }

  // Construct the URL using the explorerUrl from the config
  const baseUrl = explorerConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Validates an EVM explorer configuration.
 * Checks URL formats and API key format.
 */
export function validateEvmExplorerConfig(explorerConfig: UserExplorerConfig): boolean {
  // Validate URLs if provided
  if (explorerConfig.explorerUrl) {
    try {
      new URL(explorerConfig.explorerUrl);
    } catch {
      return false;
    }
  }

  if (explorerConfig.apiUrl) {
    try {
      new URL(explorerConfig.apiUrl);
    } catch {
      return false;
    }
  }

  // Basic API key validation (not empty)
  if (explorerConfig.apiKey !== undefined && explorerConfig.apiKey.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Tests the connection to an EVM explorer API.
 * Makes a test API call to verify the API key works.
 */
export async function testEvmExplorerConnection(
  explorerConfig: UserExplorerConfig,
  networkConfig?: TypedEvmNetworkConfig
): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  // Check if API key is required for this network
  const requiresApiKey =
    networkConfig && 'requiresExplorerApiKey' in networkConfig
      ? networkConfig.requiresExplorerApiKey !== false
      : true;

  if (requiresApiKey && !explorerConfig.apiKey) {
    return {
      success: false,
      error: 'API key is required for testing connection to this explorer',
    };
  }

  // Check if we should use V2 API
  if (networkConfig && shouldUseV2Api(networkConfig)) {
    return testEtherscanV2Connection(networkConfig, explorerConfig.apiKey);
  }

  // Use V1 API (legacy)
  // Use provided API URL or fall back to network config if available
  let apiUrl = explorerConfig.apiUrl;
  if (!apiUrl && networkConfig?.apiUrl) {
    apiUrl = networkConfig.apiUrl;
  }

  if (!apiUrl) {
    return {
      success: false,
      error:
        'API URL is required for testing connection. Please provide an API URL or ensure the network has a default API URL configured.',
    };
  }

  const startTime = Date.now();

  try {
    // Test with a simple API call - get the latest block number
    const url = new URL(apiUrl);
    url.searchParams.append('module', 'proxy');
    url.searchParams.append('action', 'eth_blockNumber');
    if (explorerConfig.apiKey) {
      url.searchParams.append('apikey', explorerConfig.apiKey);
    }

    const response = await fetch(url.toString());
    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        latency,
      };
    }

    const data = await response.json();

    // Check for API errors in the response
    if (data.status === '0' && data.message) {
      return {
        success: false,
        error: data.message,
        latency,
      };
    }

    // Success if we got a valid response
    return {
      success: true,
      latency,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      latency: Date.now() - startTime,
    };
  }
}
