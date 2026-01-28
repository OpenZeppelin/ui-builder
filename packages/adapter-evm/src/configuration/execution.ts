import type { ExecutionMethodDetail } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

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
