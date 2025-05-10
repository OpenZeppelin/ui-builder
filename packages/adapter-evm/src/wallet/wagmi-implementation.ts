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
  type CreateConnectorFn as WagmiCreateConnectorFn,
  connect,
  createConfig,
  disconnect,
  getAccount,
  getPublicClient as getWagmiPublicClient,
  getWalletClient as getWagmiWalletClient,
  switchChain,
  watchAccount,
} from '@wagmi/core';
import { PublicClient, WalletClient, http } from 'viem';
import { base, mainnet, optimism, polygon, sepolia } from 'viem/chains';

import { appConfigService, logger } from '@openzeppelin/transaction-form-renderer';
import type { Connector } from '@openzeppelin/transaction-form-types';

/**
 * Defines the default set of blockchain networks (from viem/chains) that Wagmi will be configured to support.
 * This list enables features like chain switching within Wagmi and dictates which chains' RPCs
 * can be potentially overridden via AppConfigService if a mapping exists in `viemChainIdToAppNetworkId`.
 * If you add a new chain here and want its RPC to be configurable, ensure a corresponding
 * entry is also added to `viemChainIdToAppNetworkId` below.
 */
const defaultSupportedChains = [mainnet, sepolia, polygon, optimism, base] as const;

/**
 * @internal
 * Helper map to bridge Viem's numeric chain IDs (from `defaultSupportedChains`) to
 * our application's string-based NetworkConfig IDs (e.g., "ethereum-mainnet").
 * This mapping is ESSENTIAL for `AppConfigService` to look up RPC URL overrides for the chains
 * configured in Wagmi's transports.
 *
 * !! IMPORTANT MAINTENANCE NOTE !!
 * If `defaultSupportedChains` is updated (e.g., a new chain is added or an existing one removed),
 * this map MUST be updated accordingly to ensure RPC overrides continue to work correctly for those chains.
 * The string value (e.g., 'ethereum-mainnet') must match the `id` field of the corresponding
 * full `EvmNetworkConfig` object defined in `packages/adapter-evm/src/networks/` AND the keys
 * used in `AppRuntimeConfig.rpcEndpoints` (set via .env or app.config.json).
 */
const viemChainIdToAppNetworkId: Record<number, string> = {
  [mainnet.id]: 'ethereum-mainnet',
  [sepolia.id]: 'ethereum-sepolia',
  [polygon.id]: 'polygon-mainnet',
  [optimism.id]: 'optimism-mainnet',
  [base.id]: 'base-mainnet',
  // Example if polygonAmoy (from viem/chains) were added to defaultSupportedChains:
  // [polygonAmoy.id]: 'polygon-amoy', // Assuming 'polygon-amoy' is your app's NetworkConfig.id
};

/**
 * Class responsible for encapsulating Wagmi core logic for wallet interactions.
 * This class should not be used directly by UI components. The EvmAdapter
 * exposes a standardized interface.
 */
export class WagmiWalletImplementation {
  private config: Config;
  private unsubscribe?: ReturnType<typeof watchAccount>;

