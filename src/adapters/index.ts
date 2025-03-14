import EVMAdapter from './evm/adapter.ts';
import MidnightAdapter from './midnight/adapter.ts';
import SolanaAdapter from './solana/adapter.ts';
import StellarAdapter from './stellar/adapter.ts';

import type { ChainType, ContractSchema, FunctionParameter } from '../core/types/ContractSchema';
import type { FieldType, FormField } from '../core/types/FormTypes';

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
   * @param mockId Optional ID to specify which mock to load
   */
  loadMockContract(mockId?: string): Promise<ContractSchema>;

  /**
   * Map a blockchain-specific parameter type to a form field type
   * @param parameterType The blockchain parameter type (e.g., uint256, address)
   * @returns The appropriate form field type
   */
  mapParameterTypeToFieldType(parameterType: string): FieldType;

  /**
   * Generate default field configuration for a function parameter
   * @param parameter The function parameter to convert to a form field
   * @returns A form field configuration with appropriate defaults
   */
  generateDefaultField(parameter: FunctionParameter): FormField;

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
