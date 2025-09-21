import type { UserExplorerConfig, UserRpcProviderConfig } from '../config';
import { type ContractFunction, type ContractSchema, type FunctionParameter } from '../contracts';
import type { ProxyInfo } from '../contracts/proxy';
import type {
  EoaExecutionConfig,
  MultisigExecutionConfig,
  RelayerDetails,
  RelayerDetailsRich,
  RelayerExecutionConfig,
} from '../execution';
import { type FieldType } from '../forms';
import { type FormFieldType } from '../forms/form-field';
import { type NetworkConfig } from '../networks';
import { TransactionStatusUpdate } from '../transactions';
import type {
  AvailableUiKit,
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

/**
 * Transaction execution configuration.
 * Note: Stored both at ContractUIRecord top-level (persistent) and in BuilderFormConfig (transient during editing).
 */
export type ExecutionConfig = EoaExecutionConfig | RelayerExecutionConfig | MultisigExecutionConfig;

/**
 * Represents a wallet connector option available for connection.
 */
export type Connector = {
  id: string;
  name: string;
};

/**
 * Base wallet connection status interface with universal properties.
 * Chain-specific adapters should extend this interface with their specific fields.
 */
export interface WalletConnectionStatus {
  /** Core connection state - always present for backward compatibility */
  isConnected: boolean;
  /** Wallet address - always present when connected */
  address?: string;
  /** Chain/network ID - format may vary by chain (number for EVM, string for others) */
  chainId?: string | number;

  /** Enhanced connection states for better UX */
  isConnecting?: boolean;
  isDisconnected?: boolean;
  isReconnecting?: boolean;
  /** Detailed status string */
  status?: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

  /** Connector/wallet information - universal across all chains */
  connector?: {
    id: string;
    name?: string;
    type?: string;
  };
}

/**
 * Minimal adapter interface for the renderer and contract interaction
 *
 * This is the base interface that all chain-specific adapters must implement.
 * It defines the core functionality needed for app rendering and contract interaction.
 */
export interface ContractAdapter {
  /**
   * The network configuration this adapter instance is configured for.
   */
  readonly networkConfig: NetworkConfig;

  /**
   * The initial kitName from AppConfigService at the time of adapter construction.
   * This provides a baseline kitName preference from the application's static/global configuration.
   * It defaults to 'custom' if no specific kitName is found in AppConfigService.
   * This value is stored on the instance to inform the first call to configureUiKit if no programmatic overrides are given.
   */
  readonly initialAppServiceKitName: UiKitConfiguration['kitName'];

  /**
   * Load a contract from a source (address or JSON ABI string).
   * The adapter instance should be pre-configured with the necessary network context.
   *
   * @param source - The contract address or JSON ABI string.
   * @returns A promise resolving to the ContractSchema.
   */
  loadContract(source: string | Record<string, unknown>): Promise<ContractSchema>;

  /**
   * (Optional) Load a contract with source metadata information.
   * Returns both the contract schema and information about how it was loaded.
   *
   * @param source - The contract artifacts/source data.
   * @returns A promise resolving to both ContractSchema and source metadata.
   */
  loadContractWithMetadata?(source: string | Record<string, unknown>): Promise<{
    schema: ContractSchema;
    source: 'fetched' | 'manual';
    metadata?: {
      fetchedFrom?: string;
      contractName?: string;
      verificationStatus?: 'verified' | 'unverified' | 'unknown';
      fetchTimestamp?: Date;
      definitionHash?: string;
    };
    /** Chain-agnostic proxy information */
    proxyInfo?: ProxyInfo;
  }>;

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
    executionConfig: ExecutionConfig,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ) => Promise<{ txHash: string }>;

  /**
   * Validate a blockchain address for this chain
   *
   * @param address - The address to validate
   * @param addressType - Optional specific address type to validate (chain-specific)
   * @returns Whether the address is valid for this chain
   */
  isValidAddress(address: string, addressType?: string): boolean;

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
   * Optionally filter which view functions are safe to auto-query without user input.
   * Adapters can exclude chain-specific management/admin functions that are likely
   * to revert or require special permissions.
   * If not implemented, the UI will assume all parameterless view functions are safe.
   */
  filterAutoQueryableFunctions?(functions: ContractFunction[]): ContractFunction[];

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
   * @param contractSchema - Optional contract schema for additional context (e.g., spec entries)
   * @returns A form field configuration with appropriate defaults
   */
  generateDefaultField(
    parameter: FunctionParameter,
    contractSchema?: ContractSchema
  ): FormFieldType;

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
   * @returns Rich status object with detailed connection state and address information
   */
  getWalletConnectionStatus(): WalletConnectionStatus;

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
    callback: (status: WalletConnectionStatus, previousStatus: WalletConnectionStatus) => void
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
   * @param options - Optional additional options including callback functions for loading configs
   */
  configureUiKit?(
    config: UiKitConfiguration,
    options?: {
      /** Optional generic function to load configuration modules by path from the consuming app's source. */
      loadUiKitNativeConfig?: (relativePath: string) => Promise<Record<string, unknown> | null>;
    }
  ): void | Promise<void>;

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

  /**
   * Gets the list of available UI kits supported by this adapter.
   *
   * @returns A promise resolving to an array of available UiKit objects.
   */
  getAvailableUiKits(): Promise<AvailableUiKit[]>;

  /**
   * (Optional) Returns adapter-provided UI label overrides for chain-specific verbiage.
   * Keys are consumed by chain-agnostic UI to avoid ecosystem-centric terms.
   * Example keys used today (non-exhaustive):
   * - relayerConfigTitle
   * - relayerConfigActiveDesc
   * - relayerConfigInactiveDesc
   * - relayerConfigPresetTitle
   * - relayerConfigPresetDesc
   * - relayerConfigCustomizeBtn
   * - detailsTitle
   * - network
   * - relayerId
   * - active
   * - paused
   * - systemDisabled
   * - balance
   * - nonce
   * - pending
   * - lastTransaction
   */
  getUiLabels?(): Record<string, string> | undefined;

  /**
   * Generates adapter-specific wallet configuration files for export.
   *
   * @param uiKitConfig The selected UI kit configuration from the builder.
   * @returns A promise resolving to a record of file paths to their content.
   */
  getExportableWalletConfigFiles?(
    uiKitConfig?: UiKitConfiguration
  ): Promise<Record<string, string>>;

  /**
   * Returns the set of supported contract definition providers for this adapter.
   * The UI can use this to present a provider selection without hardcoding
   * chain-specific values. When not implemented, the UI may fall back to
   * application configuration or hide the selector.
   *
   * Example keys: "etherscan", "sourcify".
   */
  getSupportedContractDefinitionProviders?(): Array<{ key: string; label?: string }>;

  /**
   * Returns a schema for the inputs required to define a contract.
   * This allows adapters to specify what information they need (e.g., address, ABI, artifacts).
   *
   * @returns An array of FormFieldType objects representing the required inputs.
   */
  getContractDefinitionInputs(): FormFieldType[];

  /**
   * Gets the list of available relayers for a specific service.
   *
   * @param serviceUrl The URL of the relayer service.
   * @param accessToken The access token for the relayer service.
   * @returns A promise that resolves to an array of relayer details.
   */
  getRelayers(serviceUrl: string, accessToken: string): Promise<RelayerDetails[]>;

  /**
   * Gets detailed information about a specific relayer including balance and status.
   *
   * @param serviceUrl The URL of the relayer service.
   * @param accessToken The access token for the relayer service.
   * @param relayerId The unique identifier of the relayer.
   * @returns A promise that resolves to enhanced relayer details including balance, status, and other metrics.
   */
  getRelayer(
    serviceUrl: string,
    accessToken: string,
    relayerId: string
  ): Promise<RelayerDetailsRich>;

  /**
   * (Optional) Returns a React component for configuring relayer transaction options.
   * This component should render chain-specific transaction options (e.g., gas settings for EVM).
   * The component will receive props for getting and setting the transaction options.
   *
   * @returns A React component for relayer options configuration, or undefined if not supported.
   */
  getRelayerOptionsComponent?():
    | React.ComponentType<{
        options: Record<string, unknown>;
        onChange: (options: Record<string, unknown>) => void;
      }>
    | undefined;

  /**
   * (Optional) Validates an RPC endpoint configuration.
   * Chain-specific validation logic to ensure the RPC URL and configuration are valid.
   *
   * @param rpcConfig - The RPC provider configuration to validate
   * @returns A promise resolving to true if valid, false otherwise
   */
  validateRpcEndpoint?(rpcConfig: UserRpcProviderConfig): Promise<boolean>;

  /**
   * (Optional) Tests the connection to an RPC endpoint.
   * Performs a health check on the RPC endpoint to verify connectivity and measure latency.
   *
   * @param rpcConfig - The RPC provider configuration to test
   * @returns A promise resolving to connection test results
   */
  testRpcConnection?(rpcConfig: UserRpcProviderConfig): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }>;

  /**
   * (Optional) Validates a user-provided explorer configuration.
   * Chain-specific validation logic to ensure the explorer URLs and API key are valid.
   *
   * @param explorerConfig - The explorer configuration to validate
   * @returns A promise resolving to true if valid, false otherwise
   */
  validateExplorerConfig?(explorerConfig: UserExplorerConfig): Promise<boolean>;

  /**
   * (Optional) Tests the connection to an explorer API.
   * Performs a health check on the explorer API to verify the API key works and measure latency.
   *
   * @param explorerConfig - The explorer configuration to test
   * @returns A promise resolving to connection test results
   */
  testExplorerConnection?(explorerConfig: UserExplorerConfig): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }>;

  /**
   * (Optional) Compares two contract schemas and returns detailed analysis.
   * Provides chain-specific comparison logic for detecting differences between schemas.
   *
   * @param storedSchema - The previously stored contract schema as JSON string
   * @param freshSchema - The newly fetched contract schema as JSON string
   * @returns A promise resolving to detailed comparison results
   */
  compareContractDefinitions?(
    storedSchema: string,
    freshSchema: string
  ): Promise<{
    identical: boolean;
    differences: Array<{
      type: 'added' | 'removed' | 'modified';
      section: string;
      name: string;
      details: string;
      impact: 'low' | 'medium' | 'high';
      oldSignature?: string;
      newSignature?: string;
    }>;
    severity: 'none' | 'minor' | 'major' | 'breaking';
    summary: string;
  }>;

  /**
   * (Optional) Validates contract definition structure and format for this chain.
   * Provides chain-specific validation logic for contract definitions.
   *
   * @param definition - The contract definition as JSON string to validate
   * @returns Validation result with errors and warnings
   */
  validateContractDefinition?(definition: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };

  /**
   * (Optional) Creates a deterministic hash of a contract definition for quick comparison.
   * Provides chain-specific normalization and hashing for contract definitions.
   *
   * @param definition - The contract definition as JSON string to hash
   * @returns A deterministic hash string for quick comparison
   */
  hashContractDefinition?(definition: string): string;
}
