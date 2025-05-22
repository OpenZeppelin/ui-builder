import type {
  EoaExecutionConfig,
  ExecutionConfig,
  ExecutionMethodDetail,
  MultisigExecutionConfig,
  RelayerExecutionConfig,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { isValidEvmAddress } from '../utils';

const SYSTEM_LOG_TAG = 'adapter-evm-execution-config';

/**
 * Returns details for execution methods supported by the EVM adapter.
 */
export async function getEvmSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
  console.warn('getEvmSupportedExecutionMethods is using placeholder implementation.');
  // TODO: Implement actual supported methods for EVM (e.g., EOA, Safe).
  return Promise.resolve([
    {
      type: 'eoa',
      name: 'EOA (External Account)',
      description: 'Execute using a standard wallet address.',
    },
    {
      type: 'multisig',
      name: 'Safe Multisig', // Example for future
      description: 'Execute via a Safe multisignature wallet.',
      disabled: false,
    },
    {
      type: 'relayer',
      name: 'Relayer (Placeholder)',
      description: 'Execute via a OpenZeppelin transaction relayer (not yet implemented).',
      disabled: false,
    },
  ]);
}

/**
 * Validates EOA execution configuration.
 */
async function _validateEoaConfig(
  config: EoaExecutionConfig,
  walletStatus: { isConnected: boolean; address?: string; chainId?: string }
): Promise<true | string> {
  if (!config.allowAny) {
    if (!config.specificAddress) {
      return "EOA execution selected, but no specific address was provided when 'allowAny' is false.";
    }
    if (!isValidEvmAddress(config.specificAddress)) {
      return `Invalid specific EOA address format: ${config.specificAddress}`;
    }
    if (walletStatus.isConnected && walletStatus.address) {
      if (walletStatus.address.toLowerCase() !== config.specificAddress.toLowerCase()) {
        return (
          `Connected wallet address (${walletStatus.address}) does not match the required specific EOA address ` +
          `(${config.specificAddress}). Please connect the correct wallet.`
        );
      }
    } else if (walletStatus.isConnected && !walletStatus.address) {
      logger.warn(
        SYSTEM_LOG_TAG,
        'Wallet is connected but address is unavailable for EOA validation.'
      );
      return 'Connected wallet address is not available for validation against specific EOA.';
    }
  }
  return true;
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
 * Validates Relayer execution configuration (placeholder).
 */
async function _validateRelayerConfig(
  _config: RelayerExecutionConfig,
  _walletStatus: { isConnected: boolean; address?: string; chainId?: string }
): Promise<true | string> {
  logger.info(SYSTEM_LOG_TAG, 'Relayer execution config validation: Not yet implemented.');
  // TODO: Add validation for relayer URL, API key presence (if applicable), etc.
  return true; // Placeholder
}

/**
 * Validates the complete execution configuration object against the
 * requirements and capabilities of the EVM adapter.
 */
export async function validateEvmExecutionConfig(
  config: ExecutionConfig,
  walletStatus: { isConnected: boolean; address?: string; chainId?: string }
): Promise<true | string> {
  logger.info(SYSTEM_LOG_TAG, 'Validating EVM execution config:', { config, walletStatus });

  switch (config.method) {
    case 'eoa':
      return _validateEoaConfig(config as EoaExecutionConfig, walletStatus);
    case 'multisig':
      return _validateMultisigConfig(config as MultisigExecutionConfig, walletStatus);
    case 'relayer':
      return _validateRelayerConfig(config as RelayerExecutionConfig, walletStatus);
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
