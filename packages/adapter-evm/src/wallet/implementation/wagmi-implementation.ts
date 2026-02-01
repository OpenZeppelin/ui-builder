/**
 * EVM Wagmi Wallet Implementation
 *
 * This file configures and exports the core WagmiWalletImplementation
 * with EVM-specific settings.
 */
import {
  WagmiWalletImplementation as CoreWagmiWalletImplementation,
  getWagmiConfigForRainbowKit,
  type WagmiConfigChains,
  type WagmiWalletConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { UiKitConfiguration } from '@openzeppelin/ui-types';

import { evmNetworks } from '../../networks';

/**
 * Generates the supported chains from EVM network configurations.
 * Only includes networks that have a viemChain property (ensuring wagmi compatibility).
 */
const getSupportedChainsFromNetworks = () => {
  return evmNetworks
    .filter((network) => network.viemChain)
    .map((network) => network.viemChain!)
    .filter((chain, index, self) => self.findIndex((c) => c.id === chain.id) === index);
};

/**
 * The supported chains for EVM adapter.
 */
const defaultSupportedChains = getSupportedChainsFromNetworks();

/**
 * Create an EVM-configured WagmiWalletImplementation instance.
 *
 * @param walletConnectProjectId - Optional WalletConnect project ID
 * @param initialUiKitConfig - Optional initial UI kit configuration
 * @returns A configured WagmiWalletImplementation instance
 */
export function createEvmWalletImplementation(
  walletConnectProjectId?: string,
  initialUiKitConfig?: UiKitConfiguration
): CoreWagmiWalletImplementation {
  const config: WagmiWalletConfig = {
    chains: defaultSupportedChains,
    networkConfigs: evmNetworks,
    walletConnectProjectId,
    initialUiKitConfig,
    logSystem: 'WagmiWalletImplementation',
  };

  const instance = new CoreWagmiWalletImplementation(config);

  // Inject the RainbowKit config function
  instance.setRainbowKitConfigFn(
    async (uiKitConfiguration, chains, chainIdToNetworkIdMap, getRpcOverride) => {
      return getWagmiConfigForRainbowKit(
        uiKitConfiguration,
        chains as WagmiConfigChains,
        chainIdToNetworkIdMap,
        getRpcOverride
      );
    }
  );

  return instance;
}
