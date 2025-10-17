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
 * Validates that the wallet config has all required URI properties.
 * @param config The configuration object to validate
 * @returns true if valid, false otherwise
 */
function isValidWalletConfig(config: unknown): boolean {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const obj = config as Record<string, unknown>;
  return (
    typeof obj.indexerUri === 'string' &&
    typeof obj.indexerWsUri === 'string' &&
    typeof obj.substrateNodeUri === 'string' &&
    typeof obj.proverServerUri === 'string'
  );
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

    // Validate response structure
    if (!isValidWalletConfig(config)) {
      logger.warn('getWalletConfigIfAvailable', 'Wallet returned invalid configuration structure', {
        missing: ['indexerUri', 'indexerWsUri', 'substrateNodeUri', 'proverServerUri'].filter(
          (key) => {
            const cfg = config as unknown as Record<string, unknown>;
            return typeof cfg?.[key] !== 'string';
          }
        ),
      });
      return undefined;
    }

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
    // Handle specific error scenarios
    if (error instanceof TypeError) {
      logger.debug(
        'getWalletConfigIfAvailable',
        'Wallet API contract violation: method or property not found',
        {
          message: error.message,
        }
      );
    } else if (error instanceof ReferenceError) {
      logger.debug(
        'getWalletConfigIfAvailable',
        'Wallet reference error: wallet API not properly initialized',
        {
          message: error.message,
        }
      );
    } else {
      logger.debug('getWalletConfigIfAvailable', 'Failed to retrieve wallet configuration', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return undefined;
  }
}
