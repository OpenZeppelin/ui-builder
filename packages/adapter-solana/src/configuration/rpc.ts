import type { SolanaNetworkConfig, UserRpcProviderConfig } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

/**
 * Validates an RPC endpoint configuration for Solana networks.
 * @param rpcConfig - The RPC provider configuration to validate
 * @returns True if the configuration is valid, false otherwise
 */
export function validateSolanaRpcEndpoint(_rpcConfig: UserRpcProviderConfig): boolean {
  // TODO: Implement Solana-specific RPC validation when needed
  logger.info('validateSolanaRpcEndpoint', 'Solana RPC validation not yet implemented');
  return true;
}

/**
 * Tests the connection to a Solana RPC endpoint.
 * @param rpcConfig - The RPC provider configuration to test
 * @returns Connection test results including success status, latency, and any errors
 */
export async function testSolanaRpcConnection(_rpcConfig: UserRpcProviderConfig): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  // TODO: Implement RPC connection testing for Solana
  // Could use getVersion or getHealth RPC method
  logger.info('testSolanaRpcConnection', 'TODO: Implement RPC connection testing');
  return { success: true };
}

/**
 * Gets the current slot (block) number from a Solana network.
 *
 * @param networkConfig - The Solana network configuration
 * @returns Promise resolving to the current slot number
 * @throws Error if the RPC call fails
 */
export async function getSolanaCurrentBlock(networkConfig: SolanaNetworkConfig): Promise<number> {
  const rpcEndpoint = networkConfig.rpcEndpoint;
  if (!rpcEndpoint) {
    throw new Error('RPC endpoint not configured for this network');
  }

  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getSlot',
        params: [],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }

    if (data.result === undefined || data.result === null) {
      throw new Error('RPC response missing result field');
    }
    if (typeof data.result !== 'number') {
      throw new Error(`Invalid slot number type: expected number, got ${typeof data.result}`);
    }
    return data.result;
  } catch (error) {
    logger.error('getSolanaCurrentBlock', 'Failed to get current slot:', error);
    throw new Error(
      `Failed to get current block (slot): ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
