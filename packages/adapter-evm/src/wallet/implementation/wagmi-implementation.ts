/**
 * Private Wagmi implementation for EVM wallet connection
 *
 * This file contains the internal implementation of Wagmi and Viem for wallet connection.
 * It's encapsulated within the EVM adapter and not exposed to the rest of the application.
 */
import { injected, metaMask, safe, walletConnect } from '@wagmi/connectors';
import {
  connect,
  createConfig,
  disconnect,
  getAccount,
  getPublicClient as getWagmiCorePublicClient,
  getWalletClient as getWagmiWalletClient,
  switchChain,
  watchAccount,
  type Config,
  type GetAccountReturnType,
  type CreateConnectorFn as WagmiCreateConnectorFn,
} from '@wagmi/core';
import { http, PublicClient, WalletClient, type Chain } from 'viem';

import type { Connector, UiKitConfiguration } from '@openzeppelin/ui-builder-types';
import { appConfigService, logger } from '@openzeppelin/ui-builder-utils';

import { getUserRpcUrl } from '../../configuration/rpc';
import { evmNetworks } from '../../networks';
import { getWagmiConfigForRainbowKit } from '../rainbowkit';
import { type WagmiConfigChains } from '../types';

const LOG_SYSTEM = 'WagmiWalletImplementation'; // Define LOG_SYSTEM here

/**
 * Generates the supported chains for Wagmi from the EVM network configurations.
 * Only includes networks that have a viemChain property (ensuring wagmi compatibility).
 * This ensures that wagmi only supports networks that are defined in mainnet.ts and testnet.ts.
 */
const getSupportedChainsFromNetworks = (): readonly Chain[] => {
  const chains = evmNetworks
    .filter((network) => network.viemChain) // Only include networks with viemChain
    .map((network) => network.viemChain!)
    .filter((chain, index, self) => self.findIndex((c) => c.id === chain.id) === index); // Remove duplicates

  logger.info(
    LOG_SYSTEM,
    `Generated supported chains from network configurations: ${chains.length} chains`,
    chains.map((c) => ({ id: c.id, name: c.name }))
  );

  return chains;
};

/**
 * Generates the mapping from Viem chain IDs to application network IDs.
 * This mapping is auto-generated from the EVM network configurations.
 */
const getChainIdToNetworkIdMapping = (): Record<number, string> => {
  const mapping = evmNetworks
    .filter((network) => network.viemChain) // Only include networks with viemChain
    .reduce(
      (acc, network) => {
        acc[network.chainId] = network.id;
        return acc;
      },
      {} as Record<number, string>
    );

  logger.info(
    LOG_SYSTEM,
    'Generated chain ID to network ID mapping from network configurations:',
    mapping
  );

  return mapping;
};

/**
 * The supported chains for Wagmi, dynamically generated from network configurations.
 * This ensures consistency between adapter networks and wagmi-supported networks.
 */
const defaultSupportedChains: readonly Chain[] = getSupportedChainsFromNetworks();

/**
 * Auto-generated mapping from Viem chain IDs to application network IDs.
 * This mapping is essential for AppConfigService to look up RPC URL overrides.
 * It's automatically synchronized with the networks defined in mainnet.ts and testnet.ts.
 */
const viemChainIdToAppNetworkId: Record<number, string> = getChainIdToNetworkIdMapping();

/**
 * Class responsible for encapsulating Wagmi core logic for wallet interactions.
 * This class should not be used directly by UI components. The EvmAdapter
 * exposes a standardized interface for wallet operations.
 * It manages Wagmi Config instances and provides methods for wallet actions.
 */
export class WagmiWalletImplementation {
  private defaultInstanceConfig: Config | null = null;
  private activeWagmiConfig: Config | null = null; // To be set by EvmUiKitManager
  private unsubscribe?: ReturnType<typeof watchAccount>;
  private initialized: boolean = false;
  private walletConnectProjectId?: string;

  /**
   * Constructs the WagmiWalletImplementation.
   * Configuration for Wagmi is deferred until actually needed or set externally.
   * @param walletConnectProjectIdFromAppConfig - Optional WalletConnect Project ID from global app configuration.
   * @param initialUiKitConfig - Optional initial UI kit configuration, primarily for logging the anticipated kit.
   */
  constructor(
    walletConnectProjectIdFromAppConfig?: string,
    initialUiKitConfig?: UiKitConfiguration
  ) {
    this.walletConnectProjectId = walletConnectProjectIdFromAppConfig;
    logger.info(
      LOG_SYSTEM,
      'Constructor called. Initial anticipated kitName:',
      initialUiKitConfig?.kitName
    );
    this.initialized = true;
    logger.info(
      LOG_SYSTEM,
      'WagmiWalletImplementation instance initialized (Wagmi config creation deferred).'
    );
    // No config created here by default anymore.
  }

