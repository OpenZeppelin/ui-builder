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
  getPublicClient as getWagmiCorePublicClient,
  getWalletClient as getWagmiWalletClient,
  switchChain,
  watchAccount,
} from '@wagmi/core';
import { type Chain, PublicClient, WalletClient, http } from 'viem';
import { base, mainnet, optimism, polygon, sepolia } from 'viem/chains';

import type { Connector, UiKitConfiguration } from '@openzeppelin/transaction-form-types';
import { appConfigService, logger } from '@openzeppelin/transaction-form-utils';

import { getWagmiConfigForRainbowKit } from '../rainbowkit';
import { type WagmiConfigChains } from '../types';

const LOG_SYSTEM = 'WagmiWalletImplementation'; // Define LOG_SYSTEM here

/**
 * Defines the default set of blockchain networks (from viem/chains) that Wagmi will be configured to support.
 * This list enables features like chain switching within Wagmi and dictates which chains' RPCs
 * can be potentially overridden via AppConfigService if a mapping exists in `viemChainIdToAppNetworkId`.
 * If you add a new chain here and want its RPC to be configurable, ensure a corresponding
 * entry is also added to `viemChainIdToAppNetworkId` below.
 */
const defaultSupportedChains: readonly Chain[] = [mainnet, sepolia, polygon, optimism, base];

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
          const rpcOverrideSetting = appConfigService.getRpcEndpointOverride(appNetworkIdString);
          let httpRpcOverride: string | undefined;
          if (typeof rpcOverrideSetting === 'string') {
            httpRpcOverride = rpcOverrideSetting;
          } else if (typeof rpcOverrideSetting === 'object' && rpcOverrideSetting?.http) {
            httpRpcOverride = rpcOverrideSetting.http;
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
        chains: [mainnet] as unknown as WagmiConfigChains,
        connectors: [injected()],
        transports: { [mainnet.id]: http() },
      });
    }
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
      appConfigService.getRpcEndpointOverride.bind(appConfigService)
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
        chains: [mainnet] as unknown as WagmiConfigChains,
        transports: { [mainnet.id]: http() },
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
