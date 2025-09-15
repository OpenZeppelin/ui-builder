import { useStellarWalletContext } from '../context';

/**
 * Account information returned by the hook
 */
export interface StellarAccountInfo {
  /** The connected wallet address */
  address: string | null;
  /** Whether a wallet is currently connected */
  isConnected: boolean;
  /** Whether a connection is in progress */
  isConnecting: boolean;
}

/**
 * Hook to get the current Stellar account information
 * @returns Account information including address and connection status
 */
export function useStellarAccount(): StellarAccountInfo {
  const { address, isConnected, isConnecting } = useStellarWalletContext();

  return {
    address,
    isConnected,
    isConnecting,
  };
}
