import type { UserRpcProviderConfig } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

/**
 * Validates an RPC endpoint configuration for Midnight networks.
 * @param rpcConfig - The RPC provider configuration to validate
 * @returns True if the configuration is valid, false otherwise
 */
export function validateMidnightRpcEndpoint(_rpcConfig: UserRpcProviderConfig): boolean {
  // TODO: Implement Midnight-specific RPC validation when needed
  logger.info('validateMidnightRpcEndpoint', 'Midnight RPC validation not yet implemented');
  return true;
}

/**
 * Tests the connection to a Midnight RPC endpoint.
 * @param rpcConfig - The RPC provider configuration to test
 * @returns Connection test results including success status, latency, and any errors
 */
export async function testMidnightRpcConnection(_rpcConfig: UserRpcProviderConfig): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  // TODO: Implement RPC connection testing for Midnight
  logger.info('testMidnightRpcConnection', 'TODO: Implement RPC connection testing');
  return { success: true };
}

/**
 * Gets the current block number from a Midnight network.
 *
 * @returns Promise that rejects - not yet implemented for Midnight
 * @throws Error always - Midnight indexer does not currently expose block number API
 */
export async function getMidnightCurrentBlock(): Promise<number> {
  // TODO: Implement when Midnight indexer/RPC provides block number API
  throw new Error(
    'getCurrentBlock is not yet implemented for Midnight. ' +
      'The Midnight indexer does not currently expose a block number endpoint.'
  );
}
