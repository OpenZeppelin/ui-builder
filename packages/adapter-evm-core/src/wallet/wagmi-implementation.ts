/**
 * Core Wagmi implementation for EVM wallet connection
 *
 * This file contains the shared implementation of Wagmi and Viem for wallet connection.
 * It's designed to be used by both EVM and Polkadot adapters with full feature parity.
 *
 * Features:
 * - RPC override logic with user configuration support
 * - Dynamic RPC change listener for config invalidation
 * - Chain ID to network ID mapping
 * - Explicit connector setup (injected, metaMask, safe, walletConnect)
 * - Sophisticated config caching with invalidation
 * - UI kit configuration methods for RainbowKit integration
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
import { http, type Chain, type PublicClient, type WalletClient } from 'viem';

import type { Connector, UiKitConfiguration } from '@openzeppelin/ui-types';
import { appConfigService, logger } from '@openzeppelin/ui-utils';

import { getUserRpcUrl } from '../configuration';
import type { EvmWalletImplementation } from '../transaction/types';
import type { WagmiConfigChains, WagmiWalletConfig, WalletNetworkConfig } from './types';

/**
 * Generates the supported chains from network configurations.
 * Only includes networks that have a viemChain property (ensuring wagmi compatibility).
 */
function getSupportedChainsFromNetworks(
  networkConfigs: WalletNetworkConfig[],
  logSystem: string
): readonly Chain[] {
  const chains = networkConfigs
    .filter((network) => network.viemChain)
    .map((network) => network.viemChain!)
    .filter((chain, index, self) => self.findIndex((c) => c.id === chain.id) === index); // Remove duplicates

  logger.info(
    logSystem,
    `Generated supported chains from network configurations: ${chains.length} chains`,
    chains.map((c) => ({ id: c.id, name: c.name }))
  );

  return chains;
}

/**
 * Generates the mapping from Viem chain IDs to application network IDs.
 * This mapping is auto-generated from the network configurations.
 */
function getChainIdToNetworkIdMapping(
  networkConfigs: WalletNetworkConfig[],
  logSystem: string
): Record<number, string> {
  const mapping = networkConfigs
    .filter((network) => network.viemChain)
    .reduce(
      (acc, network) => {
        acc[network.chainId] = network.id;
        return acc;
      },
      {} as Record<number, string>
    );

  logger.info(
    logSystem,
    'Generated chain ID to network ID mapping from network configurations:',
    mapping
  );

  return mapping;
}

/**
 * Type for RainbowKit config retrieval function.
 * This allows adapters to provide their own RainbowKit config service.
 */
export type GetWagmiConfigForRainbowKitFn = (
  uiKitConfiguration: UiKitConfiguration,
  chains: WagmiConfigChains,
  chainIdToNetworkIdMap: Record<number, string>,
  getRpcOverride: (networkId: string) => string | { http?: string; ws?: string } | undefined
) => Promise<Config | null>;

/**
 * Class responsible for encapsulating Wagmi core logic for wallet interactions.
 * This class should not be used directly by UI components. The adapters
 * expose a standardized interface for wallet operations.
 * It manages Wagmi Config instances and provides methods for wallet actions.
 *
 * Implements EvmWalletImplementation interface for use with shared execution strategies.
 *
 * @example
 * ```typescript
 * // In adapter-evm:
 * const walletImpl = new WagmiWalletImplementation({
 *   chains: evmChains,
 *   networkConfigs: evmNetworks,
 *   walletConnectProjectId: 'your-project-id',
 * });
 *
 * // In adapter-polkadot:
 * const walletImpl = new WagmiWalletImplementation({
 *   chains: polkadotChains,
 *   networkConfigs: polkadotNetworks,
 * });
 * ```
 */
export class WagmiWalletImplementation implements EvmWalletImplementation {
  private defaultInstanceConfig: Config | null = null;
  private activeWagmiConfig: Config | null = null;
  private unsubscribe?: ReturnType<typeof watchAccount>;
  private initialized: boolean = false;
  private walletConnectProjectId?: string;
  private rpcConfigUnsubscribe?: () => void;

