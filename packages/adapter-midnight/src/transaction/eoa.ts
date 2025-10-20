import type { ExecutionConfig, TransactionStatusUpdate } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { WriteContractParameters } from '../types';
import type { LaceWalletImplementation } from '../wallet/implementation/lace-implementation';
import type { ExecutionStrategy } from './execution-strategy';

const SYSTEM_LOG_TAG = 'MidnightEoaExecutionStrategy';

/**
 * Implements the ExecutionStrategy for wallet-only (EOA) transaction execution.
 * This strategy involves signing and submitting a transaction directly from the user's
 * connected Midnight wallet, which is the most common way of interacting with Midnight.
 *
 * In v1, this is a placeholder that validates wallet connectivity and returns a
 * placeholder transaction hash. Full SDK transaction building (prepare → balance → prove → submit)
 * is deferred to future phases.
 */
export class EoaExecutionStrategy implements ExecutionStrategy {
  public async execute(
    _transactionData: WriteContractParameters,
    _executionConfig: ExecutionConfig,
    walletImplementation: LaceWalletImplementation,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    logger.info(SYSTEM_LOG_TAG, 'Using EOA execution strategy.');

    try {
      // Get the wallet API
      const walletApi = walletImplementation.getApi();
      if (!walletApi) {
        throw new Error('Wallet not connected. Please connect a wallet first.');
      }

      // Get wallet state to ensure connectivity
      const walletState = await walletApi.state();
      if (!walletState || !walletState.address) {
        throw new Error('Unable to retrieve wallet state. Wallet may be locked or disconnected.');
      }

      logger.info(SYSTEM_LOG_TAG, `Connected wallet address: ${walletState.address}`);

      // Notify UI that we're pending signature
      onStatusChange('pendingSignature', {});

      // --- v1 Note: Actual transaction building is deferred --- //
      // In v1, the strategy focuses on wallet connectivity validation.
      // The actual transaction building using the Midnight SDK (prepare, balance, prove, submit)
      // will be implemented when the builder integrates the full SDK providers.
      // For now, we acknowledge the transaction intent and return a placeholder.
      // This allows the builder to complete the write form and export flows.

      logger.debug(SYSTEM_LOG_TAG, 'Transaction building deferred to full SDK integration.');

      // Return a placeholder transaction hash for v1
      // In future phases, this will be replaced with actual transaction submission
      const txHash = `midnight_tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      logger.info(SYSTEM_LOG_TAG, `Transaction initiated (v1 placeholder): ${txHash}`);

      // Notify UI of pending confirmation
      onStatusChange('pendingConfirmation', { txHash });

      return { txHash };
    } catch (error) {
      logger.error(SYSTEM_LOG_TAG, 'Error during EOA transaction execution:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown EOA transaction error';
      throw new Error(`Transaction failed (EOA): ${errorMessage}`);
    }
  }
}
