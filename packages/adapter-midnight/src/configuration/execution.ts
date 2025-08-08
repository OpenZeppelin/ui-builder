import type {
  ExecutionConfig,
  ExecutionMethodDetail,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { isValidAddress } from '../utils';

/**
 * @inheritdoc
 * TODO: Implement actual supported methods for Midnight.
 */
export function getMidnightSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
  // Placeholder: Assume only EOA is supported for now
  logger.warn(
    'MidnightExecutionConfig',
    'getSupportedExecutionMethods is using placeholder implementation.'
  );
  return Promise.resolve([
    {
      type: 'eoa',
      name: 'EOA (Midnight Account)',
      description: 'Execute using a standard Midnight account.',
    },
  ]);
}

/**
 * @inheritdoc
 * TODO: Implement actual validation logic for Midnight execution configs.
 */
export function validateMidnightExecutionConfig(config: ExecutionConfig): Promise<true | string> {
  // Placeholder: Basic validation
  logger.warn(
    'MidnightExecutionConfig',
    'validateExecutionConfig is using placeholder implementation.'
  );
  if (config.method === 'eoa') {
    if (!config.allowAny && !config.specificAddress) {
      return Promise.resolve('Specific EOA address is required.');
    }
    if (
      !config.allowAny &&
      config.specificAddress &&
      !isValidAddress(config.specificAddress) // Assuming isValidAddress is moved to utils
    ) {
      return Promise.resolve('Invalid EOA address format for Midnight.');
    }
    return Promise.resolve(true);
  } else {
    // For now, consider other methods unsupported by this placeholder
    return Promise.resolve(
      `Execution method '${config.method}' is not yet supported by this adapter implementation.`
    );
  }
}
