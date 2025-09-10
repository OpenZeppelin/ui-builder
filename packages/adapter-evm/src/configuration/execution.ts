import type {
  EoaExecutionConfig,
  ExecutionConfig,
  ExecutionMethodDetail,
  MultisigExecutionConfig,
  RelayerExecutionConfig,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { validateEoaConfig, validateRelayerConfig } from '../validation';

const SYSTEM_LOG_TAG = 'adapter-evm-execution-config';

/**
 * Returns details for execution methods supported by the EVM adapter.
 */
export async function getEvmSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
  logger.warn(
    'adapter-evm-execution-config',
    'getEvmSupportedExecutionMethods is using placeholder implementation.'
  );
  // TODO: Implement actual supported methods for EVM (e.g., EOA, Safe).
  return Promise.resolve([
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
      name: 'Safe Multisig', // Example for future
      description: 'Execute via a Safe multisignature wallet.',
      disabled: true,
    },
  ]);
}

/**
 * Validates Multisig execution configuration (placeholder).
 */
async function _validateMultisigConfig(
  _config: MultisigExecutionConfig,
  _walletStatus: { isConnected: boolean; address?: string; chainId?: string }
): Promise<true | string> {
  logger.info(SYSTEM_LOG_TAG, 'Multisig execution config validation: Not yet fully implemented.');
  // TODO: Add validation for Safe address, required signers, etc.
  return true; // Placeholder
}

/**
 * Validates the complete execution configuration object against the
 * requirements and capabilities of the EVM adapter.
 */
export async function validateEvmExecutionConfig(
  config: ExecutionConfig,
  walletStatus: { isConnected: boolean; address?: string; chainId?: string | number }
): Promise<true | string> {
  logger.info(SYSTEM_LOG_TAG, 'Validating EVM execution config:', { config, walletStatus });

  // Normalize chainId to string for validation functions
  const normalizedWalletStatus = {
    ...walletStatus,
    chainId:
      typeof walletStatus.chainId === 'number'
        ? walletStatus.chainId.toString()
        : walletStatus.chainId,
  };

  switch (config.method) {
    case 'eoa':
      return validateEoaConfig(config as EoaExecutionConfig, normalizedWalletStatus);
    case 'relayer':
      return validateRelayerConfig(config as RelayerExecutionConfig);
    case 'multisig':
      return _validateMultisigConfig(config as MultisigExecutionConfig, normalizedWalletStatus);
    default: {
      const unknownMethod = (config as ExecutionConfig).method;
      logger.warn(
        SYSTEM_LOG_TAG,
        `Unsupported execution method type encountered: ${unknownMethod}`
      );
      return `Unsupported execution method type: ${unknownMethod}`;
    }
  }
}
