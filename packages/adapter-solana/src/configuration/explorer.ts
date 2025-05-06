import { NetworkConfig } from '@openzeppelin/transaction-form-types';

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
