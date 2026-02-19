/**
 * Access Control Indexer URL resolution for EVM-compatible networks.
 *
 * Follows the same resolution pattern as `rpc.ts`:
 * 1. User-configured URL from UserNetworkServiceConfigService
 * 2. Default URL from network configuration
 *
 * @module configuration/access-control-indexer
 */

import { isValidUrl, logger, userNetworkServiceConfigService } from '@openzeppelin/ui-utils';

import type { EvmCompatibleNetworkConfig } from '../types/network';

const LOG_SYSTEM = 'AccessControlIndexerResolver';

/**
 * Extracts the user-configured access control indexer URL from UserNetworkServiceConfigService.
 *
 * @param networkId - The network ID to get the access control indexer URL for
 * @returns The access control indexer URL string if configured, undefined otherwise
 */
export function getUserAccessControlIndexerUrl(networkId: string): string | undefined {
  const svcCfg = userNetworkServiceConfigService.get(networkId, 'access-control-indexer');
  if (svcCfg && typeof svcCfg === 'object' && 'accessControlIndexerUrl' in svcCfg) {
    return (svcCfg as Record<string, unknown>).accessControlIndexerUrl as string;
  }
  return undefined;
}

/**
 * Resolves the access control indexer URL for a given EVM network configuration.
 *
 * Priority order:
 * 1. User-configured access control indexer URL (from Network Settings dialog)
 * 2. Default `accessControlIndexerUrl` from the network configuration
 *
 * Unlike RPC resolution, the access control indexer is optional — returns `undefined`
 * instead of throwing when no URL is available.
 *
 * @param networkConfig - EVM-compatible network configuration
 * @returns The resolved access control indexer URL string, or undefined if not configured
 */
export function resolveAccessControlIndexerUrl(
  networkConfig: EvmCompatibleNetworkConfig
): string | undefined {
  const networkId = networkConfig.id;

  // First priority: User-configured access control indexer URL
  const userUrl = getUserAccessControlIndexerUrl(networkId);
  if (userUrl) {
    if (isValidUrl(userUrl)) {
      logger.info(
        LOG_SYSTEM,
        `Using user-configured access control indexer URL for network ${networkId}`
      );
      return userUrl;
    } else {
      logger.warn(
        LOG_SYSTEM,
        `User-configured access control indexer URL for ${networkId} is invalid: ${userUrl}. Falling back.`
      );
    }
  }

  // Second priority: Default from network config
  if (networkConfig.accessControlIndexerUrl) {
    if (isValidUrl(networkConfig.accessControlIndexerUrl)) {
      logger.debug(
        LOG_SYSTEM,
        `Using default access control indexer URL for network ${networkId}: ${networkConfig.accessControlIndexerUrl}`
      );
      return networkConfig.accessControlIndexerUrl;
    } else {
      logger.warn(
        LOG_SYSTEM,
        `Default access control indexer URL for ${networkId} is invalid: ${networkConfig.accessControlIndexerUrl}`
      );
    }
  }

  logger.info(LOG_SYSTEM, `No access control indexer configured for network ${networkId}`);
  return undefined;
}
