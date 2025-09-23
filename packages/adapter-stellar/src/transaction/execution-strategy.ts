import {
  ExecutionConfig,
  StellarNetworkConfig,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/ui-builder-types';

import type { StellarTransactionData } from './formatter';

/**
 * Defines a common interface for different transaction execution strategies.
 * This allows the adapter to remain a lean orchestrator that selects the appropriate strategy
 * at runtime based on the user's configuration.
 */
export interface ExecutionStrategy {
  /**
   * Executes a transaction according to the specific strategy.
   *
   * @param transactionData The contract call parameters, including contract address, function name, and args.
   * @param executionConfig The configuration for the selected execution method.
   * @param networkConfig The Stellar network configuration to use for the transaction.
   * @param onStatusChange A callback to report real-time status updates to the UI.
   * @param runtimeApiKey Optional session-only API key for methods like Relayer.
   * @returns A promise that resolves to an object containing the final transaction hash.
   */
  execute(
    transactionData: StellarTransactionData,
    executionConfig: ExecutionConfig,
    networkConfig: StellarNetworkConfig,
    onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }>;
}
