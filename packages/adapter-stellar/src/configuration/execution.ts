import type {
  EoaExecutionConfig,
  ExecutionConfig,
  ExecutionMethodDetail,
  MultisigExecutionConfig,
  RelayerExecutionConfig,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { validateEoaConfig, validateRelayerConfig } from '../validation';
import { StellarWalletConnectionStatus } from '../wallet/types';

const SYSTEM_LOG_TAG = 'adapter-stellar-execution-config';

/**
 * Returns details for execution methods supported by the Stellar adapter.
 */
export async function getStellarSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
  logger.warn(
    'adapter-stellar-execution-config',
    'getStellarSupportedExecutionMethods is using placeholder implementation.'
  );
  // TODO: Implement actual supported methods for Stellar (e.g., EOA, Relayer).
  return Promise.resolve([
    {
      type: 'eoa',
      name: 'EOA (External Account)',
      description: 'Execute using a standard Stellar account address.',
    },
    {
      type: 'relayer',
      name: 'OpenZeppelin Relayer',
      description: 'Execute via a OpenZeppelin open source transaction relayer service.',
      disabled: false,
    },
    {
      type: 'multisig',
      name: 'Stellar Multisig', // Example for future
      description: 'Execute via a Stellar multisignature configuration.',
      disabled: true,
    },
  ]);
}

/**
 * Validates Multisig execution configuration (placeholder).
 */
async function _validateMultisigConfig(
  _config: MultisigExecutionConfig,
  _walletStatus: StellarWalletConnectionStatus
): Promise<true | string> {
  logger.info(SYSTEM_LOG_TAG, 'Multisig execution config validation: Not yet fully implemented.');
  // TODO: Add validation for Stellar multisig configuration, required signers, etc.
  return true; // Placeholder
}

/**
 * Validates the complete execution configuration object against the
 * requirements and capabilities of the Stellar adapter.
 */
export async function validateStellarExecutionConfig(
  config: ExecutionConfig,
  walletStatus: StellarWalletConnectionStatus
): Promise<true | string> {
  logger.info(SYSTEM_LOG_TAG, 'Validating Stellar execution config:', { config, walletStatus });

  switch (config.method) {
    case 'eoa':
      return validateEoaConfig(config as EoaExecutionConfig, walletStatus);
    case 'relayer':
      return validateRelayerConfig(config as RelayerExecutionConfig);
    case 'multisig':
      return _validateMultisigConfig(config as MultisigExecutionConfig, walletStatus);
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
