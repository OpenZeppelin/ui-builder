import { NetworkConfig } from '@openzeppelin/transaction-form-types';

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