  constructor(walletConnectProjectIdFromAppConfig?: string) {
    const logSystem = 'WagmiWalletImplementation';
    const baseConnectors: WagmiCreateConnectorFn[] = [injected(), metaMask(), safe()];

    if (walletConnectProjectIdFromAppConfig && walletConnectProjectIdFromAppConfig.trim() !== '') {
      baseConnectors.push(walletConnect({ projectId: walletConnectProjectIdFromAppConfig }));
      logger.info(logSystem, `WalletConnect connector initialized with Project ID.`);
    } else {
      logger.warn(
        logSystem,
        'WalletConnect Project ID not provided. WC connector will be unavailable.'
      );
    }

    const transportsConfig = defaultSupportedChains.reduce(
      (acc, chainDefinition) => {
        let rpcUrlToUse: string | undefined = chainDefinition.rpcUrls.default?.http?.[0];

        // Use the static module-level map
        const appNetworkIdString = viemChainIdToAppNetworkId[chainDefinition.id];

        if (appNetworkIdString) {
          const rpcOverrideSetting = appConfigService.getRpcEndpointOverride(appNetworkIdString);
          let httpRpcOverride: string | undefined;

          if (typeof rpcOverrideSetting === 'string') {
            httpRpcOverride = rpcOverrideSetting;
          } else if (typeof rpcOverrideSetting === 'object' && rpcOverrideSetting?.http) {
            httpRpcOverride = rpcOverrideSetting.http;
          }

          if (httpRpcOverride) {
            logger.info(
              logSystem,
              `Using overridden RPC for chain ${chainDefinition.name} (App Network ID: ${appNetworkIdString}): ${httpRpcOverride}`
            );
            rpcUrlToUse = httpRpcOverride;
          } else {
            logger.debug(
              logSystem,
              `No RPC override found for ${chainDefinition.name} (App Network ID: ${appNetworkIdString}). Using default from viem/chains: ${rpcUrlToUse}`
            );
          }
        } else {
          logger.debug(
            logSystem,
            `No app-specific Network ID mapping for Viem chain ${chainDefinition.name} (ID: ${chainDefinition.id}). Using its default RPC from viem/chains: ${rpcUrlToUse}`
          );
        }

        // If rpcUrlToUse is still undefined (e.g. chainDefinition had no default and no override), http() will use Viem's internal default or error.
        acc[chainDefinition.id] = http(rpcUrlToUse);
        return acc;
      },
      {} as Record<number, ReturnType<typeof http>>
    );

    this.config = createConfig({
      chains: defaultSupportedChains,
      connectors: baseConnectors,
      transports: transportsConfig,
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
   * Gets the Viem Public Client instance for the currently connected chain.
   *
   * @returns A promise resolving to the Viem PublicClient or null.
   */
  public getPublicClient(): PublicClient | null {
    const accountStatus = this.getWalletConnectionStatus();
    if (!accountStatus.chainId) {
      return null;
    }
    // Note: getPublicClient is synchronous in wagmi v2
    // Explicitly cast the return type. Addresses a TS error ("Two different types with this name exist...")
    // that can occur in pnpm monorepos where TypeScript might resolve the PublicClient type
    // from both the direct 'viem' import and the instance potentially used internally by '@wagmi/core'.
    // This cast asserts their compatibility.
    return getWagmiPublicClient(this.config, {
      chainId: accountStatus.chainId,
    }) as PublicClient;
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
   * @returns Connection result object including chainId if successful.
   */
  public async connect(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; chainId?: number; error?: string }> {
    try {
      const connectors = this.config.connectors;
      let connector = connectors.find((c) => c.uid === connectorId);
      if (!connector) {
        connector = connectors.find((c) => c.name.toLowerCase() === connectorId.toLowerCase());
      }
      if (!connector) {
        const availableConnectorNames = connectors.map((c) => c.name).join(', ');
        logger.error(
          'WagmiWalletImplementation',
          `Wallet connector "${connectorId}" not found. Available connectors: ${availableConnectorNames}`
        );
        return {
          connected: false,
          error: `Wallet connector "${connectorId}" not found. Available connectors: ${availableConnectorNames}`,
        };
      }
      const result = await connect(this.config, { connector });
      return { connected: true, address: result.accounts[0], chainId: result.chainId };
    } catch (error: unknown) {
      logger.error('WagmiWalletImplementation', 'Wagmi connect error:', error);
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
    } catch (error) {
      logger.error('WagmiWalletImplementation', 'Wagmi disconnect error:', error);
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
    callback: (status: GetAccountReturnType, prevStatus: GetAccountReturnType) => void
  ): () => void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.unsubscribe = watchAccount(this.config, {
      onChange: callback,
    });
    return this.unsubscribe;
  }

  /**
   * Prompts the user to switch to the specified network (chain).
   * @param chainId The target chain ID to switch to.
   * @returns A promise that resolves if the switch is successful, or rejects with an error.
   */
  public async switchNetwork(chainId: number): Promise<void> {
    await switchChain(this.config, { chainId });
  }
}
