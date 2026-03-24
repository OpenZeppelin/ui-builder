import type {
  ExecutionConfig,
  MidnightNetworkConfig,
  TransactionStatusUpdate,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { MidnightContractArtifacts, WriteContractParameters } from '../types';
import { getMidnightWalletImplementation } from '../wallet';
import { EoaExecutionStrategy } from './eoa';
import type { ExecutionStrategy, MidnightExecutionConfig } from './execution-strategy';

const SYSTEM_LOG_TAG = 'adapter-midnight-sender';

/**
 * Signs and broadcasts a Midnight transaction using the wallet implementation.
 *
 * This function coordinates the complete transaction lifecycle for Midnight:
 * 1. Validates the transaction data and network configuration
 * 2. Retrieves the wallet implementation
 * 3. Selects the appropriate execution strategy (currently only EOA)
 * 4. Merges artifacts from transaction data and adapter
 * 5. Executes the transaction via the selected strategy
 *
 * @param transactionData - The formatted transaction data
 * @param executionConfig - Execution configuration (method, settings)
 * @param networkConfig - Midnight network configuration
 * @param adapterArtifacts - Contract artifacts (ZK proofs, verifier keys, etc.)
 * @param onStatusChange - Optional callback for transaction status updates
 * @param runtimeApiKey - Optional session-only API key for execution methods (currently unused; Midnight doesn't support relayers yet)
 * @param runtimeSecret - Optional runtime secret for organizer-only circuits
 * @returns Promise resolving to the transaction hash and optional result
 */
export async function signAndBroadcastMidnightTransaction(
  transactionData: unknown,
  executionConfig: ExecutionConfig,
  networkConfig: MidnightNetworkConfig,
  adapterArtifacts: MidnightContractArtifacts | null,
  onStatusChange?: (status: string, details: TransactionStatusUpdate) => void,
  runtimeApiKey?: string,
  runtimeSecret?: string
): Promise<{ txHash: string; result?: unknown }> {
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

  // --- Prepare Artifacts --- //
  // Extract artifacts from transaction data and adapter instance
  const txArtifacts = txData.transactionOptions?._artifacts;

  /**
   * Merge two artifact sources, preferring non-null values from either side.
   */
  const mergeArtifacts = (
    a?: MidnightContractArtifacts | null,
    b?: MidnightContractArtifacts | null
  ): MidnightExecutionConfig['artifacts'] | undefined => {
    if (!a && !b) return undefined;
    const left = a ?? ({} as MidnightContractArtifacts);
    const right = b ?? ({} as MidnightContractArtifacts);

    // privateStateId is optional - will be auto-generated at execution time if not provided
    const privateStateId = left.privateStateId || right.privateStateId;
    const contractModule = left.contractModule || right.contractModule;
    const witnessCode = left.witnessCode || right.witnessCode;
    const verifierKeys = left.verifierKeys || right.verifierKeys;

    // Must have at least contractModule to be valid (privateStateId is auto-generated if missing)
    if (!contractModule) {
      return undefined;
    }

    // Type is safe now after validation
    const combined: MidnightExecutionConfig['artifacts'] = {
      privateStateId,
      contractModule,
      witnessCode,
      verifierKeys,
    };

    return combined;
  };

  // Merge transaction artifacts with adapter artifacts, giving priority to transaction but filling gaps from adapter
  const combinedArtifacts = mergeArtifacts(
    (txArtifacts as MidnightContractArtifacts | undefined) ?? null,
    adapterArtifacts ?? null
  );

  if (!combinedArtifacts) {
    throw new Error('Contract artifacts are required for transaction execution but were not found');
  }

  const executionArtifacts: MidnightExecutionConfig['artifacts'] = combinedArtifacts;

  // --- Augment Execution Config --- //
  const augmentedConfig: MidnightExecutionConfig = {
    executionConfig,
    artifacts: executionArtifacts,
    networkConfig,
  };

  // --- Execute using selected strategy --- //
  return strategy.execute(
    txData,
    augmentedConfig,
    walletImplementation,
    onStatusChange || (() => {}),
    runtimeApiKey,
    runtimeSecret
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
