import type {
  ExecutionConfig,
  ExecutionMethodDetail,
} from '@openzeppelin/transaction-form-types/adapters';

import { isValidAddress } from '../utils';

/**
 * Get supported execution methods for Stellar.
 * TODO: Implement actual supported methods for Stellar.
 */
export function getStellarSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
  // Placeholder: Assume only EOA is supported for now
  console.warn('StellarAdapter.getSupportedExecutionMethods is using placeholder implementation.');
  return Promise.resolve([
    {
      type: 'eoa',
      name: 'Stellar Account',
      description: 'Execute using a standard Stellar account address.',
    },
  ]);
}

/**
 * Validate execution config for Stellar.
 * TODO: Implement actual validation logic for Stellar execution configs.
 */
export function validateStellarExecutionConfig(config: ExecutionConfig): Promise<true | string> {
  // Placeholder: Basic validation
  console.warn('StellarAdapter.validateExecutionConfig is using placeholder implementation.');
  if (config.method === 'eoa') {
    if (!config.allowAny && !config.specificAddress) {
      return Promise.resolve('Specific Stellar account address is required.');
    }
    if (
      !config.allowAny &&
      config.specificAddress &&
      !isValidAddress(config.specificAddress) // Assuming isValidAddress is moved to utils
    ) {
      return Promise.resolve('Invalid account address format for Stellar.');
    }
    return Promise.resolve(true);
  } else {
    // For now, consider other methods unsupported by this placeholder
    return Promise.resolve(
      `Execution method '${config.method}' is not yet supported by this adapter implementation.`
    );
  }
}
