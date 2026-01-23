import type { ExecutionConfig, TransactionStatusUpdate, TxStatus } from '@openzeppelin/ui-types';

import type { WriteContractParameters } from '../types/abi';

/**
 * Defines a common interface for different transaction execution strategies (e.g., EOA, Relayer).
 * This allows the adapter to remain a lean orchestrator that selects the appropriate strategy
 * at runtime based on the user's configuration.
 *
 * Note: Concrete implementations of this interface (EoaStrategy, RelayerStrategy) remain in
 * adapter-evm as they depend on wallet-specific functionality.
 */
export interface ExecutionStrategy {
  /**
   * Executes a transaction according to the specific strategy.
   *
   * @param transactionData The contract write parameters, including ABI, function name, and args.
   * @param executionConfig The configuration for the selected execution method.
   * @param onStatusChange A callback to report real-time status updates to the UI.
   * @param runtimeApiKey Optional session-only API key for methods like Relayer.
   * @returns A promise that resolves to an object containing the final transaction hash.
   */
  execute(
    transactionData: WriteContractParameters,
    executionConfig: ExecutionConfig,
    onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }>;
}
