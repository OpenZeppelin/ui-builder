/**
 * Private Stellar wallet implementation for Stellar wallet connection
 *
 * This file contains the internal implementation of StellarWalletsKit for wallet connection.
 * It's encapsulated within the Stellar adapter and not exposed to the rest of the application.
 */
import {
  allowAllModules,
  ISupportedWallet,
  StellarWalletsKit,
  WalletNetwork,
} from '@creit.tech/stellar-wallets-kit';

import type { Connector, StellarNetworkConfig, UiKitConfiguration } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { StellarConnectionStatusListener, StellarWalletConnectionStatus } from '../types';

const LOG_SYSTEM = 'StellarWalletImplementation';

/**
 * Class responsible for encapsulating StellarWalletsKit logic for wallet interactions.
 * This class should not be used directly by UI components. The StellarAdapter
 * exposes a standardized interface for wallet operations.
 * It manages StellarWalletsKit instances and provides methods for wallet actions.
 */
export class WalletsKitImplementation {
  private defaultInstanceKit: StellarWalletsKit | null = null;
  private activeStellarKit: StellarWalletsKit | null = null; // To be set by StellarUiKitManager
  private unsubscribeFromStatusChanges?: () => void;
  private initialized: boolean = false;
  private networkConfig: StellarNetworkConfig | null = null;

  // Internal state tracking for connection status
  private currentAddress: string | null = null;
  private currentWalletId: string | null = null;
  private connectionStatusListeners = new Set<StellarConnectionStatusListener>();

  /**
   * Constructs the StellarWalletImplementation.
   * Configuration for StellarWalletsKit is deferred until actually needed or set externally.
   * @param networkConfig - Stellar network configuration
   * @param initialUiKitConfig - Optional initial UI kit configuration, primarily for logging the anticipated kit.
   */
  constructor(networkConfig?: StellarNetworkConfig, initialUiKitConfig?: UiKitConfiguration) {
    this.networkConfig = networkConfig || null;
    logger.info(
      LOG_SYSTEM,
      'Constructor called. Initial anticipated kitName:',
      initialUiKitConfig?.kitName,
      'Network:',
      networkConfig?.name
    );
    this.initialized = true;
    logger.info(
      LOG_SYSTEM,
      'StellarWalletImplementation instance initialized (StellarWalletsKit config creation deferred).'
    );
    // No kit created here by default anymore.
  }

  /**
   * Sets the network configuration for the wallet implementation
   * @param config - The Stellar network configuration
   */
  public setNetworkConfig(config: StellarNetworkConfig): void {
    logger.info(LOG_SYSTEM, 'Network config updated:', config.name);
    this.networkConfig = config;

    // If we have active kits, they might need to be recreated with new network
    // For now, just log - the kit manager will handle reconfiguration
    if (this.activeStellarKit || this.defaultInstanceKit) {
      logger.info(LOG_SYSTEM, 'Active kits detected - may need reconfiguration for new network');
    }
  }

  /**
   * Sets the externally determined, currently active StellarWalletsKit instance.
   * This is typically called by StellarUiKitManager after it has resolved the appropriate
   * kit for the selected UI kit mode.
   * @param kit - The StellarWalletsKit object to set as active, or null to clear it.
   */
  public setActiveStellarKit(kit: StellarWalletsKit | null): void {
    logger.info(
      LOG_SYSTEM,
      'setActiveStellarKit called with kit:',
      kit ? 'Valid StellarWalletsKit' : 'Null'
    );
    this.activeStellarKit = kit;

    // If there was an existing direct subscription, it might need to be updated
    if (this.unsubscribeFromStatusChanges) {
      logger.info(LOG_SYSTEM, 'Re-establishing connection status monitoring with new kit');
      // The connection status will be managed internally
    }
  }

