import EVMAdapter from './evm/adapter.ts';
import MidnightAdapter from './midnight/adapter.ts';
import SolanaAdapter from './solana/adapter.ts';
import StellarAdapter from './stellar/adapter.ts';

import type { ChainType, ContractSchema } from '../core/types/ContractSchema';

/**
 * Interface for contract adapters
 */
export interface ContractAdapter {
  /**
   * Load a contract from a file or address
   */
  loadContract(source: string): Promise<ContractSchema>;

  /**
   * Load a mock contract for testing
   */
  loadMockContract(): Promise<ContractSchema>;

  /**
   * Format transaction data for the specific chain
   */
  formatTransactionData(functionId: string, inputs: Record<string, unknown>): unknown;

  /**
   * Sign and broadcast a transaction
   */
  signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }>;
}

// Singleton instances of adapters
const adapters: Record<ChainType, ContractAdapter> = {
  evm: new EVMAdapter(),
  midnight: new MidnightAdapter(),
  stellar: new StellarAdapter(),
  solana: new SolanaAdapter(),
};

/**
 * Get the appropriate adapter for a given chain type
 */
export function getContractAdapter(chainType: ChainType): ContractAdapter {
  const adapter = adapters[chainType];
  if (!adapter) {
    throw new Error(`No adapter available for chain type: ${chainType}`);
  }
  return adapter;
}
