import type {
  ExecutionConfig,
  ExecutionMethodDetail,
} from '@openzeppelin/transaction-form-types/adapters';

import { isValidEvmAddress } from '../utils';

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
 * Validates the complete execution configuration object against the
 * requirements and capabilities of the EVM adapter.
 */
export async function validateEvmExecutionConfig(config: ExecutionConfig): Promise<true | string> {
  console.warn('validateEvmExecutionConfig is using placeholder implementation.');
  // TODO: Implement actual validation logic for EVM execution configs.
  switch (config.method) {
    case 'eoa': {
      if (!config.allowAny) {
        if (!config.specificAddress) {
          return 'Specific EOA address is required.';
        }
        // Use the imported utility for validation
        if (!isValidEvmAddress(config.specificAddress)) {
          return 'Invalid EOA address format.';
        }
      }
      return true;
    }
    case 'multisig': {
      // Placeholder: Accept multisig config for now
      return true;
    }
    case 'relayer': {
      // Placeholder: Accept relayer config for now
      return true;
    }
    default: {
      return `Unsupported execution method type: ${(config as ExecutionConfig).method}`;
    }
  }
}
