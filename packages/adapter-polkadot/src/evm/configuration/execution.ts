/**
 * Execution Configuration for Polkadot EVM Adapter
 *
 * Handles execution method configuration and validation.
 */

import {
  validateEvmExecutionConfig,
  type EvmWalletStatus,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type {
  ExecutionConfig,
  ExecutionMethodDetail,
  WalletConnectionStatus,
} from '@openzeppelin/ui-types';

/**
 * Get supported execution methods for Polkadot EVM networks.
 * Returns EOA and Relayer methods.
 */
export async function getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
  return [
    {
      type: 'eoa',
      name: 'EOA (External Account)',
      description: 'Execute using a standard wallet address.',
    },
    {
      type: 'relayer',
      name: 'OpenZeppelin Relayer',
      description: 'Execute via a OpenZeppelin open source transaction relayer service.',
      disabled: false,
    },
    {
      type: 'multisig',
      name: 'Safe Multisig',
      description: 'Execute via a Safe multisignature wallet.',
      disabled: true,
    },
  ];
}

/**
 * Validate execution configuration.
 * Delegates to adapter-evm-core validation function.
 */
export async function validateExecutionConfig(
  config: ExecutionConfig,
  walletStatus: WalletConnectionStatus
): Promise<true | string> {
  // Convert WalletConnectionStatus to EvmWalletStatus for core validation
  const evmWalletStatus: EvmWalletStatus = {
    isConnected: walletStatus.isConnected,
    address: walletStatus.address,
  };

  return validateEvmExecutionConfig(config, evmWalletStatus);
}
