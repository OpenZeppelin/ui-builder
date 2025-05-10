import { appConfigService, logger } from '@openzeppelin/transaction-form-renderer';
import type { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

// No longer need PUBLIC_RPC_FALLBACKS array or individual constants here

/**
 * Resolves the RPC URL for a given EVM network configuration.
 * It prioritizes an RPC URL override from AppConfigService if available,
 * otherwise falls back to the rpcUrl defined in the EvmNetworkConfig.
 *
 * @param networkConfig - The EVM network configuration.
 * @returns The resolved RPC URL string.
 * @throws If no RPC URL can be resolved (neither override nor default is present and valid).
 */
export function resolveRpcUrl(networkConfig: EvmNetworkConfig): string {
  const logSystem = 'RpcResolver';
  const networkId = networkConfig.id;

  // Check AppConfigService for an override
  const rpcOverrideSetting = appConfigService.getRpcEndpointOverride(networkId);
  let rpcUrlFromOverride: string | undefined;

  if (typeof rpcOverrideSetting === 'string') {
    rpcUrlFromOverride = rpcOverrideSetting;
  } else if (typeof rpcOverrideSetting === 'object' && rpcOverrideSetting?.http) {
    rpcUrlFromOverride = rpcOverrideSetting.http;
  }

  if (rpcUrlFromOverride) {
    logger.info(
      logSystem,
      `Using overridden RPC URL for network ${networkId}: ${rpcUrlFromOverride}`
    );
    if (isValidHttpUrl(rpcUrlFromOverride)) {
      return rpcUrlFromOverride;
    } else {
      logger.warn(
        logSystem,
        `Overridden RPC URL for ${networkId} is invalid: ${rpcUrlFromOverride}. Falling back.`
      );
    }
  }

  // Fallback to the rpcUrl in the networkConfig
  if (networkConfig.rpcUrl && isValidHttpUrl(networkConfig.rpcUrl)) {
    logger.debug(
      logSystem,
      `Using default RPC URL for network ${networkId}: ${networkConfig.rpcUrl}`
    );
    return networkConfig.rpcUrl;
  }

  logger.error(
    logSystem,
    `No valid RPC URL could be resolved for network ${networkId}. Checked override and networkConfig.rpcUrl.`
  );
  throw new Error(
    `No valid RPC URL configured for network ${networkConfig.name} (ID: ${networkId}).`
  );
}

/**
 * Validates if a string is a valid HTTP/HTTPS URL.
 * @param urlString - The string to validate.
 * @returns True if valid, false otherwise.
 */
function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
