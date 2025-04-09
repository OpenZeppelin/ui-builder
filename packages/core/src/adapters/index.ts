import type { FieldType, FormFieldType } from '@openzeppelin/transaction-form-renderer';

import EvmAdapter from './evm/adapter.ts';
import MidnightAdapter from './midnight/adapter.ts';
import SolanaAdapter from './solana/adapter.ts';
import StellarAdapter from './stellar/adapter.ts';

import type { ChainType, ContractSchema, FunctionParameter } from '../core/types/ContractSchema';

/**
 * Interface for contract adapters
 *
 * IMPORTANT: Do not add methods to implementations that are not defined in this interface!
 * Any additional helper methods should be marked as private.
 *
 * The codebase includes a custom ESLint rule that enforces this pattern:
 * - Run `pnpm lint:adapters` to check all adapter implementations
 * - See `.eslint/rules/no-extra-adapter-methods.js` for implementation details
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
   * Get only the functions that modify state (writable functions)
   * @param contractSchema The contract schema to filter
   * @returns Array of writable functions
   */
  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'];

  /**
   * Map a blockchain-specific parameter type to a form field type
   * @param parameterType The blockchain parameter type (e.g., uint256, address)
   * @returns The appropriate form field type
   */
  mapParameterTypeToFieldType(parameterType: string): FieldType;

  /**
   * Get field types compatible with a specific parameter type
   * @param parameterType The blockchain parameter type
   * @returns Array of compatible field types
   */
  getCompatibleFieldTypes(parameterType: string): FieldType[];

  /**
   * Generate default field configuration for a function parameter
   * @param parameter The function parameter to convert to a form field
   * @returns A form field configuration with appropriate defaults
   */
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormFieldType<T>;

  /**
   * Format transaction data for the specific chain,
   * considering submitted inputs and field configurations (e.g., hardcoded values).
   *
   * @param functionId The ID of the function being called.
   * @param submittedInputs The data submitted from the rendered form fields.
   * @param allFieldsConfig The configuration for ALL original fields (including hidden/hardcoded).
   * @returns The formatted data payload for the blockchain transaction.
   */
  formatTransactionData(
    functionId: string,
    submittedInputs: Record<string, unknown>,
    allFieldsConfig: FormFieldType[]
  ): unknown;

  /**
   * Sign and broadcast a transaction
   */
  signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }>;

  /**
   * Validate a blockchain address for this chain
   * @param address The address to validate
   * @returns Whether the address is valid for this chain
   */
  isValidAddress(address: string): boolean;
}

// Singleton instances of adapters
const adapters: Record<ChainType, ContractAdapter> = {
  evm: new EvmAdapter(),
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
