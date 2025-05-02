import type {
  Connector,
  ContractAdapter,
  ExecutionConfig,
  ExecutionMethodDetail,
} from '@openzeppelin/transaction-form-types/adapters';
import type {
  ContractFunction,
  ContractSchema,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types/contracts';
import type {
  FieldType,
  FieldValue,
  FormFieldType,
} from '@openzeppelin/transaction-form-types/forms';

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
   * Get field types compatible with a specific parameter type
   * @param _parameterType The blockchain parameter type
   * @returns Array of compatible field types
   *
   * TODO: Implement proper Midnight field type compatibility in future phases
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
      'blockchain-address',
      'amount',
      'hidden',
    ];
  }

  /**
   * Generate default field configuration for a Midnight function parameter
   *
   * TODO: Implement proper Midnight field generation in future phases
   */
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormFieldType<T> {
    // Default to text fields for now
    const fieldType = 'text' as T;

    return {
      id: Math.random().toString(36).substring(2, 11),
      name: parameter.name || 'placeholder',
      label: parameter.displayName || parameter.name || 'Placeholder Field',
      type: fieldType,
      placeholder: 'Placeholder - not implemented yet',
      helperText: 'Midnight adapter is not fully implemented yet',
      defaultValue: '' as FieldValue<T>,
      validation: { required: true },
      width: 'full',
    };
  }

  /**
   * @inheritdoc
   */
  formatTransactionData(
    _contractSchema: ContractSchema,
    _functionId: string,
    _submittedInputs: Record<string, unknown>,
    _allFieldsConfig: FormFieldType[]
  ): unknown {
    console.warn(
      'MidnightAdapter.formatTransactionData not implemented, returning placeholder data.'
    );
    // Placeholder implementation
    return { data: 'midnight_formatted_placeholder' };
  }

  /**
   * Sign and broadcast a transaction
   *
   * TODO: Implement proper Midnight transaction signing in future phases
   */
  async signAndBroadcast(_transactionData: unknown): Promise<{ txHash: string }> {
    return { txHash: 'midnight_placeholder_tx' };
  }

  /**
   * Validate a Midnight blockchain address
   * @param address The address to validate
   * @returns Whether the address is a valid Midnight address
   */
  isValidAddress(_address: string): boolean {
    // TODO: Implement Midnight address validation when chain specs are available
    // For now, return true to avoid blocking development
    return true;
  }

  /**
   * @inheritdoc
   * TODO: Implement actual supported methods for Midnight.
   */
  async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    // Placeholder: Assume only EOA is supported for now
    console.warn(
      'MidnightAdapter.getSupportedExecutionMethods is using placeholder implementation.'
    );
    return Promise.resolve([
      {
        type: 'eoa',
        name: 'EOA (Midnight Account)',
        description: 'Execute using a standard Midnight account.',
      },
    ]);
  }

  /**
   * @inheritdoc
   * TODO: Implement actual validation logic for Midnight execution configs.
   */
  async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    // Placeholder: Basic validation
    console.warn('MidnightAdapter.validateExecutionConfig is using placeholder implementation.');
    if (config.method === 'eoa') {
      if (!config.allowAny && !config.specificAddress) {
        return 'Specific EOA address is required.';
      }
      if (
        !config.allowAny &&
        config.specificAddress &&
        !this.isValidAddress(config.specificAddress)
      ) {
        return 'Invalid EOA address format for Midnight.';
      }
      return true;
    } else {
      // For now, consider other methods unsupported by this placeholder
      return `Execution method '${config.method}' is not yet supported by this adapter implementation.`;
    }
  }

  /**
   * Determines if a function is a view/pure function (read-only)
   */
  isViewFunction(_functionDetails: ContractFunction): boolean {
    // TODO: Implement properly based on Midnight contract types
    return false; // Temporary placeholder
  }

  /**
   * Queries a view function on a contract
   */
  async queryViewFunction(
    _contractAddress: string,
    _functionId: string,
    _params: unknown[] = [],
    _contractSchema?: ContractSchema
  ): Promise<unknown> {
    // TODO: Implement Midnight contract query functionality
    throw new Error('Midnight view function queries not yet implemented');
  }

  /**
   * Formats a function result for display
   */
  formatFunctionResult(
    result: unknown,
    _functionDetails: ContractFunction
  ): string | Record<string, unknown> {
    // TODO: Implement Midnight-specific result formatting
    if (result === null || result === undefined) {
      return 'No data';
    }

    return String(result);
  }

  /**
   * Indicates if this adapter supports wallet connection
   * @returns Whether wallet connection is supported by this adapter
   */
  supportsWalletConnection(): boolean {
    return false; // Midnight adapter does not support wallet connection yet
  }

  async getAvailableConnectors(): Promise<Connector[]> {
    return [];
  }

  async connectWallet(
    _connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    return { connected: false, error: 'Midnight adapter does not support wallet connection.' };
  }

  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return { disconnected: false, error: 'Midnight adapter does not support wallet connection.' };
  }

  /**
   * @inheritdoc
   */
  getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    // Stub implementation: Always return disconnected status
    return { isConnected: false };
  }

  /**
   * Gets a blockchain explorer URL for an address on Midnight
   *
   * @param address The address to get the explorer URL for
   * @param _chainId Optional chain ID (not used for Midnight yet)
   * @returns A URL to view the address on a block explorer, or null if not available
   */
  getExplorerUrl(_address: string, _chainId?: string): string | null {
    // Placeholder: Replace with actual Midnight explorer URL structure if available
    return null;
  }

  /**
   * Gets a blockchain explorer URL for a transaction in this chain
   *
   * @param txHash - The hash of the transaction to get the explorer URL for
   * @returns A URL to view the transaction on a blockchain explorer, or null if not supported
   */
  getExplorerTxUrl?(_txHash: string): string | null {
    // Placeholder: Replace with actual Midnight explorer URL structure for transactions if available
    return null;
  }

  /**
   * (Optional) Waits for a transaction to be confirmed on the blockchain.
   *
   * @param txHash - The hash of the transaction to wait for.
   * @returns A promise resolving to the final status and receipt/error.
   */
  waitForTransactionConfirmation?(txHash: string): Promise<{
    status: 'success' | 'error';
    receipt?: unknown;
    error?: Error;
  }>;
}

// Also export as default to ensure compatibility with various import styles
export default MidnightAdapter;
