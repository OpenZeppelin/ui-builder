import type {
  ExecutionConfig,
  MidnightNetworkConfig,
  TransactionStatusUpdate,
} from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { WriteContractParameters } from '../types';
import { getMidnightWalletImplementation } from '../wallet';
import { EoaExecutionStrategy } from './eoa';
import type { ExecutionStrategy } from './execution-strategy';

const SYSTEM_LOG_TAG = 'adapter-midnight-sender';

/**
 * Sign and broadcast a Midnight transaction using the appropriate execution strategy.
 * This follows the same architecture as the EVM adapter, delegating to specific
 * execution strategies based on the execution config method.
 *
 * @param transactionData - The formatted transaction data from formatMidnightTransactionData
 * @param executionConfig - Execution configuration specifying method (eoa/wallet only in v1)
 * @param networkConfig - Midnight network configuration
 * @param onStatusChange - Callback for transaction status updates
 * @param runtimeApiKey - Optional session-only API key for methods like Relayer
 * @returns Promise resolving to the transaction hash
 */
export async function signAndBroadcastMidnightTransaction(
  transactionData: unknown,
  executionConfig: ExecutionConfig,
  networkConfig: MidnightNetworkConfig,
  onStatusChange?: (status: string, details: TransactionStatusUpdate) => void,
  runtimeApiKey?: string
): Promise<{ txHash: string }> {
  logger.info(SYSTEM_LOG_TAG, 'Sign & Broadcast Midnight Tx:', {
    data: transactionData,
    executionConfig,
    networkId: networkConfig.id,
  });

  // --- Validation --- //
  if (!networkConfig || networkConfig.ecosystem !== 'midnight') {
    throw new Error('Invalid Midnight network configuration provided.');
  }

  const txData = transactionData as WriteContractParameters;
  if (!txData.contractAddress || !txData.functionName) {
    throw new Error('Transaction data is missing required fields (contractAddress, functionName).');
  }

  // --- Get Wallet Implementation --- //
  const walletImplementation = await getMidnightWalletImplementation();
  if (!walletImplementation) {
    throw new Error('Midnight wallet implementation not available.');
  }

  // --- Select Execution Strategy --- //
  let strategy: ExecutionStrategy;

  switch (executionConfig.method) {
    case 'eoa':
    default:
      strategy = new EoaExecutionStrategy();
      break;
  }

  // --- Execute using selected strategy --- //
  return strategy.execute(
    txData,
    executionConfig,
    walletImplementation,
    onStatusChange || (() => {}),
    runtimeApiKey
  );
}

/**
 * Waits for a transaction to be confirmed on the blockchain.
 * Currently not implemented for v1; deferred to future phases.
 *
 * @param _txHash - The hash of the transaction to wait for.
 * @returns A promise resolving to the final status and receipt/error.
 */
export const waitForMidnightTransactionConfirmation: undefined = undefined;
