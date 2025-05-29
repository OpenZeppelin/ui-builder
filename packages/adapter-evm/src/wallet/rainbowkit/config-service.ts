import { Config, http } from '@wagmi/core';
import { type Chain } from 'viem';

import type { UiKitConfiguration } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { type WagmiConfigChains } from '../types';

// Cache to prevent duplicate config creation and WalletConnect double initialization
const cacheInstanceId = Math.random().toString(36).substring(7);
const configCache = new Map<string, Config>();
logger.debug('rainbowkit/config-service', 'NEW configCache INSTANCE CREATED', cacheInstanceId);

/**
 * Creates a cache key from the configuration to prevent duplicate config creation
 */
function createConfigCacheKey(
  userFullNativeConfig: Record<string, unknown> | undefined | null,
  chains: readonly Chain[]
): string {
  const wagmiParamsContent = userFullNativeConfig?.wagmiParams;
  const chainIds = chains.map((c) => c.id).sort();
  const keyObject = {
    wagmiParams: wagmiParamsContent,
    chainIds: chainIds,
  };
  const configHash = JSON.stringify(keyObject);
  logger.debug(
    'rainbowkit/config-service:createConfigCacheKey',
    'Key generation input - userFullNativeConfig.wagmiParams:',
    wagmiParamsContent,
    'Key generation input - chainIds:',
    chainIds,
    'Generated Key Object for stringify:',
    keyObject,
    'Generated Hash:',
    configHash
  );
  return configHash;
}

/**
 * Creates a Wagmi configuration for RainbowKit using getDefaultConfig
 *
 * @param userFullNativeConfig The full native configuration object. This object IS the result of merging
 *                             AppConfigService settings, user's native rainbowkit.config.ts, and programmatic overrides.
 *                             It is expected to contain a `wagmiParams` object for RainbowKit's getDefaultConfig
 *                             and potentially a `providerProps` object for RainbowKitProvider.
 * @param chains Array of viem Chain objects - will be safely cast to wagmi's expected chain type
 * @param chainIdToNetworkIdMap Mapping of chain IDs to network IDs for RPC override lookups
 * @param getRpcEndpointOverride Function to get RPC endpoint overrides
 * @returns Wagmi configuration for RainbowKit or null if creation fails
 */