  /**
   * Creates a default StellarWalletsKit instance when no active kit is available.
   * This ensures wallet functionality works even without explicit UI kit configuration.
   * @returns A default StellarWalletsKit instance
   */
  private createDefaultKit(): StellarWalletsKit {
    logger.info(LOG_SYSTEM, 'Creating default StellarWalletsKit instance');

    const network = this.getWalletNetwork();
    const kit = new StellarWalletsKit({
      network,
      selectedWalletId: undefined,
      modules: allowAllModules(),
    });

    logger.info(LOG_SYSTEM, 'Default StellarWalletsKit instance created');
    return kit;
  }

  /**
   * Gets the appropriate WalletNetwork enum value based on network configuration
   */
  private getWalletNetwork(): WalletNetwork {
    if (!this.networkConfig) {
      logger.warn(LOG_SYSTEM, 'No network config available, defaulting to TESTNET');
      return WalletNetwork.TESTNET;
    }
    return this.networkConfig.type === 'mainnet' ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET;
  }

  /**
   * Gets the kit to use for operations (active or default)
   */
  private getKitToUse(): StellarWalletsKit {
    const kit =
      this.activeStellarKit ||
      this.defaultInstanceKit ||
      (this.defaultInstanceKit = this.createDefaultKit());
    return kit;
  }

  /**
   * Gets available wallet connectors from StellarWalletsKit
   * @returns Promise resolving to array of available connectors
   */
  public async getAvailableConnectors(): Promise<Connector[]> {
    if (!this.initialized) {
      logger.warn(LOG_SYSTEM, 'getAvailableConnectors called before initialization');
      return [];
    }

    try {
      const kit = this.getKitToUse();
      const wallets = await kit.getSupportedWallets();

      const connectors: Connector[] = wallets.map((wallet: ISupportedWallet) => ({
        id: wallet.id,
        name: wallet.name,
        icon: wallet.icon,
        installed: wallet.isAvailable,
        type: (wallet.type as string) || 'browser',
      }));

      logger.info(LOG_SYSTEM, `Found ${connectors.length} available wallet connectors`);
      return connectors;
    } catch (error) {
      logger.error(LOG_SYSTEM, 'Failed to get available connectors:', error);
      return [];
    }
  }

