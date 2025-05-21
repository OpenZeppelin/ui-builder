import type { ContractFunction, ContractSchema, FunctionParameter } from '../contracts/schema';
import type { FieldType } from '../forms/fields';
import type { FormFieldType } from '../forms/form-field';
import type { NetworkConfig } from '../networks/config';

import type {
  EcosystemReactUiProviderProps,
  EcosystemSpecificReactHooks,
  EcosystemWalletComponents,
  UiKitConfiguration,
} from './ui-enhancements';

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
   * The network configuration this adapter instance is configured for.
   */
  readonly networkConfig: NetworkConfig;

  /**
   * Load a contract from a source (address or JSON ABI string).
   * The adapter instance should be pre-configured with the necessary network context.
   *
   * @param source - The contract address or JSON ABI string.
   * @returns A promise resolving to the ContractSchema.
   */
  loadContract(source: string): Promise<ContractSchema>;

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
   * @param fields - The configuration for all fields
   * @returns The formatted data payload for the blockchain transaction, suitable for signAndBroadcast.
   */
  formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    fields: FormFieldType[]
  ): unknown;

  /**
   * Sign and broadcast a transaction
   */
  signAndBroadcast: (
    transactionData: unknown,
    executionConfig?: ExecutionConfig
  ) => Promise<{ txHash: string }>;

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
   * Queries a view function on a contract.
   * The adapter instance should be pre-configured with the necessary network context.
   *
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
  formatFunctionResult(result: unknown, functionDetails: ContractFunction): string;

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
   * Gets a blockchain explorer URL for an address in this chain.
   * The adapter instance should be pre-configured with the necessary network context.
   *
   * @param address - The address to get the explorer URL for
   * @returns A URL to view the address on a blockchain explorer, or null if not supported
   */
  getExplorerUrl(address: string): string | null;

  /**
   * Optional method to subscribe to wallet connection changes
   *
   * @param callback Function to call when connection status changes
   * @returns Cleanup function to unsubscribe
   */
  onWalletConnectionChange?(
    callback: (status: { isConnected: boolean; address?: string }) => void
  ): () => void;

  /**
   * Gets a blockchain explorer URL for a transaction in this chain.
   * The adapter instance should be pre-configured with the necessary network context.
   *
   * @param txHash - The hash of the transaction to get the explorer URL for
   * @returns A URL to view the transaction on a blockchain explorer, or null if not supported
   */
  getExplorerTxUrl?(txHash: string): string | null;

  /**
   * (Optional) Waits for a transaction to be confirmed on the blockchain.
   *
   * @param txHash - The hash of the transaction to wait for.
   * @returns A promise resolving to the final status and receipt/error.
   */
  waitForTransactionConfirmation?(txHash: string): Promise<{
    status: 'success' | 'error';
    receipt?: unknown; // Chain-specific receipt object
    error?: Error;
  }>;

  // UI Facilitation Capabilities (Optional)
  /**
   * (Optional) Configures the UI kit to be used by this adapter instance.
   * This setting can influence the components and providers returned by other UI facilitation methods.
   * It's typically called by the application during initialization based on global settings or user preferences.
   *
   * @param config - The UI kit configuration, specifying the `kitName` (e.g., 'custom', 'rainbowkit')
   *                 and any `kitConfig` options specific to that kit.
   */
  configureUiKit?(config: UiKitConfiguration): void;

  /**
   * (Optional) Returns a React component that sets up the necessary UI context for this adapter's ecosystem.
   * For instance, an EVM adapter might return a component that provides WagmiProvider and QueryClientProvider.
   * If a third-party UI kit is configured (via `configureUiKit`), this provider component should also
   * compose that kit's specific provider(s) (e.g., RainbowKitProvider).
   * The returned component is expected to accept `children` props.
   *
   * @returns A React functional component that accepts children, or `undefined` if UI context facilitation is not supported or not configured.
   */
  getEcosystemReactUiContextProvider?():
    | React.ComponentType<EcosystemReactUiProviderProps>
    | undefined;

  /**
   * (Optional) Returns an object containing facade React hooks for common wallet and blockchain interactions
   * specific to this adapter's ecosystem. These hooks are designed to be used within the context
   * established by the component from `getEcosystemReactUiContextProvider`.
   * For an EVM adapter, these would typically wrap `wagmi/react` hooks to abstract direct library usage.
   *
   * @returns An object of facade hooks, or `undefined` if not supported.
   */
  getEcosystemReactHooks?(): EcosystemSpecificReactHooks | undefined;

  /**
   * (Optional) Returns an object containing standardized, ready-to-use wallet UI components for this ecosystem.
   * The actual components are sourced either from a configured third-party UI kit (specified via `configureUiKit`)
   * or are basic custom implementations provided by the adapter itself if `kitName` is 'custom' or undefined.
   * Examples include `ConnectButton`, `AccountDisplay`, `NetworkSwitcher`.
   *
   * @returns An object mapping standard component names to React components, or `undefined` if not supported or configured.
   */
  getEcosystemWalletComponents?(): EcosystemWalletComponents | undefined;
}