export async function createRainbowKitWagmiConfig(
  userFullNativeConfig: Record<string, unknown> | undefined | null, // This is the fully resolved kitConfig
  chains: readonly Chain[],
  chainIdToNetworkIdMap: Record<number, string>,
  getRpcEndpointOverride: (networkId: string) => string | { http?: string; ws?: string } | undefined
): Promise<Config | null> {
  try {
    const cacheKey = createConfigCacheKey(userFullNativeConfig, chains);
    logger.info(
      'rainbowkit/config-service:createRainbowKitWagmiConfig',
      'Attempting to get/create config. Cache Key:',
      cacheKey,
      'Using cache instance ID:',
      cacheInstanceId
    );

    const cachedConfig = configCache.get(cacheKey);

    if (cachedConfig) {
      logger.info(
        'rainbowkit/config-service:createRainbowKitWagmiConfig',
        'CACHE HIT. Returning cached RainbowKit Wagmi config.',
        {
          cacheKey,
          cacheInstanceId,
          cachedConfigObjectId:
            typeof cachedConfig?.storage === 'object' && cachedConfig.storage !== null
              ? 'WagmiStorageObject'
              : String(cachedConfig?.storage),
        }
      );
      return cachedConfig;
    } else {
      logger.warn(
        'rainbowkit/config-service:createRainbowKitWagmiConfig',
        'CACHE MISS. Proceeding to create new RainbowKit Wagmi config.',
        { cacheKey, cacheSize: configCache.size, cacheInstanceId }
      );
    }

    const { getDefaultConfig } = await import('@rainbow-me/rainbowkit');
    if (!getDefaultConfig) {
      logger.error(
        'rainbowkit/config-service',
        'Failed to import getDefaultConfig from RainbowKit'
      );
      return null;
    }

    // userFullNativeConfig *is* the kitConfig here. Its wagmiParams are what we need.
    const wagmiParams = userFullNativeConfig?.wagmiParams as Record<string, unknown> | undefined;

    if (!wagmiParams) {
      logger.warn(
        'rainbowkit/config-service',
        'Resolved kitConfig does not contain a `wagmiParams` object. Cannot create RainbowKit Wagmi config.'
      );
      return null;
    }

    // Ensure essential appName and projectId are present in user's wagmiParams
    if (typeof wagmiParams.appName !== 'string' || !wagmiParams.appName) {
      logger.warn(
        'rainbowkit/config-service',
        'kitConfig.wagmiParams is missing or has invalid `appName`.'
      );
      return null;
    }
    if (typeof wagmiParams.projectId !== 'string' || !wagmiParams.projectId) {
      logger.warn(
        'rainbowkit/config-service',
        'kitConfig.wagmiParams is missing or has invalid `projectId`.'
      );
      return null;
    }

    // Build transport configuration with RPC overrides as needed.
    // This iterates over the adapter-determined chains and creates a transport
    // for each, applying any RPC overrides specified via AppConfigService.
    const transportsConfig = chains.reduce(
      (acc, chainDefinition) => {
        let rpcUrlToUse: string | undefined = chainDefinition.rpcUrls.default?.http?.[0];
        const appNetworkIdString = chainIdToNetworkIdMap[chainDefinition.id];

        if (appNetworkIdString) {
          const rpcOverrideSetting = getRpcEndpointOverride(appNetworkIdString);
          let httpRpcOverride: string | undefined;

          if (typeof rpcOverrideSetting === 'string') {
            httpRpcOverride = rpcOverrideSetting;
          } else if (typeof rpcOverrideSetting === 'object' && rpcOverrideSetting?.http) {
            httpRpcOverride = rpcOverrideSetting.http;
          }

          if (httpRpcOverride) {
            logger.info(
              'rainbowkit/config-service',
              `Using overridden RPC for chain ${chainDefinition.name}: ${httpRpcOverride}`
            );
            rpcUrlToUse = httpRpcOverride;
          }
        }

        acc[chainDefinition.id] = http(rpcUrlToUse);
        return acc;
      },
      {} as Record<number, ReturnType<typeof http>>
    );

    // Spread all user-provided wagmiParams, then override chains and transports
    const finalConfigOptions = {
      ...wagmiParams, // User's native params (appName, projectId, wallets, ssr, etc.)
      chains: chains as WagmiConfigChains, // Adapter controls this
      transports: transportsConfig, // Adapter controls this
    };

    // The `wallets` property from user config is of type `unknown` on our side if accessed directly from wagmiParams.
    // RainbowKit's `getDefaultConfig` expects a specific `WalletList` type for `wallets`.
    // By spreading `wagmiParams`, we pass whatever structure the user provided.
    // We use `eslint-disable-next-line @typescript-eslint/no-explicit-any` here to pass through
    // the user-provided structure directly, relying on RainbowKit to perform its own validation or type checking internally.
    // This aligns with our principle of not mimicking complex third-party types for pass-through configuration.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = getDefaultConfig(finalConfigOptions as any);

    configCache.set(cacheKey, config);
    logger.info(
      'rainbowkit/config-service:createRainbowKitWagmiConfig',
      'New config created and cached. Cache Size now:',
      configCache.size,
      {
        cacheKey,
        cacheInstanceId,
      }
    );

    logger.info(
      'rainbowkit/config-service',
      'Successfully created RainbowKit Wagmi config object.',
      config
    );
    return config;
  } catch (error) {
    logger.error('rainbowkit/config-service', 'Error creating RainbowKit Wagmi config:', error);
    return null;
  }
}

/**
 * Gets the Wagmi configuration for RainbowKit based on the global UI kit settings.
 * This function is intended to be called by WagmiWalletImplementation.
 *
 * @param uiKitConfiguration The UI kit configuration object from EvmUiKitManager (contains the resolved kitConfig).
 * @param chains Array of viem Chain objects to use with RainbowKit
 * @param chainIdToNetworkIdMap Mapping of chain IDs to network IDs for RPC override lookups
 * @param getRpcEndpointOverride Function to get RPC endpoint overrides
 * @returns The wagmi Config object or null if invalid or not RainbowKit
 */
export async function getWagmiConfigForRainbowKit(
  uiKitConfiguration: UiKitConfiguration | undefined,
  chains: readonly Chain[],
  chainIdToNetworkIdMap: Record<number, string>,
  getRpcEndpointOverride: (networkId: string) => string | { http?: string; ws?: string } | undefined
): Promise<Config | null> {
  if (
    !uiKitConfiguration ||
    uiKitConfiguration.kitName !== 'rainbowkit' ||
    !uiKitConfiguration.kitConfig // kitConfig is the fully resolved config here
  ) {
    logger.debug(
      'rainbowkit/config-service',
      'Not configured for RainbowKit or kitConfig (resolved native + programmatic) is missing.'
    );
    return null;
  }

  // userFullNativeConfig for createRainbowKitWagmiConfig IS uiKitConfiguration.kitConfig
  const resolvedKitConfig = uiKitConfiguration.kitConfig as Record<string, unknown>;

  return createRainbowKitWagmiConfig(
    resolvedKitConfig, // Pass the resolved kitConfig
    chains,
    chainIdToNetworkIdMap,
    getRpcEndpointOverride
  );
}
