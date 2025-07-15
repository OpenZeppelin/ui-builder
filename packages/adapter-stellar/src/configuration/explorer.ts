import { NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import type { UserExplorerConfig } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

/**
 * Gets a blockchain explorer URL for an address on Stellar.
 * Uses the explorerUrl from the network configuration.
 *
 * @param address The address to get the explorer URL for
 * @param networkConfig The network configuration object.
 * @returns A URL to view the address on the configured Stellar explorer, or null.
 */
export function getStellarExplorerAddressUrl(
  address: string,
  networkConfig: NetworkConfig
): string | null {
  if (!address || !networkConfig.explorerUrl) {
    return null;
  }
  // Construct the URL, assuming a standard /account/ path for Stellar explorers
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/account/${address}`;
}

/**
 * Gets a blockchain explorer URL for a transaction on Stellar.
 * Uses the explorerUrl from the network configuration.
 *
 * @param txHash - The hash of the transaction to get the explorer URL for
 * @param networkConfig The network configuration object.
 * @returns A URL to view the transaction on the configured Stellar explorer, or null.
 */
export function getStellarExplorerTxUrl(
  txHash: string,
  networkConfig: NetworkConfig
): string | null {
  if (!txHash || !networkConfig.explorerUrl) {
    return null;
  }
  // Construct the URL, assuming a standard /tx/ path for Stellar explorers
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Validates an explorer configuration for Stellar networks.
 * @param explorerConfig - The explorer configuration to validate
 * @returns True if the configuration is valid, false otherwise
 */
export function validateStellarExplorerConfig(_explorerConfig: UserExplorerConfig): boolean {
  // TODO: Implement Stellar-specific explorer validation when needed
  logger.info('validateStellarExplorerConfig', 'Stellar explorer validation not yet implemented');
  return true;
}

/**
 * Tests the connection to a Stellar explorer API.
 * @param explorerConfig - The explorer configuration to test
 * @returns Connection test results including success status, latency, and any errors
 */
export async function testStellarExplorerConnection(_explorerConfig: UserExplorerConfig): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  // TODO: Implement explorer connection testing for Stellar
  // Could use a health check endpoint if available
  logger.info('testStellarExplorerConnection', 'TODO: Implement explorer connection testing');
  return { success: true };
}
