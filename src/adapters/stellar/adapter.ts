import type { ContractSchema, FunctionParameter } from '../../core/types/ContractSchema';
import type { FieldType, FormField } from '../../core/types/FormTypes';
import type { ContractAdapter } from '../index';

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
   */
  async loadMockContract(): Promise<ContractSchema> {
    // Simple minimal mock contract schema
    return {
      chainType: 'stellar',
      name: 'PlaceholderStellarContract',
      functions: [
        {
          id: 'dummy_function',
          name: 'placeholderFunction',
          displayName: 'Placeholder Function',
          inputs: [
            {
              name: 'dummyParam',
              type: 'string',
              displayName: 'Dummy Parameter',
            },
          ],
          type: 'function',
          stateMutability: 'nonpayable',
        },
      ],
    };
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
  generateDefaultField(parameter: FunctionParameter): FormField {
    return {
      id: Math.random().toString(36).substring(2, 11),
      name: parameter.name || 'placeholder',
      label: parameter.displayName || parameter.name || 'Placeholder Field',
      type: 'text',
      placeholder: 'Placeholder - not implemented yet',
      helperText: 'Stellar adapter is not fully implemented yet',
      defaultValue: '',
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
}

// Also export as default to ensure compatibility with various import styles
export default StellarAdapter;