  /**
   * Sets the externally determined, currently active WagmiConfig instance.
   * This is typically called by EvmUiKitManager after it has resolved the appropriate
   * config for the selected UI kit (e.g., RainbowKit's config or a default custom config).
   * @param config - The Wagmi Config object to set as active, or null to clear it.
   */
  public setActiveWagmiConfig(config: Config | null): void {
    logger.info(
      LOG_SYSTEM,
      'setActiveWagmiConfig called with config:',
      config ? 'Valid Config' : 'Null'
    );
    this.activeWagmiConfig = config;

    // If the activeWagmiConfig instance has changed and there was an existing direct subscription
    // via onWalletConnectionChange, that subscription was bound to the *previous* config instance.
    // It might now be stale or not receive updates reflecting the new config context.
    // Consumers relying on onWalletConnectionChange for live updates across fundamental config changes
    // (e.g., switching UI kits or major network group changes affecting the config instance)
    // may need to re-invoke onWalletConnectionChange to get a new subscription bound to the new config.
    // UI components should primarily rely on useWalletState and derived hooks for reactivity,
    // which will naturally update with the new adapter/config context.
    if (this.unsubscribe) {
      logger.warn(
        LOG_SYSTEM,
        'setActiveWagmiConfig: Active WagmiConfig instance has changed. Existing direct watchAccount subscription (via onWalletConnectionChange) may be stale and operating on an old config instance.'
      );
    }
  }

  /**
   * Creates a default WagmiConfig instance on demand.
   * This configuration includes standard connectors (injected, MetaMask, Safe)
   * and WalletConnect if a project ID is available.
   * Used as a fallback or for 'custom' UI kit mode.
   * @returns A Wagmi Config object.
   */
  private createDefaultConfig(): Config {
    const baseConnectors: WagmiCreateConnectorFn[] = [injected(), metaMask(), safe()];
    if (this.walletConnectProjectId?.trim()) {
      baseConnectors.push(walletConnect({ projectId: this.walletConnectProjectId }));
      logger.info(LOG_SYSTEM, 'WalletConnect connector added to DEFAULT config.');
    } else {
      logger.warn(
        LOG_SYSTEM,
        'WalletConnect Project ID not provided; WC connector unavailable for DEFAULT config.'
      );
    }
    const transportsConfig = defaultSupportedChains.reduce(
      (acc, chainDefinition) => {
        let rpcUrlToUse: string | undefined = chainDefinition.rpcUrls.default?.http?.[0];
        const appNetworkIdString = viemChainIdToAppNetworkId[chainDefinition.id];
        if (appNetworkIdString) {
          // Prefer user-configured RPC from generic service
          let httpRpcOverride: string | undefined = getUserRpcUrl(appNetworkIdString);
          // Fallback to AppConfigService override if no user config
          if (!httpRpcOverride) {
            const rpcOverrideSetting = appConfigService.getRpcEndpointOverride(appNetworkIdString);
            if (typeof rpcOverrideSetting === 'string') {
              httpRpcOverride = rpcOverrideSetting;
            } else if (typeof rpcOverrideSetting === 'object') {
              // Handle both RpcEndpointConfig and UserRpcProviderConfig
              if ('http' in rpcOverrideSetting && rpcOverrideSetting.http) {
                httpRpcOverride = rpcOverrideSetting.http;
              } else if ('url' in rpcOverrideSetting && rpcOverrideSetting.url) {
                httpRpcOverride = rpcOverrideSetting.url;
              }
            }
          }
          if (httpRpcOverride) {
            logger.info(
              LOG_SYSTEM,
              `Using overridden RPC for chain ${chainDefinition.name} (default config): ${httpRpcOverride}`
            );
            rpcUrlToUse = httpRpcOverride;
          }
        }
        acc[chainDefinition.id] = http(rpcUrlToUse);
        return acc;
      },
      {} as Record<number, ReturnType<typeof http>>
    );
    try {
      const defaultConfig = createConfig({
        chains: defaultSupportedChains as unknown as WagmiConfigChains,
        connectors: baseConnectors,
        transports: transportsConfig,
      });
      logger.info(LOG_SYSTEM, 'Default Wagmi config created successfully on demand.');
      return defaultConfig;
    } catch (error) {
      logger.error(LOG_SYSTEM, 'Error creating default Wagmi config on demand:', error);
      return createConfig({
        chains: [defaultSupportedChains[0]] as unknown as WagmiConfigChains,
        connectors: [injected()],
        transports: { [defaultSupportedChains[0].id]: http() },
      });
    }
  }

