/**
 * Execution Configuration Validation
 *
 * Central validation router for EVM execution configurations.
 * Delegates to specific validators based on execution method type.
 */

import type {
  EoaExecutionConfig,
  ExecutionConfig,
  RelayerExecutionConfig,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { validateEoaConfig, type EvmWalletStatus } from './eoa';
import { validateRelayerConfig } from './relayer';

const SYSTEM_LOG_TAG = 'evm-execution-config';

/**
 * Validates the complete execution configuration object against the
 * requirements and capabilities of EVM-compatible adapters.
 *
 * @param config The execution configuration to validate
 * @param walletStatus The wallet connection status for validation
 * @returns true if valid, or an error message string if invalid
 */
export async function validateEvmExecutionConfig(
  config: ExecutionConfig,
  walletStatus: EvmWalletStatus
): Promise<true | string> {
  logger.info(SYSTEM_LOG_TAG, 'Validating EVM execution config:', { config, walletStatus });

  switch (config.method) {
    case 'eoa':
      return validateEoaConfig(config as EoaExecutionConfig, walletStatus);
    case 'relayer':
      return validateRelayerConfig(config as RelayerExecutionConfig);
    case 'multisig':
      return 'Multisig execution is not yet supported';
    default: {
      const unknownMethod = (config as ExecutionConfig).method;
      logger.warn(SYSTEM_LOG_TAG, `Unsupported execution method type: ${unknownMethod}`);
      return `Unsupported execution method: ${unknownMethod}`;
    }
  }
}
