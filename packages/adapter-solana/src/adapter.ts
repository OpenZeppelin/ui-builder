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
      'blockchain-address',
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
   * @inheritdoc
   */
  formatTransactionData(
    _contractSchema: ContractSchema,
    _functionId: string,
    _submittedInputs: Record<string, unknown>,
    _allFieldsConfig: FormFieldType[]
  ): unknown {
    console.warn(
      'SolanaAdapter.formatTransactionData not implemented, returning placeholder data.'
    );
    // Placeholder implementation
    return { data: 'solana_formatted_placeholder' };
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

  /**
   * @inheritdoc
   * TODO: Implement actual supported methods for Solana (e.g., EOA, Squads).
   */
  async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    // Placeholder: Assume only EOA is supported for now
    console.warn('SolanaAdapter.getSupportedExecutionMethods is using placeholder implementation.');
    return Promise.resolve([
      {
        type: 'eoa',
        name: 'EOA (Wallet Account)',
        description: 'Execute using a standard Solana wallet address.',
      },
      // {
      //   type: 'multisig',
      //   name: 'Squads Protocol',
      //   description: 'Execute via the Squads multisig program.',
      //   disabled: true
      // },
    ]);
  }

  /**
   * @inheritdoc
   * TODO: Implement actual validation logic for Solana execution configs.
   */
  async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    // Placeholder: Basic validation
    console.warn('SolanaAdapter.validateExecutionConfig is using placeholder implementation.');
    if (config.method === 'eoa') {
      if (!config.allowAny && !config.specificAddress) {
        return 'Specific Solana account address is required.';
      }
      if (
        !config.allowAny &&
        config.specificAddress &&
        !this.isValidAddress(config.specificAddress)
      ) {
        return 'Invalid account address format for Solana.';
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
    // TODO: Implement properly based on Solana Program types
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
    // TODO: Implement Solana contract query functionality
    throw new Error('Solana view function queries not yet implemented');
  }

  /**
   * Formats a function result for display
   */
  formatFunctionResult(
    result: unknown,
    _functionDetails: ContractFunction
  ): string | Record<string, unknown> {
    // TODO: Implement Solana-specific result formatting
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
    return false; // Solana wallet connection not yet implemented
  }

  async getAvailableConnectors(): Promise<Connector[]> {
    return [];
  }

  async connectWallet(
    _connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    return { connected: false, error: 'Solana adapter does not support wallet connection.' };
  }

  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return { disconnected: false, error: 'Solana adapter does not support wallet connection.' };
  }

  /**
   * @inheritdoc
   */
  getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    // Stub implementation: Always return disconnected status
    return { isConnected: false };
  }

  /**
   * Gets a blockchain explorer URL for an address on Solana
   *
   * @param address The address to get the explorer URL for
   * @param _chainId Optional chain ID (not used for Solana as it uses clusters instead)
   * @returns A URL to view the address on a Solana explorer
   */
  getExplorerUrl(address: string, _chainId?: string): string | null {
    if (!address) return null;

    // Default to Solana explorer for mainnet
    return `https://explorer.solana.com/address/${address}`;
  }
}

// Also export as default to ensure compatibility with various import styles
export default SolanaAdapter;