  /**
   * Wrapper function to convert AppConfigService RPC overrides to the format expected by RainbowKit.
   * @param networkId - The network ID to get RPC override for
   * @returns RPC configuration in the format expected by RainbowKit
   */
  private getRpcOverrideForRainbowKit(
    networkId: string
  ): string | { http?: string; ws?: string } | undefined {
    // Prefer user-configured RPC from generic service first
    const userRpcUrl = getUserRpcUrl(networkId);
    if (userRpcUrl) {
      return { http: userRpcUrl };
    }

    const rpcOverrideSetting = appConfigService.getRpcEndpointOverride(networkId);

    if (typeof rpcOverrideSetting === 'string') {
      return rpcOverrideSetting;
    } else if (typeof rpcOverrideSetting === 'object' && rpcOverrideSetting !== null) {
      // Check for UserRpcProviderConfig first
      if ('url' in rpcOverrideSetting && typeof rpcOverrideSetting.url === 'string') {
        // It's a UserRpcProviderConfig - convert url to http
        return {
          http: rpcOverrideSetting.url,
        };
      } else if ('http' in rpcOverrideSetting || 'ws' in rpcOverrideSetting) {
        // It's an RpcEndpointConfig
        const config = rpcOverrideSetting as { http?: string; ws?: string };
        return {
          http: config.http,
          ws: config.ws,
        };
      }
    }

    return undefined;
  }

  /**
   * Retrieves or creates the WagmiConfig specifically for RainbowKit.
   * This delegates to `getWagmiConfigForRainbowKit` service which handles caching
   * and uses RainbowKit's `getDefaultConfig`.
   * @param currentAdapterUiKitConfig - The fully resolved UI kit configuration for the adapter.
   * @returns A Promise resolving to the RainbowKit-specific Wagmi Config object, or null if creation fails or not RainbowKit.
   */
  public async getConfigForRainbowKit(
    currentAdapterUiKitConfig: UiKitConfiguration
  ): Promise<Config | null> {
    if (!this.initialized) {
      logger.error(
        LOG_SYSTEM,
        'getConfigForRainbowKit called before implementation initialization.'
      );
      return null;
    }
    if (currentAdapterUiKitConfig?.kitName !== 'rainbowkit') {
      logger.warn(
        LOG_SYSTEM,
        'getConfigForRainbowKit called, but kitName is not rainbowkit. Returning null.'
      );
      return null;
    }
    logger.info(
      LOG_SYSTEM,
      'getConfigForRainbowKit: Kit is RainbowKit. Proceeding to create/get config. CurrentAdapterUiKitConfig:',
      currentAdapterUiKitConfig
    );
    const rainbowKitWagmiConfig = await getWagmiConfigForRainbowKit(
      currentAdapterUiKitConfig,
      defaultSupportedChains as WagmiConfigChains,
      viemChainIdToAppNetworkId,
      this.getRpcOverrideForRainbowKit.bind(this)
    );
    if (rainbowKitWagmiConfig) {
      logger.info(LOG_SYSTEM, 'Returning RainbowKit-specific Wagmi config for provider.');
      return rainbowKitWagmiConfig;
    }
    logger.warn(LOG_SYSTEM, 'RainbowKit specific Wagmi config creation failed.');
    return null;
  }

  /**
   * Determines and returns the WagmiConfig to be used by EvmUiKitManager during its configuration process.
   * If RainbowKit is specified in the passed uiKitConfig, it attempts to get its specific config.
   * Otherwise, it falls back to creating/returning a default instance config.
   * @param uiKitConfig - The fully resolved UiKitConfiguration that the manager is currently processing.
   * @returns A Promise resolving to the determined Wagmi Config object.
   */
  public async getActiveConfigForManager(uiKitConfig: UiKitConfiguration): Promise<Config> {
    if (!this.initialized) {
      logger.error(
        LOG_SYSTEM,
        'getActiveConfigForManager called before initialization! Creating fallback.'
      );
      return createConfig({
        chains: [defaultSupportedChains[0]] as unknown as WagmiConfigChains,
        transports: { [defaultSupportedChains[0].id]: http() },
      });
    }

    if (uiKitConfig?.kitName === 'rainbowkit') {
      const rkConfig = await this.getConfigForRainbowKit(uiKitConfig);
      if (rkConfig) return rkConfig;
      logger.warn(
        LOG_SYSTEM,
        'getActiveConfigForManager: RainbowKit config failed, falling back to default.'
      );
    }

    // Always rebuild default config to reflect latest RPC overrides/user settings
    this.defaultInstanceConfig = this.createDefaultConfig();
    return this.defaultInstanceConfig;
  }

