import { isValidEvmAddress } from '../utils';

/**
 * Gets a blockchain explorer URL for an EVM address.
 */
export function getEvmExplorerAddressUrl(address: string, _chainId?: string): string | null {
  // TODO: Enhance this to use the actual connected chainId from getWalletConnectionStatus
  // and potentially support multiple explorers based on the chain.
  // For now, defaults to Etherscan (Mainnet).
  if (!isValidEvmAddress(address)) return null;
  return `https://etherscan.io/address/${address}`;
}

/**
 * Gets a blockchain explorer URL for an EVM transaction.
 */
export function getEvmExplorerTxUrl(txHash: string, _chainId?: string): string | null {
  // TODO: Enhance this to use the actual connected chainId
  if (!txHash) return null;
  return `https://etherscan.io/tx/${txHash}`;
}
