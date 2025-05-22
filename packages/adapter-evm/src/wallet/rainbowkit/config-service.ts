import { Config, http } from '@wagmi/core';
import { type Chain } from 'viem';

import type { UiKitConfiguration } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { type WagmiConfigChains } from '../types';

import { RainbowKitConfig, getRainbowKitConfig } from './utils';

/**
 * Creates a Wagmi configuration for RainbowKit using getDefaultConfig
 *
 * @param rainbowKitConfig RainbowKit configuration options
 * @param chains Array of viem Chain objects - will be safely cast to wagmi's expected chain type
 * @param chainIdToNetworkIdMap Mapping of chain IDs to network IDs for RPC override lookups
 * @param getRpcEndpointOverride Function to get RPC endpoint overrides
 * @returns Wagmi configuration for RainbowKit or null if creation fails
 */
export async function createRainbowKitWagmiConfig(
  rainbowKitConfig: RainbowKitConfig,
  chains: readonly Chain[],
  chainIdToNetworkIdMap: Record<number, string>,
  getRpcEndpointOverride: (networkId: string) => string | { http?: string; ws?: string } | undefined
): Promise<Config | null> {
  try {
    // Dynamically import RainbowKit's getDefaultConfig
    const { getDefaultConfig } = await import('@rainbow-me/rainbowkit');

    if (!getDefaultConfig) {
      logger.error(
        'rainbowkit/config-service',
        'Failed to import getDefaultConfig from RainbowKit'
      );
      return null;
    }

    // Build transport configuration with RPC overrides as needed
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

    // Create the wagmi config using RainbowKit's getDefaultConfig
    // Use type assertion to bridge the gap between viem's Chain type and wagmi's chains type
    // According to RainbowKit docs, they use viem's Chain as the base type, but there are
    // subtle TypeScript compatibility issues that require this cast
    const config = getDefaultConfig({
      appName: rainbowKitConfig.appName,
      projectId: rainbowKitConfig.projectId,
      chains: chains as unknown as WagmiConfigChains,
      transports: transportsConfig,
      ssr: !!rainbowKitConfig.ssr,
    });

    logger.info('rainbowkit/config-service', 'Successfully created RainbowKit configuration');

    return config;
  } catch (error) {
    logger.error('rainbowkit/config-service', 'Error creating RainbowKit config:', error);
    return null;
  }
}

/**
 * Checks if a UI kit configuration is for RainbowKit and extracts the configuration
 * if valid.
 *
 * @param uiKitConfiguration The UI kit configuration object
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
    !uiKitConfiguration.kitConfig
  ) {
    return null;
  }

  // Use the utility function from rainbowkit/utils to safely extract the config
  const rainbowKitConfig = getRainbowKitConfig(uiKitConfiguration);
  if (!rainbowKitConfig) {
    return null;
  }

  return createRainbowKitWagmiConfig(
    rainbowKitConfig,
    chains,
    chainIdToNetworkIdMap,
    getRpcEndpointOverride
  );
}
