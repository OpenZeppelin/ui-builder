import { NetworkConfig } from '@openzeppelin/transaction-form-types';

import { isValidEvmAddress } from '../utils';

/**
 * Gets a blockchain explorer URL for an EVM address.
 * Uses the explorerUrl from the network configuration.
 */
export function getEvmExplorerAddressUrl(
  address: string,
  networkConfig: NetworkConfig
): string | null {
  if (!isValidEvmAddress(address) || !networkConfig?.explorerUrl) {
    return null;
  }
  // Construct the URL using the explorerUrl from the config
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/address/${address}`;
}

/**
 * Gets a blockchain explorer URL for an EVM transaction.
 * Uses the explorerUrl from the network configuration.
 */
export function getEvmExplorerTxUrl(txHash: string, networkConfig: NetworkConfig): string | null {
  if (!txHash || !networkConfig?.explorerUrl) {
    return null;
  }
  // Construct the URL using the explorerUrl from the config
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/tx/${txHash}`;
}