  /**
   * @deprecated Prefer using methods that rely on the externally set `activeWagmiConfig`
   * or methods that determine contextually appropriate config like `getActiveConfigForManager` (for manager use)
   * or ensure `activeWagmiConfig` is set before calling wagmi actions.
   * This method returns the internally cached default config or the active one if set.
   * @returns The current default or active Wagmi Config object.
   */
  public getConfig(): Config {
    logger.warn(
      LOG_SYSTEM,
      'getConfig() is deprecated. Internal calls should use activeWagmiConfig if set, or ensure default is created.'
    );
    if (this.activeWagmiConfig) return this.activeWagmiConfig;
    if (!this.defaultInstanceConfig) {
      this.defaultInstanceConfig = this.createDefaultConfig();
    }
    return this.defaultInstanceConfig!;
  }

  /**
   * Gets the current wallet connection status (isConnected, address, chainId, etc.).
   * This is a synchronous operation and uses the `activeWagmiConfig` if set by `EvmUiKitManager`,
   * otherwise falls back to the default instance config (created on demand).
   * For UI reactivity to connection changes, `onWalletConnectionChange` or derived hooks are preferred.
   * @returns The current account status from Wagmi.
   */
  public getWalletConnectionStatus(): GetAccountReturnType {
    logger.debug(LOG_SYSTEM, 'getWalletConnectionStatus called.');
    const configToUse =
      this.activeWagmiConfig ||
      this.defaultInstanceConfig ||
      (this.defaultInstanceConfig = this.createDefaultConfig());
    if (!configToUse) {
      logger.error(LOG_SYSTEM, 'No config available for getWalletConnectionStatus!');
      // Return a valid GetAccountReturnType for a disconnected state
      return {
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
        isReconnecting: false,
        status: 'disconnected',
        address: undefined,
        addresses: undefined,
        chainId: undefined,
        chain: undefined,
        connector: undefined,
      };
    }
    return getAccount(configToUse);
  }

  /**
   * Subscribes to account and connection status changes from Wagmi.
   * The subscription is bound to the `activeWagmiConfig` if available at the time of call,
   * otherwise to the default instance config. If `activeWagmiConfig` changes later,
   * this specific subscription might become stale (see warning in `setActiveWagmiConfig`).
   * @param callback - Function to call when connection status changes.
   * @returns A function to unsubscribe from the changes.
   */
  public onWalletConnectionChange(
    callback: (status: GetAccountReturnType, prevStatus: GetAccountReturnType) => void
  ): () => void {
    if (!this.initialized) {
      logger.warn(LOG_SYSTEM, 'onWalletConnectionChange called before initialization. No-op.');
      return () => {};
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      logger.debug(LOG_SYSTEM, 'Previous watchAccount unsubscribed.');
    }
    const configToUse =
      this.activeWagmiConfig ||
      this.defaultInstanceConfig ||
      (this.defaultInstanceConfig = this.createDefaultConfig());
    if (!configToUse) {
      logger.error(
        LOG_SYSTEM,
        'No config available for onWalletConnectionChange! Subscription not set.'
      );
      return () => {};
    }
    this.unsubscribe = watchAccount(configToUse, { onChange: callback });
    logger.info(
      LOG_SYSTEM,
      'watchAccount subscription established/re-established using config:',
      configToUse === this.activeWagmiConfig ? 'activeExternal' : 'defaultInstance'
    );
    return this.unsubscribe;
  }

