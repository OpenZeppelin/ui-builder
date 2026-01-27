import type { ExecutionConfig, TransactionStatusUpdate, TxStatus } from '@openzeppelin/ui-types';

import type { WriteContractParameters } from '../types/abi';
import type { EvmWalletImplementation } from './types';

/**
 * Defines a common interface for different transaction execution strategies (e.g., EOA, Relayer).
 * This allows the adapter to remain a lean orchestrator that selects the appropriate strategy
 * at runtime based on the user's configuration.
 *
 * Concrete implementations of this interface (EoaExecutionStrategy, RelayerExecutionStrategy) are
 * available in this transaction module and can be used by any EVM-compatible adapter.
 */
export interface AdapterExecutionStrategy {
  /**
   * Executes a transaction according to the specific strategy.
   *
   * @param transactionData The contract write parameters, including ABI, function name, and args.
   * @param executionConfig The configuration for the selected execution method.
   * @param walletImplementation The wallet implementation providing signing capabilities.
   * @param onStatusChange A callback to report real-time status updates to the UI.
   * @param runtimeApiKey Optional session-only API key for methods like Relayer.
   * @returns A promise that resolves to an object containing the final transaction hash.
   */
  execute(
    transactionData: WriteContractParameters,
    executionConfig: ExecutionConfig,
    walletImplementation: EvmWalletImplementation,
    onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }>;
}
