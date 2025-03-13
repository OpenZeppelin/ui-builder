import type { ContractSchema, FunctionParameter } from '../../core/types/ContractSchema';
import type { FieldType, FormField } from '../../core/types/FormTypes';
import type { ContractAdapter } from '../index';

/**
 * Solana-specific adapter implementation
 *
 * NOTE: This is just a minimal placeholder implementation. The project is currently focusing
 * exclusively on the EVM adapter. This adapter will be properly implemented in future phases
 * when we expand support to the Solana blockchain.
 */
export class SolanaAdapter implements ContractAdapter {
  /**
   * Load a contract from a file or address
   *
   * TODO: Implement actual Solana program loading logic in future phases
   */
  async loadContract(source: string): Promise<ContractSchema> {
    console.log(`[PLACEHOLDER] Loading Solana program from: ${source}`);
    return this.loadMockContract();
  }

  /**
   * Load a mock contract for testing
   *
   * TODO: Implement proper Solana program schema in future phases
   */
  async loadMockContract(): Promise<ContractSchema> {
    // Simple minimal mock contract schema
    return {
      chainType: 'solana',
      name: 'PlaceholderSolanaProgram',
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
   * Map a Solana-specific parameter type to a form field type
   *
   * TODO: Implement proper Solana type mapping in future phases
   */
  mapParameterTypeToFieldType(parameterType: string): FieldType {
    // Placeholder implementation that defaults everything to text fields
    return 'text';
  }

  /**
   * Generate default field configuration for a Solana function parameter
   *
   * TODO: Implement proper Solana field generation in future phases
   */
  generateDefaultField(parameter: FunctionParameter): FormField {
    return {
      id: Math.random().toString(36).substring(2, 11),
      name: parameter.name || 'placeholder',
      label: parameter.displayName || parameter.name || 'Placeholder Field',
      type: 'text',
      placeholder: 'Placeholder - not implemented yet',
      helperText: 'Solana adapter is not fully implemented yet',
      defaultValue: '',
      validation: { required: true },
      width: 'full',
    };
  }

  /**
   * Format transaction data for the specific chain
   *
   * TODO: Implement proper Solana transaction formatting in future phases
   */
  formatTransactionData(functionId: string, inputs: Record<string, unknown>): unknown {
    return { placeholder: 'Solana adapter not implemented yet' };
  }

  /**
   * Sign and broadcast a transaction
   *
   * TODO: Implement proper Solana transaction signing in future phases
   */
  async signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }> {
    return { txHash: 'solana_placeholder_tx' };
  }
}

// Also export as default to ensure compatibility with various import styles
export default SolanaAdapter;
