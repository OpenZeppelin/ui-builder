import type { ContractSchema, FunctionParameter } from '../../core/types/ContractSchema';
import type { FieldType, FormField } from '../../core/types/FormTypes';
import type { ContractAdapter } from '../index';

/**
 * Midnight-specific adapter implementation
 *
 * NOTE: This is just a minimal placeholder implementation. The project is currently focusing
 * exclusively on the EVM adapter. This adapter will be properly implemented in future phases
 * when we expand support to the Midnight blockchain.
 */
export class MidnightAdapter implements ContractAdapter {
  /**
   * Load a contract from a file or address
   *
   * TODO: Implement actual Midnight contract loading logic in future phases
   */
  async loadContract(source: string): Promise<ContractSchema> {
    console.log(`[PLACEHOLDER] Loading Midnight contract from: ${source}`);
    return this.loadMockContract();
  }

  /**
   * Load a mock contract for testing
   *
   * TODO: Implement proper Midnight contract schema in future phases
   * @param mockId Optional ID to specify which mock to load (not used for Midnight adapter)
   */
  async loadMockContract(_mockId?: string): Promise<ContractSchema> {
    // Simple minimal mock contract schema
    return {
      chainType: 'midnight',
      name: 'PlaceholderMidnightContract',
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
          modifiesState: true, // Assume this placeholder function modifies state
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
   * Map a Midnight-specific parameter type to a form field type
   *
   * TODO: Implement proper Midnight type mapping in future phases
   */
  mapParameterTypeToFieldType(_parameterType: string): FieldType {
    // Placeholder implementation that defaults everything to text fields
    return 'text';
  }

  /**
   * Generate default field configuration for a Midnight function parameter
   *
   * TODO: Implement proper Midnight field generation in future phases
   */
  generateDefaultField(parameter: FunctionParameter): FormField {
    return {
      id: Math.random().toString(36).substring(2, 11),
      name: parameter.name || 'placeholder',
      label: parameter.displayName || parameter.name || 'Placeholder Field',
      type: 'text',
      placeholder: 'Placeholder - not implemented yet',
      helperText: 'Midnight adapter is not fully implemented yet',
      defaultValue: '',
      validation: { required: true },
      width: 'full',
    };
  }

  /**
   * Format transaction data for the specific chain
   *
   * TODO: Implement proper Midnight transaction formatting in future phases
   */
  formatTransactionData(_functionId: string, _inputs: Record<string, unknown>): unknown {
    return { placeholder: 'Midnight adapter not implemented yet' };
  }

  /**
   * Sign and broadcast a transaction
   *
   * TODO: Implement proper Midnight transaction signing in future phases
   */
  async signAndBroadcast(_transactionData: unknown): Promise<{ txHash: string }> {
    return { txHash: 'midnight_placeholder_tx' };
  }

  getFieldInputType(_parameterType: string): FieldType {
    // Placeholder implementation that defaults everything to text fields
    return 'text';
  }

  buildExecuteTransaction(_functionId: string, _inputs: Record<string, unknown>): Promise<unknown> {
    // Placeholder implementation that defaults everything to text fields
    return Promise.resolve({});
  }

  parseTransactionResult(_transactionData: unknown): unknown {
    // Placeholder implementation that defaults everything to text fields
    return {};
  }
}

// Also export as default to ensure compatibility with various import styles
export default MidnightAdapter;
