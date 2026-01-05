import { NetworkConfig } from '@openzeppelin/ui-types';
import type { UserExplorerConfig } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

/**
 * Gets a blockchain explorer URL for a Solana address.
 * Uses the explorerUrl from the network configuration.
 */
export function getSolanaExplorerAddressUrl(
  address: string,
  networkConfig: NetworkConfig
): string | null {
  if (!networkConfig.explorerUrl) {
    return null;
  }
  // Construct the URL, assuming a standard /address/ path
  // Handle potential trailing slashes in explorerUrl
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/address/${address}`;
}

/**
 * Gets a blockchain explorer URL for a Solana transaction.
 * Uses the explorerUrl from the network configuration.
 */
export function getSolanaExplorerTxUrl(
  txHash: string,
  networkConfig: NetworkConfig
): string | null {
  if (!networkConfig.explorerUrl) {
    return null;
  }
  // Construct the URL, assuming a standard /tx/ path
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Validates an explorer configuration for Solana networks.
 * @param explorerConfig - The explorer configuration to validate
 * @returns True if the configuration is valid, false otherwise
 */
export function validateSolanaExplorerConfig(_explorerConfig: UserExplorerConfig): boolean {
  // TODO: Implement Solana-specific explorer validation when needed
  logger.info('validateSolanaExplorerConfig', 'Solana explorer validation not yet implemented');
  return true;
}

/**
 * Tests the connection to a Solana explorer API.
 * @param explorerConfig - The explorer configuration to test
 * @returns Connection test results including success status, latency, and any errors
 */
export async function testSolanaExplorerConnection(_explorerConfig: UserExplorerConfig): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  // TODO: Implement explorer connection testing for Solana
  logger.info('testSolanaExplorerConnection', 'TODO: Implement explorer connection testing');
  return { success: true };
}
