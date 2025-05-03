/**
 * Gets a blockchain explorer URL for an address on Stellar
 *
 * @param address The address to get the explorer URL for
 * @param _chainId Optional chain ID (not used for Stellar, which uses public/testnet)
 * @returns A URL to view the address on Stellar Expert explorer
 */
export function getStellarExplorerAddressUrl(address: string, _chainId?: string): string | null {
  if (!address) return null;

  // Use StellarExpert as the default explorer for Stellar addresses
  return `https://stellar.expert/explorer/public/account/${address}`;
}

/**
 * Gets a blockchain explorer URL for a transaction in this chain
 *
 * @param txHash - The hash of the transaction to get the explorer URL for
 * @returns A URL to view the transaction on a blockchain explorer, or null if not supported
 */
export function getStellarExplorerTxUrl(txHash: string): string | null {
  // Stellar Expert uses /tx/ prefix for transactions
  return txHash ? `https://stellar.expert/explorer/public/tx/${txHash}` : null;
}
