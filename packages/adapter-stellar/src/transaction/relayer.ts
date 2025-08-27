import type {
  ExecutionConfig,
  StellarNetworkConfig,
  TransactionStatusUpdate,
} from '@openzeppelin/contracts-ui-builder-types';

import { ExecutionStrategy } from './execution-strategy';
import type { StellarTransactionData } from './formatter';

/**
 * Relayer execution strategy for Stellar transactions.
 *
 * TODO: Implement RelayerExecutionStrategy when Stellar relayers become available.
 * This will enable gasless transaction execution by forwarding transactions
 * to a relayer service that pays for transaction fees on behalf of users.
 *
 * Similar to the EVM adapter pattern, this should:
 * - Accept transaction data and relayer configuration
 * - Format the transaction for the relayer service
 * - Submit to the relayer endpoint
 * - Poll for transaction status updates
 * - Return transaction hash and status
 *
 * @see packages/adapter-evm/src/transaction/relayer.ts for reference implementation
 */
export class RelayerExecutionStrategy implements ExecutionStrategy {
  public async execute(
    _transactionData: StellarTransactionData,
    _executionConfig: ExecutionConfig,
    _networkConfig: StellarNetworkConfig,
    _onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    throw new Error('Relayer execution strategy not yet implemented for Stellar.');
  }
}
