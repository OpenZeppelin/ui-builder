import type { GetAccountReturnType } from '@wagmi/core';

import type { Connector } from '@openzeppelin/transaction-form-types';

import type { WagmiWalletImplementation } from '../implementation/wagmi-implementation';

/**
 * Indicates if this adapter implementation supports wallet connection.
 */
export function evmSupportsWalletConnection(): boolean {
  // Currently hardcoded for Wagmi implementation
  return true;
}

/**
 * Gets the list of available wallet connectors supported by this adapter's implementation.
 */
export async function getEvmAvailableConnectors(
  walletImplementation: WagmiWalletImplementation
): Promise<Connector[]> {
  return walletImplementation.getAvailableConnectors();
}

/**
 * Connects to a wallet using the specified connector and ensures the wallet
 * is switched to the target network if necessary.
 *
 * @param connectorId The ID of the connector to use.
 * @param walletImplementation The wallet interaction implementation (e.g., Wagmi).
 * @param targetChainId The desired chain ID for the connection.
 * @returns A promise with connection status, address, chainId, error, and network switch status.
 */
export async function connectAndEnsureCorrectNetwork(
  connectorId: string,
  walletImplementation: WagmiWalletImplementation,
  targetChainId: number
): Promise<{
  connected: boolean;
  address?: string;
  chainId?: number;
  error?: string;
  switchedNetwork?: boolean;
}> {
  const connectResult = await walletImplementation.connect(connectorId);

  if (connectResult.connected && connectResult.address && connectResult.chainId) {
    // Wallet connected successfully, now check if it's on the correct network.
    if (connectResult.chainId !== targetChainId) {
      console.info(
        `connectAndEnsureCorrectNetwork: Wallet connected to chain ${connectResult.chainId}, but target is ${targetChainId}. Attempting switch.`
      );
      try {
        await walletImplementation.switchNetwork(targetChainId);
        // After successful switch, re-fetch connection status to confirm the new chainId.
        const postSwitchStatus = walletImplementation.getWalletConnectionStatus();
        if (postSwitchStatus.chainId === targetChainId) {
          console.info(
            `connectAndEnsureCorrectNetwork: Successfully switched to target chain ${targetChainId}.`
          );
          return {
            connected: true,
            address: connectResult.address, // Address remains the same from initial connect
            chainId: postSwitchStatus.chainId, // Reflect the new chainId
            switchedNetwork: true,
          };
        } else {
          console.warn(
            `connectAndEnsureCorrectNetwork: Network switch appeared to succeed but wallet is still on chain ${postSwitchStatus.chainId}.`
          );
          await walletImplementation.disconnect(); // Disconnect as state is inconsistent
          return {
            connected: false,
            error: `Failed to confirm switch to the required network (target: ${targetChainId}). Connection aborted.`,
            switchedNetwork: true, // Switch was attempted
          };
        }
      } catch (switchError) {
        console.error('connectAndEnsureCorrectNetwork: Network switch failed:', switchError);
        await walletImplementation.disconnect(); // Disconnect if switch fails
        return {
          connected: false,
          error: `Wallet connected, but failed to switch to the required network (target: ${targetChainId}). Connection aborted. Reason: ${switchError instanceof Error ? switchError.message : 'Unknown error'}`,
          switchedNetwork: false, // Switch attempted but failed
        };
      }
    } else {
      // Already on the correct network
      console.info(
        `connectAndEnsureCorrectNetwork: Wallet connected and already on the target chain ${targetChainId}.`
      );
      return {
        connected: true,
        address: connectResult.address,
        chainId: connectResult.chainId,
        switchedNetwork: false,
      };
    }
  } else if (connectResult.error) {
    // Initial connection failed
    return { connected: false, error: connectResult.error, switchedNetwork: false };
  }

  // Fallback for unexpected scenarios (e.g., connected but no address/chainId from initial connect)
  return {
    connected: false,
    error: 'Wallet connection attempt resulted in an unexpected state.',
    switchedNetwork: false,
  };
}

/**
 * Disconnects the currently connected wallet.
 */
export async function disconnectEvmWallet(
  walletImplementation: WagmiWalletImplementation
): Promise<{ disconnected: boolean; error?: string }> {
  return walletImplementation.disconnect();
}

/**
 * Gets the current wallet connection status.
 */
export function getEvmWalletConnectionStatus(walletImplementation: WagmiWalletImplementation): {
  isConnected: boolean;
  address?: string;
  chainId?: string;
} {
  const status = walletImplementation.getWalletConnectionStatus();
  return {
    isConnected: status.isConnected,
    address: status.address,
    chainId: status.chainId?.toString(), // Ensure string format for interface
  };
}

/**
 * Subscribes to wallet connection changes.
 */
export function onEvmWalletConnectionChange(
  walletImplementation: WagmiWalletImplementation,
  callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
): () => void {
  return walletImplementation.onWalletConnectionChange(callback);
}
