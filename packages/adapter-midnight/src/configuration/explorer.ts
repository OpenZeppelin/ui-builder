import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import { NetworkConfig } from '@openzeppelin/transaction-form-types';
import type { UserExplorerConfig } from '@openzeppelin/transaction-form-types';

/**
 * Gets a blockchain explorer URL for an address on Midnight.
 * Uses the explorerUrl from the network configuration.
 *
 * @param address The address to get the explorer URL for
 * @param networkConfig The network configuration object.
 * @returns A URL to view the address on the configured Midnight explorer, or null.
 */
export function getMidnightExplorerAddressUrl(
  address: string,
  networkConfig: NetworkConfig
): string | null {
  // Placeholder: Implement logic using networkConfig.explorerUrl if available
  if (!address || !networkConfig.explorerUrl) {
    return null;
  }
  // Example construction (adjust path as needed for Midnight)
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/address/${address}`; // Assuming similar path to others
}

/**
 * Gets a blockchain explorer URL for a transaction on Midnight.
 * Uses the explorerUrl from the network configuration.
 *
 * @param txHash - The hash of the transaction to get the explorer URL for
 * @param networkConfig The network configuration object.
 * @returns A URL to view the transaction on the configured Midnight explorer, or null.
 */
export function getMidnightExplorerTxUrl(
  txHash: string,
  networkConfig: NetworkConfig
): string | null {
  // Placeholder: Implement logic using networkConfig.explorerUrl if available
  if (!txHash || !networkConfig.explorerUrl) {
    return null;
  }
  // Example construction (adjust path as needed for Midnight)
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/tx/${txHash}`; // Assuming similar path to others
}

/**
 * Validates an explorer configuration for Midnight networks.
 * @param explorerConfig - The explorer configuration to validate
 * @returns True if the configuration is valid, false otherwise
 */
export function validateMidnightExplorerConfig(_explorerConfig: UserExplorerConfig): boolean {
  // TODO: Implement Midnight-specific explorer validation when needed
  logger.info('validateMidnightExplorerConfig', 'Midnight explorer validation not yet implemented');
  return true;
}

/**
 * Tests the connection to a Midnight explorer API.
 * @param explorerConfig - The explorer configuration to test
 * @returns Connection test results including success status, latency, and any errors
 */
export async function testMidnightExplorerConnection(_explorerConfig: UserExplorerConfig): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  // TODO: Implement explorer connection testing for Midnight
  logger.info('testMidnightExplorerConnection', 'TODO: Implement explorer connection testing');
  return { success: true };
}
