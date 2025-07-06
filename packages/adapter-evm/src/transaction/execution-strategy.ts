import { ExecutionConfig, TransactionStatusUpdate } from '@openzeppelin/transaction-form-types';

import { WriteContractParameters } from '../types';
import { WagmiWalletImplementation } from '../wallet/implementation/wagmi-implementation';

/**
 * Defines a common interface for different transaction execution strategies (e.g., EOA, Relayer).
 * This allows the adapter to remain a lean orchestrator that selects the appropriate strategy
 * at runtime based on the user's configuration.
 */
export interface ExecutionStrategy {
  /**
   * Executes a transaction according to the specific strategy.
   *
   * @param transactionData The contract write parameters, including ABI, function name, and args.
   * @param executionConfig The configuration for the selected execution method.
   * @param walletImplementation The wallet implementation to use for signing. Even for strategies
   * that do not require a direct wallet signature for gas (like some relayers), this is kept
   * as a required parameter to support meta-transactions, which still need a user's signature
   * on the transaction data itself. This ensures a consistent interface and future-proofs the
   * architecture for more advanced relayer patterns.
   * @param onStatusChange A callback to report real-time status updates to the UI.
   * @param runtimeApiKey Optional session-only API key for methods like Relayer.
   * @returns A promise that resolves to an object containing the final transaction hash.
   */
  execute(
    transactionData: WriteContractParameters,
    executionConfig: ExecutionConfig,
    walletImplementation: WagmiWalletImplementation,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }>;
}
