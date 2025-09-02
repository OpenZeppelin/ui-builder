import {
  allowAllModules,
  ISupportedWallet,
  StellarWalletsKit,
  WalletNetwork,
} from '@creit.tech/stellar-wallets-kit';

import type { Connector } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { stellarUiKitManager } from './stellar-wallets-kit';

// Singleton wallet kit instance
let walletKit: StellarWalletsKit | null = null;
let currentAddress: string | null = null;
let currentWalletId: string | null = null;

/**
 * Get or create the wallet kit instance
 */
function getWalletKit(): StellarWalletsKit {
  if (!walletKit) {
    const managerState = stellarUiKitManager.getState();

    if (managerState.stellarKitProvider) {
      walletKit = managerState.stellarKitProvider;
    } else {
      // Create a default instance if the manager hasn't been configured yet
      const network =
        managerState.networkConfig?.type === 'mainnet'
          ? WalletNetwork.PUBLIC
          : WalletNetwork.TESTNET;

      walletKit = new StellarWalletsKit({
        network,
        selectedWalletId: undefined,
        modules: allowAllModules(),
      });
    }
  }

  return walletKit;
}

/**
 * Indicates if this adapter supports wallet connection
 * @returns Whether wallet connection is supported by this adapter
 */
export function supportsStellarWalletConnection(): boolean {
  return true;
}

/**
 * Get available Stellar wallet connectors
 */
export async function getStellarAvailableConnectors(): Promise<Connector[]> {
  const kit = getWalletKit();
  const wallets = await kit.getSupportedWallets();

  return wallets.map((wallet: ISupportedWallet) => ({
    id: wallet.id,
    name: wallet.name,
    icon: wallet.icon,
    installed: wallet.isAvailable,
    type: (wallet.type as string) || 'browser',
  }));
}

/**
 * Connect to a Stellar wallet
 * @param connectorId - The ID of the wallet to connect to
 */
export async function connectStellarWallet(
  connectorId: string
): Promise<{ connected: boolean; address?: string; error?: string }> {
  try {
    const kit = getWalletKit();

    // Set the selected wallet
    kit.setWallet(connectorId);

    // Get the address from the wallet
    const result = await kit.getAddress();

    if (result.address) {
      currentAddress = result.address;
      currentWalletId = connectorId;
      return {
        connected: true,
        address: result.address,
      };
    } else {
      return {
        connected: false,
        error: 'Failed to get address from wallet',
      };
    }
  } catch (error) {
    logger.error('Failed to connect Stellar wallet:', String(error));
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Disconnect from the current Stellar wallet
 */
export async function disconnectStellarWallet(): Promise<{
  disconnected: boolean;
  error?: string;
}> {
  try {
    // Clear the current connection state
    currentAddress = null;
    currentWalletId = null;

    // For Stellar Wallets Kit, we just clear our internal state
    // The kit doesn't have a specific disconnect method
    // Setting to empty string causes an error

    return { disconnected: true };
  } catch (error) {
    logger.error('Failed to disconnect Stellar wallet:', String(error));
    return {
      disconnected: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get the current wallet connection status
 * @inheritdoc
 */
export function getStellarWalletConnectionStatus(): {
  isConnected: boolean;
  address?: string;
  chainId?: string;
  walletId?: string;
} {
  const managerState = stellarUiKitManager.getState();
  const chainId = managerState.networkConfig?.id || 'stellar-testnet';

  return {
    isConnected: currentAddress !== null,
    address: currentAddress || undefined,
    chainId,
    walletId: currentWalletId || undefined,
  };
}

/**
 * Update the cached Stellar wallet connection state.
 * Used by provider code that derives the address directly from the kit.
 */
export function setStellarConnectedAddress(address: string | null, walletId?: string | null): void {
  currentAddress = address;
  currentWalletId = walletId ?? null;
}

/**
 * Sign a transaction using the connected wallet
 * @internal
 */
export async function signTransaction(
  xdr: string,
  address: string
): Promise<{ signedTxXdr: string }> {
  const kit = getWalletKit();
  const managerState = stellarUiKitManager.getState();

  // Determine network passphrase based on network config
  const networkPassphrase =
    managerState.networkConfig?.type === 'mainnet' ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET;

  return await kit.signTransaction(xdr, {
    address,
    networkPassphrase,
  });
}
