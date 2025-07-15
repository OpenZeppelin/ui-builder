import {
  EvmNetworkConfig,
  NetworkConfig,
  UserExplorerConfig,
} from '@openzeppelin/contracts-ui-builder-types';
import {
  appConfigService,
  userExplorerConfigService,
} from '@openzeppelin/contracts-ui-builder-utils';

import { isValidEvmAddress } from '../utils';

/**
 * Resolves the explorer configuration for a given EVM network.
 * Priority order:
 * 1. User-configured explorer (from UserExplorerConfigService)
 * 2. App-configured explorer API key (from AppConfigService)
 * 3. Default network explorer (from NetworkConfig)
 *
 * @param networkConfig - The EVM network configuration.
 * @returns The resolved explorer configuration.
 */
export function resolveExplorerConfig(networkConfig: EvmNetworkConfig): {
  explorerUrl?: string;
  apiUrl?: string;
  apiKey?: string;
} {
  const networkId = networkConfig.id;

  // Priority 1: Check user-provided explorer configuration
  const userConfig = userExplorerConfigService.getUserExplorerConfig(networkId);
  if (userConfig) {
    return {
      explorerUrl: userConfig.explorerUrl || networkConfig.explorerUrl,
      apiUrl: userConfig.apiUrl || networkConfig.apiUrl,
      apiKey: userConfig.apiKey,
    };
  }

  // Priority 2: Check AppConfigService for an API key
  let apiKey: string | undefined;
  if (networkConfig.primaryExplorerApiIdentifier) {
    apiKey = appConfigService.getExplorerApiKey(networkConfig.primaryExplorerApiIdentifier);
  }

  // Priority 3: Default from network config
  return {
    explorerUrl: networkConfig.explorerUrl,
    apiUrl: networkConfig.apiUrl,
    apiKey: apiKey,
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

  const explorerConfig = resolveExplorerConfig(networkConfig as EvmNetworkConfig);
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

  const explorerConfig = resolveExplorerConfig(networkConfig as EvmNetworkConfig);
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
  networkConfig?: EvmNetworkConfig
): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  if (!explorerConfig.apiKey) {
    return {
      success: false,
      error: 'API key is required for testing connection',
    };
  }

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
    url.searchParams.append('apikey', explorerConfig.apiKey);

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
