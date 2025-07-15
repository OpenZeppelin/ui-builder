import type { ExecutionConfig } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

const SYSTEM_LOG_TAG = 'adapter-stellar';

/**
 * Sign and broadcast a transaction
 *
 * TODO: Implement proper Stellar transaction signing in future phases
 */
export function signAndBroadcastStellarTransaction(
  _transactionData: unknown,
  executionConfig?: ExecutionConfig
): Promise<{ txHash: string }> {
  logger.info(
    SYSTEM_LOG_TAG,
    'Stellar signAndBroadcast called with executionConfig:',
    executionConfig
  );
  // TODO: Use executionConfig
  return Promise.resolve({ txHash: 'stellar_placeholder_tx' });
}

/**
 * (Optional) Waits for a transaction to be confirmed on the blockchain.
 *
 * @param _txHash - The hash of the transaction to wait for.
 * @returns A promise resolving to the final status and receipt/error.
 */
export const waitForStellarTransactionConfirmation: undefined = undefined;
// Optional methods can be implemented later if needed, for now export undefined
// export function waitForStellarTransactionConfirmation(txHash: string): Promise<{
//   status: 'success' | 'error';
//   receipt?: unknown;
//   error?: Error;
// }> {
//   // Placeholder logic
//   console.warn('waitForStellarTransactionConfirmation placeholder called');
//   return Promise.resolve({ status: 'success' as const });
// }
