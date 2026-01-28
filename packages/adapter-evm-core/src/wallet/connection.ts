/**
 * Core Wallet Connection Utilities
 *
 * Provides shared wallet connection logic for EVM-compatible adapters.
 * Both adapter-evm and adapter-polkadot can use these core utilities.
 *
 * @module wallet/connection
 */

import type { GetAccountReturnType } from '@wagmi/core';

import { logger } from '@openzeppelin/ui-utils';

import type { EvmWalletConnectionResult, EvmWalletImplementation } from '../transaction/types';

/**
 * Default wallet connection status when disconnected.
 * Use this constant when the wallet implementation is not ready or available.
 */
export const DEFAULT_DISCONNECTED_STATUS: GetAccountReturnType = {
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

/**
 * Core implementation of connect and ensure correct network logic.
 *
 * This function handles the common pattern of:
 * 1. Connect to wallet using the specified connector
 * 2. Check if connected to the target chain
 * 3. If not, attempt to switch networks
 * 4. If switch fails, disconnect and return error
 *
 * @param impl - The wallet implementation to use
 * @param connectorId - The ID of the connector to use
 * @param targetChainId - The desired chain ID to switch to after connection
 * @param logSystem - The log system identifier for logging
 * @returns An object containing connection status, address, and any error
 */
export async function connectAndEnsureCorrectNetworkCore(
  impl: EvmWalletImplementation,
  connectorId: string,
  targetChainId: number,
  logSystem: string
): Promise<EvmWalletConnectionResult> {
  const connectionResult = await impl.connect(connectorId);
  if (!connectionResult.connected || !connectionResult.address || !connectionResult.chainId) {
    return { connected: false, error: connectionResult.error || 'Connection failed' };
  }

  if (connectionResult.chainId !== targetChainId) {
    logger.info(
      logSystem,
      `Connected to chain ${connectionResult.chainId}, but target is ${targetChainId}. Attempting switch.`
    );
    try {
      await impl.switchNetwork(targetChainId);
      const postSwitchStatus = impl.getWalletConnectionStatus();
      if (postSwitchStatus.chainId !== targetChainId) {
        const switchError = `Failed to switch to target network ${targetChainId}. Current: ${postSwitchStatus.chainId}`;
        logger.error(logSystem, switchError);
        // Attempt to disconnect to leave a clean state if switch fails
        try {
          await impl.disconnect();
        } catch (e) {
          logger.warn(logSystem, 'Failed to disconnect after network switch failure.', e);
        }
        return { connected: false, error: switchError };
      }
      logger.info(logSystem, `Successfully switched to target chain ${targetChainId}.`);
      return { ...connectionResult, chainId: postSwitchStatus.chainId }; // Return updated chainId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(logSystem, 'Network switch failed:', errorMessage);
      // Attempt to disconnect to leave a clean state if switch fails
      try {
        await impl.disconnect();
      } catch (e) {
        logger.warn(logSystem, 'Failed to disconnect after network switch failure.', e);
      }
      return { connected: false, error: `Network switch failed: ${errorMessage}` };
    }
  }
  return connectionResult;
}
