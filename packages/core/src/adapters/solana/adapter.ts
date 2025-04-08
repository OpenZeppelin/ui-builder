import type { FieldType, FieldValue, FormFieldType } from '@openzeppelin/transaction-form-renderer';

import type { ContractSchema, FunctionParameter } from '../../core/types/ContractSchema';
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
   * @param mockId Optional ID to specify which mock to load (not used for Solana adapter)
   */
  async loadMockContract(_mockId?: string): Promise<ContractSchema> {
    // Simple minimal mock contract schema
    return {
      chainType: 'solana',
      name: 'PlaceholderSolanaProgram',
      functions: [
        {
          id: 'dummy_instruction',
          name: 'placeholderInstruction',
          displayName: 'Placeholder Instruction',
          inputs: [
            {
              name: 'dummyParam',
              type: 'string',
              displayName: 'Dummy Parameter',
            },
          ],
          type: 'function',
          modifiesState: true, // Assume this placeholder instruction modifies state
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
   * Map a Solana-specific parameter type to a form field type
   *
   * TODO: Implement proper Solana type mapping in future phases
   */
  mapParameterTypeToFieldType(_parameterType: string): FieldType {
    // Placeholder implementation that defaults everything to text fields
    return 'text';
  }

  /**
   * Get field types compatible with a specific parameter type
   * @param _parameterType The blockchain parameter type
   * @returns Array of compatible field types
   *
   * TODO: Implement proper Solana field type compatibility in future phases
   */
  getCompatibleFieldTypes(_parameterType: string): FieldType[] {
    // Placeholder implementation that returns all field types
    return [
      'text',
      'number',
      'checkbox',
      'radio',
      'select',
      'textarea',
      'date',
      'email',
      'password',
      'address',
      'amount',
      'hidden',
    ];
  }

  /**
   * Generate default field configuration for a Solana function parameter
   *
   * TODO: Implement proper Solana field generation in future phases
   */
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormFieldType<T> {
    // Default to text fields for now as a placeholder
    const fieldType = 'text' as T;

    return {
      id: Math.random().toString(36).substring(2, 11),
      name: parameter.name || 'placeholder',
      label: parameter.displayName || parameter.name || 'Placeholder Field',
      type: fieldType,
      placeholder: 'Placeholder - Solana adapter not fully implemented yet',
      helperText: 'Solana adapter is not fully implemented yet',
      defaultValue: '' as FieldValue<T>,
      validation: { required: true },
      width: 'full',
    };
  }

  /**
   * Format transaction data for the specific chain
   *
   * TODO: Implement proper Solana transaction formatting in future phases
   */
  formatTransactionData(_functionId: string, _inputs: Record<string, unknown>): unknown {
    return { placeholder: 'Solana adapter not implemented yet' };
  }

  /**
   * Sign and broadcast a transaction
   *
   * TODO: Implement proper Solana transaction signing in future phases
   */
  async signAndBroadcast(_transactionData: unknown): Promise<{ txHash: string }> {
    return { txHash: 'solana_placeholder_tx' };
  }

  /**
   * Validate a Solana blockchain address
   * @param address The address to validate
   * @returns Whether the address is a valid Solana address
   */
  isValidAddress(address: string): boolean {
    // Basic check for Solana addresses (Base58 encoded, 32-44 characters)
    // TODO: Use a proper Solana address validation library when focusing on that chain
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
}

// Also export as default to ensure compatibility with various import styles
export default SolanaAdapter;