  // Methods that perform actions should use the most current activeWagmiConfig
  /**
   * Gets the Viem Wallet Client for the currently connected account and chain, using the active Wagmi config.
   * @returns A Promise resolving to the Viem WalletClient or null if not connected or config not active.
   */
  public async getWalletClient(): Promise<WalletClient | null> {
    if (!this.initialized || !this.activeWagmiConfig) {
      logger.warn(
        LOG_SYSTEM,
        'getWalletClient: Not initialized or no activeWagmiConfig. Returning null.'
      );
      return null;
    }
    const accountStatus = getAccount(this.activeWagmiConfig);
    if (!accountStatus.isConnected || !accountStatus.chainId || !accountStatus.address) return null;
    return getWagmiWalletClient(this.activeWagmiConfig, {
      chainId: accountStatus.chainId,
      account: accountStatus.address,
    });
  }

  /**
   * Gets the Viem Public Client for the currently connected chain, using the active Wagmi config.
   * Note: Direct public client retrieval from WagmiConfig is complex in v2. This is a placeholder.
   * Prefer using Wagmi actions like readContract, simulateContract which use the public client internally.
   * @returns A Promise resolving to the Viem PublicClient or null.
   */
  public async getPublicClient(): Promise<PublicClient | null> {
    if (!this.initialized || !this.activeWagmiConfig) {
      logger.warn(
        LOG_SYSTEM,
        'getPublicClient: Not initialized or no activeWagmiConfig. Returning null.'
      );
      return null;
    }

    const accountStatus = getAccount(this.activeWagmiConfig); // Get current chain from the active config
    const currentChainId = accountStatus.chainId;

    if (!currentChainId) {
      logger.warn(
        LOG_SYSTEM,
        'getPublicClient: No connected chainId available from accountStatus. Returning null.'
      );
      return null;
    }

    try {
      // Use the getPublicClient action from wagmi/core
      // It requires the config and optionally a chainId. If no chainId, it uses the config's primary/first chain.
      // It's better to be explicit with the current chainId.
      const publicClient = getWagmiCorePublicClient(this.activeWagmiConfig, {
        chainId: currentChainId,
      });
      if (publicClient) {
        logger.info(
          LOG_SYSTEM,
          `getPublicClient: Successfully retrieved public client for chainId ${currentChainId}.`
        );
        return publicClient;
      }
      logger.warn(
        LOG_SYSTEM,
        `getPublicClient: getWagmiCorePublicClient returned undefined/null for chainId ${currentChainId}.`
      );
      return null;
    } catch (error) {
      logger.error(LOG_SYSTEM, 'Error getting public client from wagmi/core:', error);
      return null;
    }
  }

  /**
   * Gets the list of available wallet connectors from the active Wagmi config.
   * @returns A Promise resolving to an array of available connectors.
   */
  public async getAvailableConnectors(): Promise<Connector[]> {
    if (!this.initialized || !this.activeWagmiConfig) return [];
    return this.activeWagmiConfig.connectors.map((co) => ({ id: co.uid, name: co.name }));
  }

  /**
   * Initiates the connection process for a specific connector using the active Wagmi config.
   * @param connectorId - The ID of the connector to use.
   * @returns A Promise with connection result including address and chainId if successful.
   */
  public async connect(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; chainId?: number; error?: string }> {
    if (!this.initialized || !this.activeWagmiConfig)
      throw new Error('Wallet not initialized or no active config');
    const connectorToUse = this.activeWagmiConfig.connectors.find(
      (cn) => cn.id === connectorId || cn.uid === connectorId
    );
    if (!connectorToUse) throw new Error(`Connector ${connectorId} not found`);
    const res = await connect(this.activeWagmiConfig, { connector: connectorToUse });
    return { connected: true, address: res.accounts[0], chainId: res.chainId };
  }

  /**
   * Disconnects the currently connected wallet using the active Wagmi config.
   * @returns A Promise with disconnection result.
   */
  public async disconnect(): Promise<{ disconnected: boolean; error?: string }> {
    if (!this.initialized || !this.activeWagmiConfig)
      return { disconnected: false, error: 'Wallet not initialized or no active config' };
    await disconnect(this.activeWagmiConfig);
    return { disconnected: true };
  }

  /**
   * Prompts the user to switch to the specified network using the active Wagmi config.
   * @param chainId - The target chain ID to switch to.
   * @returns A Promise that resolves if the switch is successful, or rejects with an error.
   */
  public async switchNetwork(chainId: number): Promise<void> {
    if (!this.initialized || !this.activeWagmiConfig)
      throw new Error('Wallet not initialized or no active config');
    await switchChain(this.activeWagmiConfig, { chainId });
  }

  // ... (rest of class, ensure all wagmi/core actions use this.activeWagmiConfig if available and appropriate)
}
