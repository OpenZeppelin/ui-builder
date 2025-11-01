import type {
  EoaExecutionConfig,
  ExecutionConfig,
  ExecutionMethodDetail,
} from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { isValidAddress } from '../validation';

const SYSTEM_LOG_TAG = 'adapter-midnight-execution-config';

/**
 * Returns details for execution methods supported by the Midnight adapter.
 */
export async function getMidnightSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
  return Promise.resolve([
    {
      type: 'eoa',
      name: 'EOA (Midnight Account)',
      description: 'Execute using a standard Midnight account.',
    },
  ]);
}

/**
 * Validates EOA execution configuration for Midnight.
 */
async function _validateEoaConfig(config: EoaExecutionConfig): Promise<true | string> {
  if (!config.allowAny && !config.specificAddress) {
    return 'Specific EOA address is required when "Allow Any" is disabled.';
  }

  if (!config.allowAny && config.specificAddress && !isValidAddress(config.specificAddress)) {
    return 'Invalid EOA address format for Midnight.';
  }

  return true;
}

/**
 * Validates the complete execution configuration object against the
 * requirements and capabilities of the Midnight adapter.
 */
export async function validateMidnightExecutionConfig(
  config: ExecutionConfig
): Promise<true | string> {
  logger.info(SYSTEM_LOG_TAG, 'Validating Midnight execution config:', { config });

  switch (config.method) {
    case 'eoa':
      return _validateEoaConfig(config as EoaExecutionConfig);
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