  /**
   * Connects to a wallet using the specified connector ID
   * @param connectorId - The ID of the wallet connector to use
   * @returns Promise resolving to connection result
   */
  public async connect(connectorId: string): Promise<{
    connected: boolean;
    address?: string;
    chainId?: string;
    error?: string;
  }> {
    if (!this.initialized) {
      return { connected: false, error: 'Wallet implementation not initialized' };
    }

    try {
      const prevStatus = this.getWalletConnectionStatus();
      const kit = this.getKitToUse();

      logger.info(LOG_SYSTEM, `Attempting to connect to wallet: ${connectorId}`);

      // Set the selected wallet
      kit.setWallet(connectorId);

      // Get the address from the wallet
      const result = await kit.getAddress();

      if (result.address) {
        this.currentAddress = result.address;
        this.currentWalletId = connectorId;

        // Notify listeners of the connection change
        const newStatus = this.getWalletConnectionStatus();
        this.notifyConnectionListeners(newStatus, prevStatus);

        logger.info(
          LOG_SYSTEM,
          `Successfully connected to wallet: ${connectorId}, address: ${result.address}`
        );

        return {
          connected: true,
          address: result.address,
          chainId: this.networkConfig?.id,
        };
      } else {
        return {
          connected: false,
          error: 'Failed to get address from wallet',
        };
      }
    } catch (error) {
      logger.error(LOG_SYSTEM, `Failed to connect to wallet ${connectorId}:`, error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Disconnects from the currently connected wallet
   * @returns Promise resolving to disconnection result
   */
  public async disconnect(): Promise<{ disconnected: boolean; error?: string }> {
    if (!this.initialized) {
      return { disconnected: false, error: 'Wallet implementation not initialized' };
    }

    try {
      const prevStatus = this.getWalletConnectionStatus();

      logger.info(LOG_SYSTEM, 'Disconnecting wallet');

      // Clear the current connection state
      this.currentAddress = null;
      this.currentWalletId = null;

      // Notify listeners of the disconnection
      const newStatus = this.getWalletConnectionStatus();
      this.notifyConnectionListeners(newStatus, prevStatus);

      // For Stellar Wallets Kit, we just clear our internal state
      // The kit doesn't have a specific disconnect method

      logger.info(LOG_SYSTEM, 'Successfully disconnected wallet');
      return { disconnected: true };
    } catch (error) {
      logger.error(LOG_SYSTEM, 'Failed to disconnect wallet:', error);
      return {
        disconnected: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets the current wallet connection status
   * @returns The current connection status
   */
  public getWalletConnectionStatus(): StellarWalletConnectionStatus {
    const isConnected = this.currentAddress !== null;
    const chainId = this.networkConfig?.id || 'stellar-testnet';

    return {
      isConnected,
      isConnecting: false, // We don't track intermediate connecting state yet
      isDisconnected: !isConnected,
      isReconnecting: false,
      status: isConnected ? 'connected' : 'disconnected',
      address: this.currentAddress || undefined,
      walletId: this.currentWalletId || undefined,
      chainId,
    };
  }

  /**
   * Subscribes to wallet connection status changes
   * @param callback - Function to call when connection status changes
   * @returns A function to unsubscribe from the changes
   */
  public onWalletConnectionChange(callback: StellarConnectionStatusListener): () => void {
    if (!this.initialized) {
      logger.warn(LOG_SYSTEM, 'onWalletConnectionChange called before initialization. No-op.');
      return () => {};
    }

    this.connectionStatusListeners.add(callback);
    logger.info(LOG_SYSTEM, 'Connection status listener added');

    // Return unsubscribe function
    return () => {
      this.connectionStatusListeners.delete(callback);
      logger.debug(LOG_SYSTEM, 'Connection status listener removed');
    };
  }

  /**
   * Manually updates the cached connection address and wallet ID
   * This is used when the connection status is determined externally
   * @param address - The wallet address or null
   * @param walletId - The wallet ID or null
   */
  public updateConnectionStatus(address: string | null, walletId?: string | null): void {
    const prevStatus = this.getWalletConnectionStatus();

    this.currentAddress = address;
    this.currentWalletId = walletId ?? null;

    const newStatus = this.getWalletConnectionStatus();
    this.notifyConnectionListeners(newStatus, prevStatus);
  }

  /**
   * Gets the active StellarWalletsKit instance for advanced operations
   * @returns The active kit or null if not available
   */
  public getActiveKit(): StellarWalletsKit | null {
    return this.activeStellarKit || this.defaultInstanceKit;
  }

  /**
   * Signs a transaction using the connected wallet
   * @param xdr - The transaction XDR to sign
   * @param address - The account address
   * @returns Promise resolving to signed transaction
   */
  public async signTransaction(xdr: string, address: string): Promise<{ signedTxXdr: string }> {
    if (!this.initialized) {
      throw new Error('Wallet implementation not initialized');
    }

    const kit = this.getKitToUse();
    const networkPassphrase = this.getWalletNetwork();

    logger.info(LOG_SYSTEM, 'Signing transaction with wallet');

    return await kit.signTransaction(xdr, {
      address,
      networkPassphrase,
    });
  }

  /**
   * Notifies all connection listeners of status changes
   */
  private notifyConnectionListeners(
    currentStatus: StellarWalletConnectionStatus,
    previousStatus: StellarWalletConnectionStatus
  ): void {
    this.connectionStatusListeners.forEach((listener) => {
      try {
        listener(currentStatus, previousStatus);
      } catch (error) {
        logger.error(LOG_SYSTEM, 'Error in connection status listener:', String(error));
      }
    });
  }

  /**
   * Cleanup resources when implementation is no longer needed
   */
  public cleanup(): void {
    if (this.unsubscribeFromStatusChanges) {
      this.unsubscribeFromStatusChanges();
      this.unsubscribeFromStatusChanges = undefined;
    }
    this.connectionStatusListeners.clear();
    logger.info(LOG_SYSTEM, 'Cleanup completed');
  }
}