  // Configuration from constructor
  private readonly supportedChains: readonly Chain[];
  private readonly chainIdToNetworkId: Record<number, string>;
  private readonly logSystem: string;

  // Optional RainbowKit config function (can be injected by adapters)
  private rainbowKitConfigFn?: GetWagmiConfigForRainbowKitFn;

  /**
   * Constructs the WagmiWalletImplementation.
   * Configuration for Wagmi is deferred until actually needed or set externally.
   *
   * @param config - Configuration options for the wallet implementation
   */
  constructor(config: WagmiWalletConfig) {
    this.logSystem = config.logSystem ?? 'WagmiWalletImplementation';
    this.walletConnectProjectId = config.walletConnectProjectId;

    // Generate chains and mapping from network configs
    this.supportedChains =
      config.chains.length > 0
        ? config.chains
        : getSupportedChainsFromNetworks(config.networkConfigs, this.logSystem);
    this.chainIdToNetworkId = getChainIdToNetworkIdMapping(config.networkConfigs, this.logSystem);

    logger.info(
      this.logSystem,
      'Constructor called. Initial anticipated kitName:',
      config.initialUiKitConfig?.kitName
    );

    this.initialized = true;
    logger.info(
      this.logSystem,
      'WagmiWalletImplementation instance initialized (Wagmi config creation deferred).'
    );

    // Subscribe to RPC configuration changes to invalidate cached config
    this.setupRpcConfigListener();
  }

  /**
   * Sets the RainbowKit config retrieval function.
   * This allows adapters to inject their own RainbowKit integration.
   *
   * @param fn - Function to get RainbowKit wagmi config
   */
  public setRainbowKitConfigFn(fn: GetWagmiConfigForRainbowKitFn): void {
    this.rainbowKitConfigFn = fn;
  }

  /**
   * Gets the supported chains for this implementation.
   */
  public getSupportedChains(): readonly Chain[] {
    return this.supportedChains;
  }

  /**
   * Gets the chain ID to network ID mapping.
   */
  public getChainIdToNetworkIdMapping(): Record<number, string> {
    return this.chainIdToNetworkId;
  }

  /**
   * Sets up a listener for RPC configuration changes to invalidate the cached Wagmi config
   * when user changes RPC settings.
   */
  private setupRpcConfigListener(): void {
    // Import dynamically to avoid circular dependencies
    import('@openzeppelin/ui-utils')
      .then(({ userRpcConfigService }) => {
        // Subscribe to all RPC config changes
        this.rpcConfigUnsubscribe = userRpcConfigService.subscribe('*', (event) => {
          if (event.type === 'rpc-config-changed' || event.type === 'rpc-config-cleared') {
            logger.info(
              this.logSystem,
              `RPC config changed for network ${event.networkId}. Invalidating cached Wagmi config.`
            );
            // Invalidate the cached config to force recreation with new RPC settings
            this.defaultInstanceConfig = null;
          }
        });
      })
      .catch((error) => {
        logger.error(this.logSystem, 'Failed to setup RPC config listener:', error);
      });
  }

