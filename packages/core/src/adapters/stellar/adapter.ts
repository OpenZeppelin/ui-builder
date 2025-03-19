import type { ContractSchema, FunctionParameter } from '../../core/types/ContractSchema';
import type { ContractAdapter } from '../index';
import type { FieldType, FieldValue, FormField } from '@openzeppelin/transaction-form-renderer';

/**
 * Stellar-specific adapter implementation
 *
 * NOTE: This is just a minimal placeholder implementation. The project is currently focusing
 * exclusively on the EVM adapter. This adapter will be properly implemented in future phases
 * when we expand support to the Stellar blockchain.
 */
export class StellarAdapter implements ContractAdapter {
  /**
   * Load a contract from a file or address
   *
   * TODO: Implement actual Stellar contract loading logic in future phases
   */
  async loadContract(source: string): Promise<ContractSchema> {
    console.log(`[PLACEHOLDER] Loading Stellar contract from: ${source}`);
    return this.loadMockContract();
  }

  /**
   * Load a mock contract for testing
   *
   * TODO: Implement proper Stellar contract schema in future phases
   * @param mockId Optional ID to specify which mock to load (not used for Stellar adapter)
   */
  async loadMockContract(_mockId?: string): Promise<ContractSchema> {
    // Simple minimal mock contract schema
    return {
      chainType: 'stellar',
      name: 'PlaceholderStellarContract',
      functions: [
        {
          id: 'dummy_operation',
          name: 'placeholderOperation',
          displayName: 'Placeholder Operation',
          inputs: [
            {
              name: 'dummyParam',
              type: 'string',
              displayName: 'Dummy Parameter',
            },
          ],
          type: 'function',
          modifiesState: true, // Assume this placeholder operation modifies state
        },
      ],
    };
  }

  /**
   * Get only the functions that modify state (writable functions)
   * @param contractSchema The contract schema to filter
   * @returns Array of writable functions
   */
  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    return contractSchema.functions.filter((fn) => fn.modifiesState);
  }

  /**
   * Map a Stellar-specific parameter type to a form field type
   *
   * TODO: Implement proper Stellar type mapping in future phases
   */
  mapParameterTypeToFieldType(_parameterType: string): FieldType {
    // Placeholder implementation that defaults everything to text fields
    return 'text';
  }

  /**
   * Generate default field configuration for a Stellar function parameter
   *
   * TODO: Implement proper Stellar field generation in future phases
   */
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormField<T> {
    // Default to text fields for now as a placeholder
    const fieldType = 'text' as T;

    return {
      id: Math.random().toString(36).substring(2, 11),
      name: parameter.name || 'placeholder',
      label: parameter.displayName || parameter.name || 'Placeholder Field',
      type: fieldType,
      placeholder: 'Placeholder - Stellar adapter not fully implemented yet',
      helperText: 'Stellar adapter is not fully implemented yet',
      defaultValue: '' as FieldValue<T>,
      validation: { required: true },
      width: 'full',
    };
  }

  /**
   * Format transaction data for the specific chain
   *
   * TODO: Implement proper Stellar transaction formatting in future phases
   */
  formatTransactionData(_functionId: string, _inputs: Record<string, unknown>): unknown {
    return { placeholder: 'Stellar adapter not implemented yet' };
  }

  /**
   * Sign and broadcast a transaction
   *
   * TODO: Implement proper Stellar transaction signing in future phases
   */
  async signAndBroadcast(_transactionData: unknown): Promise<{ txHash: string }> {
    return { txHash: 'stellar_placeholder_tx' };
  }

  /**
   * Validate a Stellar blockchain address
   * @param address The address to validate
   * @returns Whether the address is a valid Stellar address
   */
  isValidAddress(address: string): boolean {
    // Basic check for Stellar addresses (starts with G and is 56 chars long)
    // TODO: Use a proper Stellar SDK for validation when focusing on that chain
    return /^G[A-Z0-9]{55}$/.test(address);
  }
}

// Also export as default to ensure compatibility with various import styles
export default StellarAdapter;
