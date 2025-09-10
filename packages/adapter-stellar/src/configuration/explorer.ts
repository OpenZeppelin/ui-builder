import { NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import type { UserExplorerConfig } from '@openzeppelin/contracts-ui-builder-types';

import { isValidContractAddress } from '../validation';

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
  // Use /contract for Soroban contract IDs, otherwise /account
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  const path = isValidContractAddress(address) ? 'contract' : 'account';
  return `${baseUrl}/${path}/${encodeURIComponent(address)}`;
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
  return `${baseUrl}/tx/${encodeURIComponent(txHash)}`;
}

/**
 * Validates a Stellar explorer configuration.
 * Checks URL formats and API key format.
 */
export function validateStellarExplorerConfig(explorerConfig: UserExplorerConfig): boolean {
  // Validate URLs if provided
  if (explorerConfig.explorerUrl) {
    try {
      new URL(explorerConfig.explorerUrl);
    } catch {
      return false;
    }
  } else {
    // explorerUrl is required
    return false;
  }

  if (explorerConfig.apiUrl) {
    try {
      new URL(explorerConfig.apiUrl);
    } catch {
      return false;
    }
  }

  // Basic API key validation (not empty)
  if (explorerConfig.apiKey !== undefined && explorerConfig.apiKey.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Tests the connection to a Stellar explorer API.
 * Makes a test request to verify the explorer is accessible.
 */
export async function testStellarExplorerConnection(
  explorerConfig: UserExplorerConfig,
  _networkConfig?: NetworkConfig,
  timeoutMs: number = 5000
): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  if (!explorerConfig.explorerUrl) {
    return { success: false, error: 'Explorer URL is required' };
  }

  const startTime = Date.now();

  try {
    // Test by making a simple HTTP request to the explorer URL
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(explorerConfig.explorerUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'contracts-ui-builder-stellar-adapter',
      },
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        latency,
      };
    }

    // Success if we got a response
    return {
      success: true,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: `Connection timeout after ${timeoutMs}ms`,
          latency,
        };
      }

      return {
        success: false,
        error: error.message,
        latency,
      };
    }

    return {
      success: false,
      error: 'Connection test failed',
      latency,
    };
  }
}