  /**
   * Cleanup method to unsubscribe from RPC config changes
   */
  public cleanup(): void {
    if (this.rpcConfigUnsubscribe) {
      this.rpcConfigUnsubscribe();
      this.rpcConfigUnsubscribe = undefined;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  /**
   * Sets the externally determined, currently active WagmiConfig instance.
   * This is typically called by UiKitManager after it has resolved the appropriate
   * config for the selected UI kit (e.g., RainbowKit's config or a default custom config).
   *
   * @param config - The Wagmi Config object to set as active, or null to clear it.
   */
  public setActiveWagmiConfig(config: Config | null): void {
    logger.info(
      this.logSystem,
      'setActiveWagmiConfig called with config:',
      config ? 'Valid Config' : 'Null'
    );
    this.activeWagmiConfig = config;

    if (this.unsubscribe) {
      logger.warn(
        this.logSystem,
        'setActiveWagmiConfig: Active WagmiConfig instance has changed. Existing direct watchAccount subscription (via onWalletConnectionChange) may be stale and operating on an old config instance.'
      );
    }
  }

  /**
   * Checks if an active wagmi config has been set.
   * Subclasses can use this to determine if the wallet is ready for operations.
   *
   * @returns true if an active wagmi config is set
   */
  protected hasActiveConfig(): boolean {
    return this.activeWagmiConfig !== null;
  }

  /**
   * Creates a default WagmiConfig instance on demand.
   * This configuration includes standard connectors (injected, MetaMask, Safe)
   * and WalletConnect if a project ID is available.
   * Used as a fallback or for 'custom' UI kit mode.
   *
   * @returns A Wagmi Config object.
   */
  private createDefaultConfig(): Config {
    const baseConnectors: WagmiCreateConnectorFn[] = [injected(), metaMask(), safe()];
    if (this.walletConnectProjectId?.trim()) {
      baseConnectors.push(walletConnect({ projectId: this.walletConnectProjectId }));
      logger.info(this.logSystem, 'WalletConnect connector added to DEFAULT config.');
    } else {
      logger.warn(
        this.logSystem,
        'WalletConnect Project ID not provided; WC connector unavailable for DEFAULT config.'
      );
    }

    const transportsConfig = this.supportedChains.reduce(
      (acc, chainDefinition) => {
        let rpcUrlToUse: string | undefined = chainDefinition.rpcUrls.default?.http?.[0];
        const appNetworkIdString = this.chainIdToNetworkId[chainDefinition.id];

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
              this.logSystem,
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
        chains: this.supportedChains as unknown as WagmiConfigChains,
        connectors: baseConnectors,
        transports: transportsConfig,
      });
      logger.info(this.logSystem, 'Default Wagmi config created successfully on demand.');
      return defaultConfig;
    } catch (error) {
      logger.error(this.logSystem, 'Error creating default Wagmi config on demand:', error);
      return createConfig({
        chains: [this.supportedChains[0]] as unknown as WagmiConfigChains,
        connectors: [injected()],
        transports: { [this.supportedChains[0].id]: http() },
      });
    }
  }

  /**
   * Wrapper function to convert AppConfigService RPC overrides to the format expected by RainbowKit.
   *
   * @param networkId - The network ID to get RPC override for
   * @returns RPC configuration in the format expected by RainbowKit
   */
  public getRpcOverrideForRainbowKit(
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
   * This delegates to the injected RainbowKit config function if available.
   *
   * @param currentAdapterUiKitConfig - The fully resolved UI kit configuration for the adapter.
   * @returns A Promise resolving to the RainbowKit-specific Wagmi Config object, or null if creation fails or not RainbowKit.
   */
  public async getConfigForRainbowKit(
    currentAdapterUiKitConfig: UiKitConfiguration
  ): Promise<Config | null> {
    if (!this.initialized) {
      logger.error(
        this.logSystem,
        'getConfigForRainbowKit called before implementation initialization.'
      );
      return null;
    }

    if (currentAdapterUiKitConfig?.kitName !== 'rainbowkit') {
      logger.warn(
        this.logSystem,
        'getConfigForRainbowKit called, but kitName is not rainbowkit. Returning null.'
      );
      return null;
    }

    logger.info(
      this.logSystem,
      'getConfigForRainbowKit: Kit is RainbowKit. Proceeding to create/get config. CurrentAdapterUiKitConfig:',
      currentAdapterUiKitConfig
    );

    // Use injected RainbowKit config function if available
    if (this.rainbowKitConfigFn) {
      const rainbowKitWagmiConfig = await this.rainbowKitConfigFn(
        currentAdapterUiKitConfig,
        this.supportedChains as WagmiConfigChains,
        this.chainIdToNetworkId,
        this.getRpcOverrideForRainbowKit.bind(this)
      );

      if (rainbowKitWagmiConfig) {
        logger.info(this.logSystem, 'Returning RainbowKit-specific Wagmi config for provider.');
        return rainbowKitWagmiConfig;
      }
    }

    logger.warn(this.logSystem, 'RainbowKit specific Wagmi config creation failed.');
    return null;
  }

  /**
   * Determines and returns the WagmiConfig to be used by UiKitManager during its configuration process.
   * If RainbowKit is specified in the passed uiKitConfig, it attempts to get its specific config.
   * Otherwise, it falls back to creating/returning a default instance config.
   *
   * @param uiKitConfig - The fully resolved UiKitConfiguration that the manager is currently processing.
   * @returns A Promise resolving to the determined Wagmi Config object.
   */
  public async getActiveConfigForManager(uiKitConfig: UiKitConfiguration): Promise<Config> {
    if (!this.initialized) {
      logger.error(
        this.logSystem,
        'getActiveConfigForManager called before initialization! Creating fallback.'
      );
      return createConfig({
        chains: [this.supportedChains[0]] as unknown as WagmiConfigChains,
        transports: { [this.supportedChains[0].id]: http() },
      });
    }

    if (uiKitConfig?.kitName === 'rainbowkit') {
      const rkConfig = await this.getConfigForRainbowKit(uiKitConfig);
      if (rkConfig) return rkConfig;
      logger.warn(
        this.logSystem,
        'getActiveConfigForManager: RainbowKit config failed, falling back to default.'
      );
    }

    // Reuse existing default config if available, only create if needed
    // This ensures wallet connection state is preserved across network switches
    // Config is automatically invalidated when RPC settings change via setupRpcConfigListener()
    if (!this.defaultInstanceConfig) {
      this.defaultInstanceConfig = this.createDefaultConfig();
    }
    return this.defaultInstanceConfig;
  }

  /**
   * @deprecated Prefer using methods that rely on the externally set `activeWagmiConfig`
   * or methods that determine contextually appropriate config like `getActiveConfigForManager` (for manager use)
   * or ensure `activeWagmiConfig` is set before calling wagmi actions.
   * This method returns the internally cached default config or the active one if set.
   *
   * @returns The current default or active Wagmi Config object.
   */
  public getConfig(): Config {
    logger.warn(
      this.logSystem,
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
   * This is a synchronous operation and uses the `activeWagmiConfig` if set by `UiKitManager`,
   * otherwise falls back to the default instance config (created on demand).
   *
   * @returns The current account status from Wagmi.
   */
  public getWalletConnectionStatus(): GetAccountReturnType {
    logger.debug(this.logSystem, 'getWalletConnectionStatus called.');
    const configToUse =
      this.activeWagmiConfig ||
      this.defaultInstanceConfig ||
      (this.defaultInstanceConfig = this.createDefaultConfig());

    if (!configToUse) {
      logger.error(this.logSystem, 'No config available for getWalletConnectionStatus!');
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
   * otherwise to the default instance config.
   *
   * @param callback - Function to call when connection status changes.
   * @returns A function to unsubscribe from the changes.
   */
  public onWalletConnectionChange(
    callback: (status: GetAccountReturnType, prevStatus: GetAccountReturnType) => void
  ): () => void {
    if (!this.initialized) {
      logger.warn(this.logSystem, 'onWalletConnectionChange called before initialization. No-op.');
      return () => {};
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      logger.debug(this.logSystem, 'Previous watchAccount unsubscribed.');
    }

    const configToUse =
      this.activeWagmiConfig ||
      this.defaultInstanceConfig ||
      (this.defaultInstanceConfig = this.createDefaultConfig());

    if (!configToUse) {
      logger.error(
        this.logSystem,
        'No config available for onWalletConnectionChange! Subscription not set.'
      );
      return () => {};
    }

    this.unsubscribe = watchAccount(configToUse, { onChange: callback });
    logger.info(
      this.logSystem,
      'watchAccount subscription established/re-established using config:',
      configToUse === this.activeWagmiConfig ? 'activeExternal' : 'defaultInstance'
    );
    return this.unsubscribe;
  }

  /**
   * Gets the Viem Wallet Client for the currently connected account and chain.
   *
   * @returns A Promise resolving to the Viem WalletClient or null if not connected.
   */
  public async getWalletClient(): Promise<WalletClient | null> {
    if (!this.initialized || !this.activeWagmiConfig) {
      logger.warn(
        this.logSystem,
        'getWalletClient: Not initialized or no activeWagmiConfig. Returning null.'
      );
      return null;
    }

    const accountStatus = getAccount(this.activeWagmiConfig);
    if (!accountStatus.isConnected || !accountStatus.chainId || !accountStatus.address) {
      return null;
    }

    return getWagmiWalletClient(this.activeWagmiConfig, {
      chainId: accountStatus.chainId,
      account: accountStatus.address,
    });
  }

  /**
   * Gets the Viem Public Client for the currently connected chain.
   *
   * @returns A Promise resolving to the Viem PublicClient or null.
   */
  public async getPublicClient(): Promise<PublicClient | null> {
    if (!this.initialized || !this.activeWagmiConfig) {
      logger.warn(
        this.logSystem,
        'getPublicClient: Not initialized or no activeWagmiConfig. Returning null.'
      );
      return null;
    }

    const accountStatus = getAccount(this.activeWagmiConfig);
    const currentChainId = accountStatus.chainId;

    if (!currentChainId) {
      logger.warn(
        this.logSystem,
        'getPublicClient: No connected chainId available from accountStatus. Returning null.'
      );
      return null;
    }

    try {
      const publicClient = getWagmiCorePublicClient(this.activeWagmiConfig, {
        chainId: currentChainId,
      });

      if (publicClient) {
        logger.info(
          this.logSystem,
          `getPublicClient: Successfully retrieved public client for chainId ${currentChainId}.`
        );
        return publicClient;
      }

      logger.warn(
        this.logSystem,
        `getPublicClient: getWagmiCorePublicClient returned undefined/null for chainId ${currentChainId}.`
      );
      return null;
    } catch (error) {
      logger.error(this.logSystem, 'Error getting public client from wagmi/core:', error);
      return null;
    }
  }

  /**
   * Gets the list of available wallet connectors from the active Wagmi config.
   *
   * @returns A Promise resolving to an array of available connectors.
   */
  public async getAvailableConnectors(): Promise<Connector[]> {
    if (!this.initialized || !this.activeWagmiConfig) return [];
    return this.activeWagmiConfig.connectors.map((co) => ({ id: co.uid, name: co.name }));
  }

  /**
   * Initiates the connection process for a specific connector.
   *
   * @param connectorId - The ID of the connector to use.
   * @returns A Promise with connection result including address and chainId if successful.
   */
  public async connect(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; chainId?: number; error?: string }> {
    if (!this.initialized || !this.activeWagmiConfig) {
      throw new Error('Wallet not initialized or no active config');
    }

    const connectorToUse = this.activeWagmiConfig.connectors.find(
      (cn) => cn.id === connectorId || cn.uid === connectorId
    );

    if (!connectorToUse) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    const res = await connect(this.activeWagmiConfig, { connector: connectorToUse });
    return { connected: true, address: res.accounts[0], chainId: res.chainId };
  }

  /**
   * Disconnects the currently connected wallet.
   *
   * @returns A Promise with disconnection result.
   */
  public async disconnect(): Promise<{ disconnected: boolean; error?: string }> {
    if (!this.initialized || !this.activeWagmiConfig) {
      return { disconnected: false, error: 'Wallet not initialized or no active config' };
    }
    await disconnect(this.activeWagmiConfig);
    return { disconnected: true };
  }

  /**
   * Prompts the user to switch to the specified network.
   *
   * @param chainId - The target chain ID to switch to.
   * @returns A Promise that resolves if the switch is successful, or rejects with an error.
   */
  public async switchNetwork(chainId: number): Promise<void> {
    if (!this.initialized || !this.activeWagmiConfig) {
      throw new Error('Wallet not initialized or no active config');
    }
    await switchChain(this.activeWagmiConfig, { chainId });
  }
}
