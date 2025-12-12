import type {
  ExecutionConfig,
  MidnightNetworkConfig,
  TransactionStatusUpdate,
} from '@openzeppelin/ui-builder-types';

import type { WriteContractParameters } from '../types';
import type { LaceWalletImplementation } from '../wallet/implementation/lace-implementation';

/**
 * Augmented execution config for Midnight transaction execution
 * Includes artifacts and network configuration needed for SDK operations
 */
export interface MidnightExecutionConfig {
  // Include the base execution config as a property
  executionConfig: ExecutionConfig;
  // Add Midnight-specific fields
  artifacts?: {
    // privateStateId is optional - auto-generated at execution time from contract + wallet address
    privateStateId?: string;
    contractModule: string;
    witnessCode?: string;
    verifierKeys?: Record<string, unknown>;
  };
  networkConfig?: MidnightNetworkConfig;
}

/**
 * Defines a common interface for different transaction execution strategies (e.g., EOA, Relayer).
 * This allows the adapter to remain a lean orchestrator that selects the appropriate strategy
 * at runtime based on the user's configuration.
 */
export interface ExecutionStrategy {
  /**
   * Executes a transaction according to the specific strategy.
   *
   * @param transactionData The contract write parameters, including contract address, function name, and args.
   * @param executionConfig The configuration for the selected execution method (augmented with artifacts and network).
   * @param walletImplementation The wallet implementation to use for signing.
   * @param onStatusChange A callback to report real-time status updates to the UI.
   * @param runtimeApiKey Optional session-only API key for execution methods (currently unused; Midnight doesn't support relayers yet).
   * @param runtimeSecret Optional runtime secret for organizer-only circuits.
   * @returns A promise that resolves to an object containing the final transaction hash and optional result.
   */
  execute(
    transactionData: WriteContractParameters,
    executionConfig: MidnightExecutionConfig,
    walletImplementation: LaceWalletImplementation,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string,
    runtimeSecret?: string
  ): Promise<{ txHash: string; result?: unknown }>;
}
