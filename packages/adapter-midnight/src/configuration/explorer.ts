import { NetworkConfig } from '@openzeppelin/transaction-form-types';

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
