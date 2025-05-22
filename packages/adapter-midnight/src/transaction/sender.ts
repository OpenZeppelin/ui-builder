import type { ExecutionConfig } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

const SYSTEM_LOG_TAG = 'adapter-midnight';

/**
 * Sign and broadcast a transaction
 *
 * TODO: Implement proper Midnight transaction signing in future phases
 */
export function signAndBroadcastMidnightTransaction(
  _transactionData: unknown,
  executionConfig?: ExecutionConfig
): Promise<{ txHash: string }> {
  logger.info(
    SYSTEM_LOG_TAG,
    'Midnight signAndBroadcast called with executionConfig:',
    executionConfig
  );
  // TODO: Use executionConfig
  return Promise.resolve({ txHash: 'midnight_placeholder_tx' });
}

/**
 * (Optional) Waits for a transaction to be confirmed on the blockchain.
 *
 * @param _txHash - The hash of the transaction to wait for.
 * @returns A promise resolving to the final status and receipt/error.
 */
export const waitForMidnightTransactionConfirmation: undefined = undefined;
// Optional methods can be implemented later if needed, for now export undefined
