import type { ContractFunction, ContractSchema, FunctionParameter } from '../contracts';
import type { FieldType, FormFieldType } from '../forms';

// Base types and interfaces for adapters will be defined here.

export type ExecutionMethodType = 'eoa' | 'relayer' | 'multisig'; // Extendable

export interface ExecutionMethodDetail {
  type: ExecutionMethodType;
  name: string;
  description?: string;
  disabled?: boolean;
}

export interface EoaExecutionConfig {
  method: 'eoa';
  allowAny: boolean;
  specificAddress?: string;
}

export interface RelayerExecutionConfig {
  method: 'relayer';
}

export interface MultisigExecutionConfig {
  method: 'multisig';
}

export type ExecutionConfig = EoaExecutionConfig | RelayerExecutionConfig | MultisigExecutionConfig;

/**
 * Represents a wallet connector option available for connection.
 */
export type Connector = {
  id: string;
  name: string;
};

/**
 * Minimal adapter interface for the form renderer and contract interaction
 *
 * This is the base interface that all chain-specific adapters must implement.
 * It defines the core functionality needed for form rendering and contract interaction.
 */
export interface ContractAdapter {
  /**
   * Load a contract from a source (address or JSON ABI string)
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
   * @param parameterType The blockchain parameter type
   * @returns The appropriate form field type
   */
  mapParameterTypeToFieldType(parameterType: string): FieldType;

  /**
   * Format transaction data for the specific chain,
   * considering submitted inputs and field configurations.
   *
   * @param contractSchema - The schema of the contract containing the function.
   * @param functionId - The ID of the function being called
   * @param submittedInputs - The data submitted from the rendered form fields
   * @param allFieldsConfig - The configuration for all fields
   * @returns The formatted data payload for the blockchain transaction, suitable for signAndBroadcast.
   */
  formatTransactionData(
    contractSchema: ContractSchema,
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
   *
   * @param address - The address to validate
   * @returns Whether the address is valid for this chain
   */
  isValidAddress(address: string): boolean;

  /**
   * Returns details for execution methods supported by this chain adapter.
   */
  getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]>;

  /**
   * Validates the complete execution configuration object against the
   * requirements and capabilities of this chain adapter.
   *
   * @param config - The execution configuration object
   * @returns A promise resolving to true if valid, or an error message if invalid
   */
  validateExecutionConfig(config: ExecutionConfig): Promise<true | string>;

  /**
   * Determines if a function is a view/pure function (read-only)
   * @param functionDetails The function details
   * @returns True if the function is read-only
   */
  isViewFunction(functionDetails: ContractFunction): boolean;

  /**
   * Queries a view function on a contract
   * @param contractAddress The contract address
   * @param functionId The function identifier
   * @param params Optional parameters for the function call
   * @param contractSchema Optional pre-loaded contract schema
   * @returns The query result
   */
  queryViewFunction(
    contractAddress: string,
    functionId: string,
    params?: unknown[],
    contractSchema?: ContractSchema
  ): Promise<unknown>;

  /**
   * Formats a function result for display
   * @param result The raw result from the contract
   * @param functionDetails The function details
   * @returns Formatted result ready for display
   */
  formatFunctionResult(
    result: unknown,
    functionDetails: ContractFunction
  ): string | Record<string, unknown>;

  /**
   * Get field types compatible with a specific parameter type
   *
   * @param parameterType - The blockchain parameter type
   * @returns Array of compatible field types
   */
  getCompatibleFieldTypes(parameterType: string): FieldType[];

  /**
   * Generate default field configuration for a function parameter
   *
   * @param parameter - The function parameter to convert to a form field
   * @returns A form field configuration with appropriate defaults
   */
  generateDefaultField(parameter: FunctionParameter): FormFieldType;

  /**
   * Indicates if this adapter supports wallet connection
   *
   * @returns Whether wallet connection is supported by this adapter
   */
  supportsWalletConnection(): boolean;

  /**
   * Gets the list of available wallet connectors supported by this adapter.
   *
   * The UI can use this list to present connection options to the user.
   * Each connector should have a unique ID and a user-friendly name.
   *
   * @returns A promise resolving to an array of available Connector objects.
   *          Returns an empty array if wallet connection is not supported or no connectors are found.
   */
  getAvailableConnectors(): Promise<Connector[]>;

  /**
   * Initiates the wallet connection process for a specific, chosen connector.
   *
   * @param connectorId The unique identifier (e.g., Wagmi's `uid`) of the connector
   *                    selected by the user from the list provided by `getAvailableConnectors`.
   * @returns A promise resolving to an object indicating the connection result:
   *          - `connected`: `true` if successful, `false` otherwise.
   *          - `address`: The connected wallet address if successful.
   *          - `error`: An error message if the connection failed.
   */
  connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }>;

  /**
   * Disconnects the currently connected wallet
   * @returns Disconnection result object
   */
  disconnectWallet(): Promise<{ disconnected: boolean; error?: string }>;

  /**
   * Gets current wallet connection status
   *
   * @returns Status object with connection state and address
   */
  getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string };

  /**
   * Gets a blockchain explorer URL for an address in this chain
   *
   * @param address - The address to get the explorer URL for
   * @param chainId - Optional chain ID if the adapter supports multiple chains
   * @returns A URL to view the address on a blockchain explorer, or null if not supported
   */
  getExplorerUrl(address: string, chainId?: string): string | null;

  /**
   * Optional method to subscribe to wallet connection changes
   *
   * @param callback Function to call when connection status changes
   * @returns Cleanup function to unsubscribe
   */
  onWalletConnectionChange?(
    callback: (status: { isConnected: boolean; address?: string }) => void
  ): () => void;
}
