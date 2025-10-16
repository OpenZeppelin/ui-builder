import { logger } from '@openzeppelin/ui-builder-utils';

// Local copy of minimal provider config used by wallet serviceUriConfig()
export interface ProviderConfig {
  indexerUri: string;
  indexerWsUri: string;
  substrateNodeUri: string;
  proverServerUri: string;
  networkId?: string;
}

/**
 * Attempts to get wallet configuration if wallet is available.
 * This respects user privacy preferences for indexer/node URIs.
 *
 * For read-only queries, only `indexerUri` and `indexerWsUri` are used.
 * `substrateNodeUri` and `proverServerUri` will be important for write operations.
 *
 * @returns Wallet configuration if available, undefined otherwise
 */
export async function getWalletConfigIfAvailable(): Promise<Partial<ProviderConfig> | undefined> {
  try {
    // Check if wallet is available in browser
    if (typeof window === 'undefined' || !window.midnight?.mnLace) {
      logger.debug('getWalletConfigIfAvailable', 'Lace wallet not available in browser');
      return undefined;
    }

    // Get service URI configuration from wallet (respects user privacy preferences)
    // Note: This is available even before connecting, on the top-level API
    const config = await window.midnight.mnLace.serviceUriConfig();
    logger.info(
      'getWalletConfigIfAvailable',
      'Using wallet configuration (respecting user privacy preferences)',
      {
        indexerUri: config.indexerUri,
      }
    );

    return {
      indexerUri: config.indexerUri,
      indexerWsUri: config.indexerWsUri,
      substrateNodeUri: config.substrateNodeUri,
      proverServerUri: config.proverServerUri,
      // ServiceUriConfig doesn't include networkId in v3, it will be undefined
      networkId: undefined,
    };
  } catch (error) {
    // Wallet not connected or getConfiguration() failed
    logger.debug(
      'getWalletConfigIfAvailable',
      'Failed to get wallet configuration, will use network config',
      error
    );
    return undefined;
  }
}
