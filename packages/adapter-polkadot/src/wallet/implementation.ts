/**
 * Polkadot Wallet Implementation
 *
 * Uses the shared WagmiWalletImplementation from adapter-evm-core with
 * Polkadot-specific configuration. This provides full feature parity with
 * the EVM adapter including:
 * - RPC override logic with user configuration support
 * - Dynamic RPC change listener for config invalidation
 * - Chain ID to network ID mapping
 * - Explicit connector setup (injected, metaMask, safe, walletConnect)
 * - Sophisticated config caching with invalidation
 * - UI kit configuration methods for RainbowKit integration
 */

import type { Config } from '@wagmi/core';

import {
  WagmiWalletImplementation as CoreWagmiWalletImplementation,
  type WagmiConfigChains,
  type WagmiWalletConfig,
  type WalletNetworkConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import { logger } from '@openzeppelin/ui-utils';

import { polkadotNetworks } from '../networks';
import { polkadotChains } from './chains';

const LOG_SYSTEM = 'PolkadotWalletImplementation';

/**
 * Convert Polkadot network configs to WalletNetworkConfig format.
 */
function toWalletNetworkConfigs(): WalletNetworkConfig[] {
  return polkadotNetworks.map((network) => ({
    id: network.id,
    chainId: network.chainId,
    viemChain: network.viemChain,
  }));
}

/**
 * Polkadot wallet implementation for EVM-compatible chains.
 *
 * This class extends the core WagmiWalletImplementation to provide
 * wallet functionality for the Polkadot adapter. It implements
 * EvmWalletImplementation to be compatible with the shared execution
 * strategies from adapter-evm-core.
 *
 * Features inherited from core:
 * - RPC override logic with user configuration support
 * - Dynamic RPC change listener for config invalidation
 * - Chain ID to network ID mapping
 * - Explicit connector setup (injected, metaMask, safe, walletConnect)
 * - Sophisticated config caching with invalidation
 * - UI kit configuration methods
 *
 * @remarks
 * This implementation expects a wagmi config to be passed in.
 * The config should be created by the PolkadotWalletUiRoot component
 * or passed directly by the consuming application.
 */
export class PolkadotWalletImplementation extends CoreWagmiWalletImplementation {
  /**
   * Creates a new PolkadotWalletImplementation instance.
   *
   * @param walletConnectProjectId - Optional WalletConnect project ID
   */
  constructor(walletConnectProjectId?: string) {
    const config: WagmiWalletConfig = {
      chains: polkadotChains,
      networkConfigs: toWalletNetworkConfigs(),
      walletConnectProjectId,
      logSystem: LOG_SYSTEM,
    };

    super(config);

    logger.info(
      LOG_SYSTEM,
      'PolkadotWalletImplementation created with core WagmiWalletImplementation'
    );
  }

  /**
   * Injects a RainbowKit config function for wallet configuration.
   * This allows Polkadot adapter users to provide their own RainbowKit integration.
   *
   * @param fn - Function to get RainbowKit wagmi config
   */
  public injectRainbowKitConfig(
    fn: (
      uiKitConfiguration: unknown,
      chains: WagmiConfigChains,
      chainIdToNetworkIdMap: Record<number, string>,
      getRpcOverride: (networkId: string) => string | { http?: string; ws?: string } | undefined
    ) => Promise<Config | null>
  ): void {
    this.setRainbowKitConfigFn(fn);
    logger.info(LOG_SYSTEM, 'RainbowKit config function injected');
  }

  /**
   * Set the wagmi config to use for wallet operations.
   * This should be called after the PolkadotWalletUiRoot mounts.
   *
   * @param config - The wagmi Config to use
   */
  public setConfig(config: Config): void {
    this.setActiveWagmiConfig(config);
    logger.info(LOG_SYSTEM, 'Wagmi config set via setConfig');
  }

  /**
   * Checks if the wallet implementation is ready for operations.
   * Returns true if an active wagmi config has been set via setConfig().
   *
   * @returns true if the wallet is configured and ready for operations
   */
  public isReady(): boolean {
    return this.hasActiveConfig();
  }
}

// Singleton instance for use across the adapter
let polkadotWalletInstance: PolkadotWalletImplementation | undefined;

/**
 * Get or create the Polkadot wallet implementation singleton.
 */
export function getPolkadotWalletImplementation(): PolkadotWalletImplementation {
  if (!polkadotWalletInstance) {
    polkadotWalletInstance = new PolkadotWalletImplementation();
    logger.info(LOG_SYSTEM, 'Created PolkadotWalletImplementation singleton');
  }
  return polkadotWalletInstance;
}

/**
 * Initialize the Polkadot wallet implementation with a wagmi config.
 */
export function initializePolkadotWallet(config: Config): PolkadotWalletImplementation {
  const instance = getPolkadotWalletImplementation();
  instance.setConfig(config);
  return instance;
}
