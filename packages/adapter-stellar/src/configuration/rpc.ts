import type { StellarNetworkConfig, UserRpcProviderConfig } from '@openzeppelin/ui-builder-types';
import {
  appConfigService,
  isValidUrl,
  logger,
  userRpcConfigService,
} from '@openzeppelin/ui-builder-utils';

/**
 * Builds a complete RPC URL from a user RPC provider configuration.
 * For Stellar (Soroban), this just returns the URL as-is since
 * users are providing complete RPC URLs including any API keys.
 *
 * @param config The user RPC provider configuration
 * @returns The RPC URL
 */
export function buildRpcUrl(config: UserRpcProviderConfig): string {
  return config.url;
}

/**
 * Resolves the RPC URL for a given Stellar network configuration.
 * Priority order:
 * 1. User-provided RPC configuration (from UserRpcConfigService)
 * 2. RPC URL override from AppConfigService
 * 3. Default sorobanRpcUrl from the network configuration
 *
 * @param networkConfig - The Stellar network configuration.
 * @returns The resolved RPC URL string.
 * @throws If no RPC URL can be resolved (neither user config, override, nor default is present and valid).
 */
export function resolveRpcUrl(networkConfig: StellarNetworkConfig): string {
  const logSystem = 'StellarRpcResolver';
  const networkId = networkConfig.id;

  // First priority: Check user-provided RPC configuration
  const userRpcConfig = userRpcConfigService.getUserRpcConfig(networkId);
  if (userRpcConfig) {
    const userRpcUrl = buildRpcUrl(userRpcConfig);
    if (isValidUrl(userRpcUrl)) {
      logger.info(
        logSystem,
        `Using user-configured Soroban RPC URL for network ${networkId}: ${userRpcConfig.name || 'Custom'}`
      );
      return userRpcUrl;
    } else {
      logger.warn(
        logSystem,
        `User-configured Soroban RPC URL for ${networkId} is invalid: ${userRpcUrl}. Falling back.`
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
      `Using overridden Soroban RPC URL for network ${networkId}: ${rpcUrlFromOverride}`
    );
    if (isValidUrl(rpcUrlFromOverride)) {
      return rpcUrlFromOverride;
    } else {
      logger.warn(
        logSystem,
        `Overridden Soroban RPC URL for ${networkId} is invalid: ${rpcUrlFromOverride}. Falling back.`
      );
    }
  }

  // Third priority: Fallback to the sorobanRpcUrl in the networkConfig
  if (networkConfig.sorobanRpcUrl && isValidUrl(networkConfig.sorobanRpcUrl)) {
    logger.debug(
      logSystem,
      `Using default Soroban RPC URL for network ${networkId}: ${networkConfig.sorobanRpcUrl}`
    );
    return networkConfig.sorobanRpcUrl;
  }

  logger.error(
    logSystem,
    `No valid Soroban RPC URL could be resolved for network ${networkId}. Checked user config, override, and networkConfig.sorobanRpcUrl.`
  );
  throw new Error(
    `No valid Soroban RPC URL configured for network ${networkConfig.name} (ID: ${networkId}).`
  );
}

/**
 * Validates an RPC endpoint configuration for Stellar networks.
 * @param rpcConfig - The RPC provider configuration to validate
 * @returns True if the configuration is valid, false otherwise
 */
export function validateStellarRpcEndpoint(rpcConfig: UserRpcProviderConfig): boolean {
  try {
    // Check if it's a valid URL (our validator already ensures HTTP/HTTPS)
    if (!isValidUrl(rpcConfig.url)) {
      logger.error('validateStellarRpcEndpoint', `Invalid RPC URL format: ${rpcConfig.url}`);
      return false;
    }

    // Additional Stellar-specific validation could be added here
    // For example, checking if the URL follows known provider patterns

    return true;
  } catch (error) {
    logger.error('validateStellarRpcEndpoint', 'Error validating RPC endpoint:', error);
    return false;
  }
}

/**
 * Tests the connection to a Stellar (Soroban) RPC endpoint with a timeout.
 * Uses the Soroban RPC getHealth method to test connectivity.
 * @param rpcConfig - The RPC provider configuration to test
 * @param timeoutMs - Timeout in milliseconds (default: 5000ms)
 * @returns Connection test results including success status, latency, and any errors
 */
export async function testStellarRpcConnection(
  rpcConfig: UserRpcProviderConfig,
  timeoutMs: number = 5000
): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  if (!rpcConfig.url) {
    return { success: false, error: 'Soroban RPC URL is required' };
  }

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const startTime = Date.now();

    // Use fetch to make a JSON-RPC call to test the connection
    // Using getHealth method which is standard for Soroban RPC endpoints
    const response = await fetch(rpcConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { success: false, error: `HTTP error: ${response.status}` };
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    // Check for JSON-RPC error
    if (data.error) {
      return {
        success: false,
        error: `Soroban RPC error: ${data.error.message || 'Unknown RPC error'}`,
      };
    }

    // For Soroban RPC getHealth, a successful response should contain result
    if (!data.result) {
      // Try fallback method - getLatestLedger
      return await testWithFallbackMethod(rpcConfig, controller.signal, startTime);
    }

    // Check if the health status indicates the service is healthy
    const healthStatus = data.result.status;
    if (healthStatus && healthStatus !== 'healthy') {
      return {
        success: false,
        error: `Soroban RPC service unhealthy: ${healthStatus}`,
        latency,
      };
    }

    return { success: true, latency };
  } catch (error) {
    logger.error('testStellarRpcConnection', 'Connection test failed:', error);

    // Check if the error was due to timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: `Connection timeout after ${timeoutMs}ms`,
      };
    }

    // Try fallback method if primary test failed
    try {
      return await testWithFallbackMethod(rpcConfig, controller.signal, Date.now());
    } catch {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  } finally {
    // Clear the timeout
    clearTimeout(timeoutId);
  }
}

/**
 * Fallback method to test Soroban RPC connection using getLatestLedger.
 * This is used when getHealth is not available or fails.
 */
async function testWithFallbackMethod(
  rpcConfig: UserRpcProviderConfig,
  signal: AbortSignal,
  startTime: number
): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  const response = await fetch(rpcConfig.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getLatestLedger',
    }),
    signal,
  });

  if (!response.ok) {
    return { success: false, error: `HTTP error: ${response.status}` };
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  if (data.error) {
    return {
      success: false,
      error: `Soroban RPC error: ${data.error.message || 'Unknown RPC error'}`,
    };
  }

  // If we get a valid response with ledger info, the connection is working
  if (data.result && data.result.sequence) {
    return { success: true, latency };
  }

  return {
    success: false,
    error: 'Unexpected response format from Soroban RPC endpoint',
  };
}
