import type { ExecutionConfig } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

const SYSTEM_LOG_TAG = 'adapter-solana';
// Placeholder
export async function signAndBroadcastSolanaTransaction(
  _transactionData: unknown,
  executionConfig?: ExecutionConfig
): Promise<{ txHash: string }> {
  logger.warn(SYSTEM_LOG_TAG, 'signAndBroadcastSolanaTransaction not implemented');
  logger.info(
    SYSTEM_LOG_TAG,
    'Solana signAndBroadcast called with executionConfig:',
    executionConfig
  );
  // TODO: Use executionConfig
  return { txHash: 'solana_placeholder_tx' };
}

// Placeholder - Note: Optional methods aren't typically defined this way as standalone functions.
// The adapter class itself would implement the optional method from the interface.
// For refactoring, we'll define it here, but it might be better integrated differently.
export async function waitForSolanaTransactionConfirmation(
  _txHash: string
): Promise<{ status: 'success' | 'error'; receipt?: unknown; error?: Error }> {
  console.warn('waitForSolanaTransactionConfirmation not implemented');
  return { status: 'success' }; // Assume success for placeholder
}
