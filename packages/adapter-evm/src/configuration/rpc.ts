import type { EvmNetworkConfig, UserRpcProviderConfig } from '@openzeppelin/ui-builder-types';
import {
  appConfigService,
  isValidUrl,
  logger,
  userNetworkServiceConfigService,
} from '@openzeppelin/ui-builder-utils';

/**
 * Builds a complete RPC URL from a user RPC provider configuration.
 * For simplified RPC configuration, this just returns the URL as-is since
 * users are now providing complete RPC URLs including any API keys.
 *
 * @param config The user RPC provider configuration
 * @returns The RPC URL
 */
export function buildRpcUrl(config: UserRpcProviderConfig): string {
  return config.url;
}

/**
 * Extracts the user-configured RPC URL from UserNetworkServiceConfigService.
 *
 * @param networkId - The network ID to get the RPC URL for
 * @returns The RPC URL string if configured, undefined otherwise
 */
export function getUserRpcUrl(networkId: string): string | undefined {
  const svcCfg = userNetworkServiceConfigService.get(networkId, 'rpc');
  if (svcCfg && typeof svcCfg === 'object' && 'rpcUrl' in svcCfg) {
    return (svcCfg as Record<string, unknown>).rpcUrl as string;
  }
  return undefined;
}

/**
 * Resolves the RPC URL for a given EVM network configuration.
 * Priority order:
 * 1. User-provided RPC configuration (from UserRpcConfigService)
 * 2. RPC URL override from AppConfigService
 * 3. Default rpcUrl from the network configuration
 *
 * @param networkConfig - The EVM network configuration.
 * @returns The resolved RPC URL string.
 * @throws If no RPC URL can be resolved (neither user config, override, nor default is present and valid).
 */
export function resolveRpcUrl(networkConfig: EvmNetworkConfig): string {
  const logSystem = 'RpcResolver';
  const networkId = networkConfig.id;

  // First priority: Check adapter-led service config (generic)
  const userRpcUrl = getUserRpcUrl(networkId);
  if (userRpcUrl) {
    const userRpcUrlString = String(userRpcUrl);
    if (isValidUrl(userRpcUrlString)) {
      logger.info(logSystem, `Using user-configured RPC URL for network ${networkId}`);
      return userRpcUrlString;
    } else {
      logger.warn(
        logSystem,
        `User-configured RPC URL for ${networkId} is invalid: ${userRpcUrlString}. Falling back.`
      );
    }
  }

  // Second priority: Check AppConfigService for an override
  const rpcOverrideSetting = appConfigService.getRpcEndpointOverride(networkId);
  let rpcUrlFromOverride: string | undefined;

  if (typeof rpcOverrideSetting === 'string') {
    rpcUrlFromOverride = rpcOverrideSetting;
  } else if (typeof rpcOverrideSetting === 'object' && rpcOverrideSetting) {
    // Check if it's a UserRpcProviderConfig
    if ('url' in rpcOverrideSetting && 'isCustom' in rpcOverrideSetting) {
      const userConfig = rpcOverrideSetting as UserRpcProviderConfig;
      rpcUrlFromOverride = buildRpcUrl(userConfig);
    } else if ('http' in rpcOverrideSetting) {
      // It's an RpcEndpointConfig
      rpcUrlFromOverride = rpcOverrideSetting.http;
    }
  }

  if (rpcUrlFromOverride) {
    logger.info(
      logSystem,
      `Using overridden RPC URL for network ${networkId}: ${rpcUrlFromOverride}`
    );
    if (isValidUrl(rpcUrlFromOverride)) {
      return rpcUrlFromOverride;
    } else {
      logger.warn(
        logSystem,
        `Overridden RPC URL for ${networkId} is invalid: ${rpcUrlFromOverride}. Falling back.`
      );
    }
  }

  // Third priority: Fallback to the rpcUrl in the networkConfig
  if (networkConfig.rpcUrl && isValidUrl(networkConfig.rpcUrl)) {
    logger.debug(
      logSystem,
      `Using default RPC URL for network ${networkId}: ${networkConfig.rpcUrl}`
    );
    return networkConfig.rpcUrl;
  }

  logger.error(
    logSystem,
    `No valid RPC URL could be resolved for network ${networkId}. Checked user config, override, and networkConfig.rpcUrl.`
  );
  throw new Error(
    `No valid RPC URL configured for network ${networkConfig.name} (ID: ${networkId}).`
  );
}

/**
 * Validates an RPC endpoint configuration for EVM networks.
 * @param rpcConfig - The RPC provider configuration to validate
 * @returns True if the configuration is valid, false otherwise
 */
export function validateEvmRpcEndpoint(rpcConfig: UserRpcProviderConfig): boolean {
  try {
    // Check if it's a valid URL (our validator already ensures HTTP/HTTPS)
    if (!isValidUrl(rpcConfig.url)) {
      logger.error('validateEvmRpcEndpoint', `Invalid RPC URL format: ${rpcConfig.url}`);
      return false;
    }

    // Additional EVM-specific validation could be added here
    // For example, checking if the URL follows known provider patterns

    return true;
  } catch (error) {
    logger.error('validateEvmRpcEndpoint', 'Error validating RPC endpoint:', error);
    return false;
  }
}

/**
 * Tests the connection to an EVM RPC endpoint with a timeout.
 * @param rpcConfig - The RPC provider configuration to test
 * @param timeoutMs - Timeout in milliseconds (default: 5000ms)
 * @returns Connection test results including success status, latency, and any errors
 */
export async function testEvmRpcConnection(
  rpcConfig: UserRpcProviderConfig,
  timeoutMs: number = 5000
): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  if (!rpcConfig.url) {
    return { success: false, error: 'RPC URL is required' };
  }

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const startTime = Date.now();

    // Use fetch to make a JSON-RPC call to test the connection
    const response = await fetch(rpcConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { success: false, error: `HTTP error: ${response.status}` };
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    if (data.error) {
      return { success: false, error: data.error.message || 'RPC error' };
    }

    return { success: true, latency };
  } catch (error) {
    logger.error('testEvmRpcConnection', 'Connection test failed:', error);

    // Check if the error was due to timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: `Connection timeout after ${timeoutMs}ms`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  } finally {
    // Clear the timeout
    clearTimeout(timeoutId);
  }
}
