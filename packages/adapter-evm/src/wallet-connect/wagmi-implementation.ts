/**
 * Private Wagmi implementation for EVM wallet connection
 *
 * This file contains the internal implementation of Wagmi and Viem for wallet connection.
 * It's encapsulated within the EVM adapter and not exposed to the rest of the application.
 */
import { injected, metaMask, safe, walletConnect } from '@wagmi/connectors';
import {
  type Config,
  type GetAccountReturnType,
  connect,
  createConfig,
  disconnect,
  getAccount,
  getWalletClient as getWagmiWalletClient,
  watchAccount,
} from '@wagmi/core';
import { type WalletClient, http } from 'viem';
import { base, mainnet, optimism, sepolia } from 'viem/chains';

import { type Connector } from '@openzeppelin/transaction-form-types/adapters';

// TODO: Make chains configurable, potentially passed from adapter instantiation
const supportedChains = [mainnet, base, optimism, sepolia] as const; // Use 'as const' for stricter typing

// Get WalletConnect Project ID from environment variables
const WALLETCONNECT_PROJECT_ID = import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID;

if (!WALLETCONNECT_PROJECT_ID) {
  console.error(
    'WagmiWalletImplementation',
    'WalletConnect Project ID is not set. Please provide a valid ID via VITE_WALLETCONNECT_PROJECT_ID environment variable.'
  );
}

/**
 * Class responsible for encapsulating Wagmi core logic for wallet interactions.
 * This class should not be used directly by UI components. The EvmAdapter
 * exposes a standardized interface.
 */
export class WagmiWalletImplementation {
  private config: Config;
  private unsubscribe?: ReturnType<typeof watchAccount>;

  constructor() {
    this.config = createConfig({
      chains: supportedChains,
      connectors: [
        injected(),
        walletConnect({ projectId: WALLETCONNECT_PROJECT_ID }),
        metaMask(), // Recommended to include MetaMask explicitly
        safe(), // For Safe{Wallet} users
      ],
      transports: supportedChains.reduce(
        (acc, chain) => {
          acc[chain.id] = http(); // Use http transport for all supported chains
          return acc;
        },
        {} as Record<number, ReturnType<typeof http>> // Type assertion for accumulator
      ),
      // TODO: Add storage option for persistence? e.g., createStorage({ storage: window.localStorage })
    });
  }

  /**
   * Retrieves the current Wagmi configuration.
   * Used by WalletConnectionProvider to initialize WagmiProvider.
   */
  public getConfig(): Config {
    return this.config;
  }

  /**
   * Gets the Viem Wallet Client instance for the currently connected account and chain.
   * Returns null if not connected.
   *
   * @returns A promise resolving to the Viem WalletClient or null.
   */
  public async getWalletClient(): Promise<WalletClient | null> {
    const accountStatus = this.getWalletConnectionStatus();
    if (!accountStatus.isConnected || !accountStatus.chainId || !accountStatus.address) {
      return null;
    }
    return getWagmiWalletClient(this.config, {
      chainId: accountStatus.chainId,
      account: accountStatus.address,
    });
  }

  /**
   * Gets the list of available wallet connectors configured in Wagmi.
   * @returns A promise resolving to an array of available connectors.
   */
  public async getAvailableConnectors(): Promise<Connector[]> {
    const connectors = this.config.connectors;
    return connectors.map((conn) => ({
      id: conn.uid,
      name: conn.name,
    }));
  }

  /**
   * Initiates the connection process for a specific connector.
   * @param connectorId The ID or name of the connector to use.
   * @returns Connection result object.
   */
  public async connect(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    try {
      const connectors = this.config.connectors;

      let connector = connectors.find((c) => c.uid === connectorId);

      if (!connector) {
        connector = connectors.find((c) => c.name.toLowerCase() === connectorId.toLowerCase());
      }

      if (!connector) {
        const availableConnectorNames = connectors.map((c) => c.name).join(', ');
        console.error(
          'WagmiWalletImplementation',
          `Wallet connector "${connectorId}" not found. Available connectors: ${availableConnectorNames}`
        );
        return {
          connected: false,
          error: `Wallet connector "${connectorId}" not found. Available connectors: ${availableConnectorNames}`,
        };
      }
      const result = await connect(this.config, { connector });
      return { connected: true, address: result.accounts[0] };
    } catch (error: unknown) {
      console.error('WagmiWalletImplementation', 'Wagmi connect error:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown connection error',
      };
    }
  }

  /**
   * Disconnects the currently connected wallet.
   * @returns Disconnection result object.
   */
  public async disconnect(): Promise<{ disconnected: boolean; error?: string }> {
    try {
      await disconnect(this.config);
      return { disconnected: true };
    } catch (error: unknown) {
      console.error('WagmiWalletImplementation', 'Wagmi disconnect error:', error);
      return {
        disconnected: false,
        error: error instanceof Error ? error.message : 'Unknown disconnection error',
      };
    }
  }

  /**
   * Gets the current connection status and account details.
   * @returns Account status object.
   */
  public getWalletConnectionStatus(): GetAccountReturnType {
    return getAccount(this.config);
  }

  /**
   * Subscribes to account connection changes.
   * @param callback Function to call when connection status changes.
   * @returns Cleanup function to unsubscribe.
   */
  public onWalletConnectionChange(
    callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
  ): () => void {
    this.unsubscribe?.();

    this.unsubscribe = watchAccount(this.config, {
      onChange: callback,
    });

    return this.unsubscribe;
  }

  /**
   * Cleans up the account watcher when the instance is no longer needed.
   */
  public cleanup(): void {
    this.unsubscribe?.();
  }
}
