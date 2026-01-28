/**
 * API Contract: adapter-evm-core Module Exports
 *
 * This file defines the public API surface of the adapter-evm-core package.
 * All exports listed here MUST be available from '@openzeppelin/ui-builder-adapter-evm-core'.
 *
 * This serves as the contract between adapter-evm-core and consuming adapters.
 *
 * ## Module Structure (as of 2026-01-25)
 *
 * - **abi/**: ABI loading, transformation, and comparison
 * - **mapping/**: Type mapping and form field generation
 * - **transform/**: Input parsing and output formatting
 * - **query/**: View function querying
 * - **transaction/**: Transaction formatting, execution strategies (EOA/Relayer), sender functions
 * - **wallet/**: RainbowKit config generation utilities ONLY (no execution logic)
 * - **configuration/**: RPC and Explorer configuration
 * - **proxy/**: Proxy detection and implementation resolution
 * - **validation/**: Execution configuration validation
 * - **utils/**: Utility functions
 * - **types/**: TypeScript type definitions
 */

import type { AbiFunction, AbiParameter, Address } from 'viem';
import type React from 'react';

import type {
  ContractFunction,
  ContractSchema,
  EvmNetworkConfig,
  ExecutionConfig,
  FieldType,
  FormFieldType,
  FunctionParameter,
  RelayerDetails,
  RelayerDetailsRich,
  TransactionStatusUpdate,
  TxStatus,
  UiKitConfiguration,
  UserExplorerConfig,
  UserRpcProviderConfig,
} from '@openzeppelin/ui-types';

// =============================================================================
// ABI MODULE
// =============================================================================

/**
 * Contract artifacts required for loading EVM contracts
 */
export interface EvmContractArtifacts {
  /** The deployed contract address (required) */
  contractAddress: string;
  /** Optional manual ABI JSON string (for unverified contracts) */
  contractDefinition?: string;
  /** Optional proxy detection configuration */
  __proxyDetectionOptions?: {
    skipProxyDetection?: boolean;
  };
  /** Optional forced provider for this load attempt */
  __forcedProvider?: EvmContractDefinitionProviderKey;
}

/**
 * Result from loading an EVM contract
 */
export interface EvmContractLoadResult {
  schema: ContractSchema;
  source: 'fetched' | 'manual';
  contractDefinitionOriginal?: string;
  metadata?: {
    fetchedFrom?: string;
    contractName?: string;
    verificationStatus?: string;
    fetchTimestamp?: Date;
    definitionHash?: string;
  };
  proxyInfo?: EvmProxyInfo;
}

/**
 * Options for contract loading behavior
 */
export interface ContractLoadOptions {
  /** Skip proxy detection and load the contract ABI as-is */
  skipProxyDetection?: boolean;
  /** Force treating the address as an implementation contract */
  treatAsImplementation?: boolean;
}

/**
 * Load a contract's schema from artifacts using configured providers
 * @param artifacts - Contract artifacts including address and optional ABI
 * @param networkConfig - Network configuration with API endpoints
 * @param options - Optional loading behavior options
 * @returns EvmContractLoadResult with schema, metadata, and proxy info
 */
export declare function loadEvmContract(
  artifacts: EvmContractArtifacts,
  networkConfig: EvmNetworkConfig,
  options?: ContractLoadOptions
): Promise<EvmContractLoadResult>;

/**
 * Result from Etherscan ABI fetch
 */
export interface EtherscanAbiResult {
  schema: ContractSchema;
  originalAbi: string;
}

/**
 * Result from Sourcify ABI fetch
 */
export interface SourcifyAbiResult {
  schema: ContractSchema;
  originalAbi: string;
}

/**
 * Load ABI from Etherscan (auto-selects V1 or V2 based on network config)
 */
export declare function loadAbiFromEtherscan(
  address: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<EtherscanAbiResult>;

/**
 * Load ABI from Etherscan V1 API (legacy)
 */
export declare function loadAbiFromEtherscanV1(
  address: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<EtherscanAbiResult>;

/**
 * Load ABI from Etherscan V2 unified API
 */
export declare function loadAbiFromEtherscanV2(
  address: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<EtherscanAbiResult>;

/**
 * Load ABI from Sourcify
 */
export declare function loadAbiFromSourcify(
  address: string,
  networkConfig: TypedEvmNetworkConfig,
  timeoutMs?: number
): Promise<SourcifyAbiResult>;

/**
 * Transform raw ABI to ContractSchema
 */
export declare function transformAbiToSchema(
  abi: readonly AbiItem[],
  contractName: string,
  address?: string
): ContractSchema;

/**
 * Create ABI function item from ContractFunction
 */
export declare function createAbiFunctionItem(functionDetails: ContractFunction): AbiFunction;

/**
 * ABI comparison service for comparing contract definitions
 */
export declare class AbiComparisonService {
  compare(abiA: readonly AbiItem[], abiB: readonly AbiItem[]): AbiComparisonResult;
}

export interface AbiComparisonResult {
  isEqual: boolean;
  differences: AbiDifference[];
}

export interface AbiDifference {
  type: 'added' | 'removed' | 'modified';
  item: AbiItem;
  details?: string;
}

// =============================================================================
// MAPPING MODULE
// =============================================================================

/**
 * Map EVM parameter type to form field type
 */
export declare function mapEvmParamTypeToFieldType(paramType: string): FieldType;

/**
 * Get compatible field types for a parameter type
 */
export declare function getEvmCompatibleFieldTypes(paramType: string): FieldType[];

/**
 * Generate default field configuration for an EVM function parameter
 * @param parameter - The function parameter definition
 * @returns FormFieldType configuration
 */
export declare function generateEvmDefaultField(parameter: FunctionParameter): FormFieldType;

/**
 * Get type mapping metadata
 */
export declare function getEvmTypeMappingInfo(): {
  supportedTypes: string[];
  mappings: Record<string, FieldType>;
};

/**
 * Type mapping constants
 */
export declare const EVM_TYPE_TO_FIELD_TYPE: Record<string, FieldType>;

// =============================================================================
// TRANSFORM MODULE
// =============================================================================

/**
 * Parse user input string to blockchain-compatible value
 * @param param - The function parameter definition with type info
 * @param rawValue - The raw value from form input
 * @param isRecursive - Internal flag for recursive calls
 * @returns Parsed value suitable for ABI encoding
 */
export declare function parseEvmInput(
  param: FunctionParameter,
  rawValue: unknown,
  isRecursive?: boolean
): unknown;

/**
 * Format blockchain result for display
 * @param decodedValue - The decoded value from contract call
 * @param functionDetails - The function definition with output types
 * @returns Formatted string for display
 */
export declare function formatEvmFunctionResult(
  decodedValue: unknown,
  functionDetails: ContractFunction
): string;

// =============================================================================
// QUERY MODULE
// =============================================================================

/**
 * Query a view/pure function
 */
export declare function queryEvmViewFunction(
  contractAddress: string,
  functionId: string,
  params: unknown[],
  schema: ContractSchema,
  rpcUrl: string
): Promise<unknown>;

/**
 * Check if function is view/pure
 */
export declare function isEvmViewFunction(func: { stateMutability?: string }): boolean;

// =============================================================================
// TRANSACTION MODULE
// =============================================================================
// Contains: formatting, execution strategies (EOA/Relayer), sender functions,
// and the EvmWalletImplementation interface that adapters must implement.

/**
 * EVM transaction data structure
 */
export interface EvmTransactionData {
  to: Address;
  data: `0x${string}`;
  value?: bigint;
}

/**
 * Format transaction data from inputs
 */
export declare function formatEvmTransactionData(
  contractAddress: string,
  functionId: string,
  params: unknown[],
  schema: ContractSchema
): EvmTransactionData;

/**
 * Wallet connection status type for EVM wallets.
 */
export type EvmWalletConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'reconnecting';

/**
 * Interface that adapters must implement to provide wallet functionality.
 * This is an INTERFACE (not a class) - each adapter creates its own implementation.
 *
 * Examples:
 * - adapter-evm: WagmiWalletImplementation in src/wallet/implementation/
 * - adapter-polkadot: PolkadotWalletImplementation in src/wallet/implementation.ts
 */
export interface EvmWalletImplementation {
  /** Get a wallet client for signing transactions */
  getWalletClient(): Promise<unknown>;

  /** Get the current connected address */
  getConnectedAddress(): string | null;

  /** Get the current chain ID */
  getCurrentChainId(): number | null;

  /** Get wallet connection status */
  getConnectionStatus(): EvmWalletConnectionStatus;

  /** Switch to a specific chain */
  switchChain(chainId: number): Promise<void>;
}

/**
 * Execution strategy interface for transaction execution.
 * Implementations use EvmWalletImplementation for signing.
 */
export interface AdapterExecutionStrategy {
  execute(
    transactionData: WriteContractParameters,
    executionConfig: ExecutionConfig,
    walletImplementation: EvmWalletImplementation,
    onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }>;
}

/**
 * EOA (Externally Owned Account) execution strategy.
 * Signs and broadcasts transactions directly from the connected wallet.
 */
export declare class EoaExecutionStrategy implements AdapterExecutionStrategy {
  execute(
    transactionData: WriteContractParameters,
    executionConfig: ExecutionConfig,
    walletImplementation: EvmWalletImplementation,
    onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }>;
}

/**
 * Relayer transaction options (gas settings, speed, etc.)
 */
export interface EvmRelayerTransactionOptions {
  speed?: 'slow' | 'normal' | 'fast';
  gasLimit?: number;
  gasPrice?: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
}

/**
 * Relayer execution strategy.
 * Submits transactions through a relayer service for gas sponsorship.
 */
export declare class RelayerExecutionStrategy implements AdapterExecutionStrategy {
  execute(
    transactionData: WriteContractParameters,
    executionConfig: ExecutionConfig,
    walletImplementation: EvmWalletImplementation,
    onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }>;

  getEvmRelayers(
    serviceUrl: string,
    accessToken: string,
    networkConfig: TypedEvmNetworkConfig
  ): Promise<RelayerDetails[]>;

  getEvmRelayer(
    serviceUrl: string,
    accessToken: string,
    relayerId: string,
    networkConfig: TypedEvmNetworkConfig
  ): Promise<RelayerDetailsRich>;
}

/**
 * Sign and broadcast an EVM transaction using the provided wallet implementation.
 */
export declare function signAndBroadcastEvmTransaction(
  transactionData: WriteContractParameters,
  walletImplementation: EvmWalletImplementation,
  targetChainId: number,
  executionConfig?: ExecutionConfig
): Promise<{ txHash: string }>;

/**
 * Wait for transaction confirmation.
 */
export declare function waitForEvmTransactionConfirmation(
  txHash: string,
  walletImplementation: EvmWalletImplementation,
  chainId: number,
  onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void
): Promise<void>;

// =============================================================================
// WALLET MODULE
// =============================================================================
// Contains wallet infrastructure for EVM-compatible adapters:
// - WagmiWalletImplementation class
// - RainbowKit configuration utilities
// - UI kit management factories
// - Wallet UI components and hooks

/**
 * Wagmi provider context for initialization state.
 */
export declare const WagmiProviderInitializedContext: React.Context<boolean>;

/**
 * Hook to check if Wagmi provider is initialized.
 */
export declare function useIsWagmiProviderInitialized(): boolean;

/**
 * Safe wrapper component for Wagmi-dependent components.
 */
export declare const SafeWagmiComponent: React.ComponentType<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}>;

/**
 * Custom wallet UI components (for adapter customization).
 */
export declare const CustomConnectButton: React.ComponentType<ConnectButtonProps>;
export declare const ConnectorDialog: React.ComponentType<unknown>;
export declare const CustomAccountDisplay: React.ComponentType<unknown>;
export declare const CustomNetworkSwitcher: React.ComponentType<unknown>;

export interface ConnectButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Core connection utility for ensuring correct network.
 */
export declare function connectAndEnsureCorrectNetworkCore(
  targetChainId: number,
  walletImplementation: EvmWalletImplementation
): Promise<void>;

export declare const DEFAULT_DISCONNECTED_STATUS: EvmWalletConnectionStatus;

/**
 * Wagmi wallet implementation class.
 * Provides a ready-to-use implementation of EvmWalletImplementation.
 */
export declare class WagmiWalletImplementation implements EvmWalletImplementation {
  constructor(config: WagmiWalletConfig);
  getWalletClient(): Promise<unknown>;
  getConnectedAddress(): string | null;
  getCurrentChainId(): number | null;
  getConnectionStatus(): EvmWalletConnectionStatus;
  switchChain(chainId: number): Promise<void>;
}

export type GetWagmiConfigForRainbowKitFn = () => unknown;

export interface WagmiWalletConfig {
  chains: WagmiConfigChains;
  projectId?: string;
}

export type WagmiConfigChains = readonly unknown[];

export interface WalletNetworkConfig {
  chainId: number;
  rpcUrl: string;
}

/**
 * Options for generating RainbowKit config files.
 */
export interface RainbowKitConfigOptions {
  defaultAppName?: string;
  headerComment?: string;
}

/**
 * Generate RainbowKit configuration file content.
 */
export declare function generateRainbowKitConfigFile(
  userConfig: UiKitConfiguration['kitConfig'],
  options?: RainbowKitConfigOptions
): string;

/**
 * Generate exportable RainbowKit files for standalone apps.
 */
export declare function generateRainbowKitExportables(
  uiKitConfig: UiKitConfiguration,
  options?: RainbowKitConfigOptions
): Record<string, string>;

/**
 * RainbowKit types for configuration.
 */
export interface AppInfo {
  appName?: string;
  learnMoreUrl?: string;
}

export interface RainbowKitConnectButtonProps {
  showBalance?: boolean;
  chainStatus?: 'full' | 'icon' | 'name' | 'none';
  accountStatus?: 'full' | 'avatar' | 'address';
}

export interface RainbowKitProviderProps {
  children: React.ReactNode;
  theme?: unknown;
  locale?: string;
}

export interface RainbowKitKitConfig {
  appInfo?: AppInfo;
  showRecentTransactions?: boolean;
  coolMode?: boolean;
}

export interface RainbowKitCustomizations {
  theme?: unknown;
  locale?: string;
}

export declare function isRainbowKitCustomizations(obj: unknown): obj is RainbowKitCustomizations;
export declare function extractRainbowKitCustomizations(
  config: unknown
): RainbowKitCustomizations | undefined;

/**
 * RainbowKit utility functions.
 */
export declare function validateRainbowKitConfig(config: unknown): boolean;
export declare function getRawUserNativeConfig(config: unknown): unknown;

/**
 * RainbowKit component factories.
 */
export declare function createRainbowKitConnectButton(
  props?: RainbowKitConnectButtonProps
): React.ComponentType;
export declare function createRainbowKitComponents(config: unknown): {
  ConnectButton: React.ComponentType;
  AccountDisplay: React.ComponentType;
  NetworkSwitcher: React.ComponentType;
};

/**
 * UI Kit Manager factory and types.
 */
export declare function createUiKitManager(dependencies: UiKitManagerDependencies): UiKitManager;

export interface UiKitManagerState {
  isInitialized: boolean;
  currentKit: string | null;
}

export interface UiKitManagerDependencies {
  walletImplementation: EvmWalletImplementation;
  getWagmiConfig: GetWagmiConfigForRainbowKitFn;
}

export interface UiKitManager {
  initialize(kitId: string, config: unknown): Promise<void>;
  getState(): UiKitManagerState;
  getComponents(): unknown;
}

export interface RainbowKitAssetsResult {
  loaded: boolean;
  error?: string;
}

/**
 * RainbowKit asset management.
 */
export declare function ensureRainbowKitAssetsLoaded(): Promise<RainbowKitAssetsResult>;

/**
 * Configuration resolution utilities.
 */
export declare function resolveAndInitializeKitConfig(
  kitId: string,
  userConfig: unknown
): Promise<unknown>;
export declare function resolveFullUiKitConfiguration(kitId: string, config: unknown): unknown;

/**
 * Wallet component filtering utilities.
 */
export declare function filterWalletComponents(
  components: unknown[],
  exclusions: string[]
): unknown[];
export declare function getComponentExclusionsFromConfig(config: unknown): string[];

// =============================================================================
// CONFIGURATION MODULE
// =============================================================================

/**
 * Resolve RPC URL with priority: user config > app config > network default
 * @param networkConfig - The EVM network configuration
 * @returns The resolved RPC URL string
 * @throws If no valid RPC URL can be resolved
 */
export declare function resolveRpcUrl(networkConfig: EvmNetworkConfig): string;

/**
 * Build RPC URL from user configuration
 */
export declare function buildRpcUrl(config: UserRpcProviderConfig): string;

/**
 * Get user-configured RPC URL for a network
 */
export declare function getUserRpcUrl(networkId: string): string | undefined;

/**
 * Resolve explorer configuration for a network
 * @param networkConfig - The typed EVM network configuration
 * @returns Resolved explorer configuration
 */
export declare function resolveExplorerConfig(
  networkConfig: TypedEvmNetworkConfig
): UserExplorerConfig;

/**
 * Get explorer address URL
 */
export declare function getEvmExplorerAddressUrl(
  address: string,
  networkConfig: TypedEvmNetworkConfig
): string | null;

/**
 * Get explorer transaction URL
 */
export declare function getEvmExplorerTxUrl(
  txHash: string,
  networkConfig: TypedEvmNetworkConfig
): string | null;

/**
 * Validate RPC endpoint configuration
 */
export declare function validateEvmRpcEndpoint(rpcConfig: UserRpcProviderConfig): boolean;

/**
 * Test RPC connection
 * @param rpcConfig - The RPC provider configuration to test
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Connection test results
 */
export declare function testEvmRpcConnection(
  rpcConfig: UserRpcProviderConfig,
  timeoutMs?: number
): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}>;

/**
 * Get current block number from network
 */
export declare function getEvmCurrentBlock(networkConfig: EvmNetworkConfig): Promise<number>;

/**
 * Validate explorer configuration
 */
export declare function validateEvmExplorerConfig(config: UserExplorerConfig): boolean;

/**
 * Test explorer connection
 */
export declare function testEvmExplorerConnection(
  config: UserExplorerConfig,
  networkConfig: TypedEvmNetworkConfig
): Promise<{ success: boolean; error?: string }>;

// =============================================================================
// PROXY MODULE
// =============================================================================

/**
 * Proxy detection result
 */
export interface ProxyDetectionResult {
  isProxy: boolean;
  proxyType?: string;
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Proxy information for detected proxies
 */
export interface EvmProxyInfo {
  isProxy: boolean;
  proxyType?: string;
  implementationAddress?: string;
  proxyAddress?: string;
  adminAddress?: string;
  detectionMethod?: string;
}

/**
 * Detect proxy contract from ABI patterns
 * @param abi - The contract ABI to analyze
 * @returns Proxy detection result
 */
export declare function detectProxyFromAbi(abi: AbiItem[]): ProxyDetectionResult;

/**
 * Get implementation address for a proxy contract
 */
export declare function getImplementationAddress(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig,
  proxyType: string
): Promise<string | null>;

/**
 * Get admin address for a proxy contract
 */
export declare function getAdminAddress(
  proxyAddress: string,
  networkConfig: TypedEvmNetworkConfig
): Promise<string | null>;

// =============================================================================
// VALIDATION MODULE
// =============================================================================

/**
 * Validate address format
 */
export declare function isValidEvmAddress(address: string): boolean;

/**
 * Validate EOA execution config
 */
export declare function validateEoaConfig(config: unknown): boolean;
export declare function validateEvmEoaConfig(config: unknown): boolean;

/**
 * Validate Relayer execution config
 */
export declare function validateRelayerConfig(config: unknown): boolean;
export declare function validateEvmRelayerConfig(config: unknown): boolean;

/**
 * Wallet status type
 */
export interface EvmWalletStatus {
  isConnected: boolean;
  address?: string;
  chainId?: number;
}

// =============================================================================
// UTILS MODULE
// =============================================================================

/**
 * JSON stringify with BigInt support
 */
export declare function stringifyWithBigInt(value: unknown, space?: number): string;

/**
 * Format method name for display
 */
export declare function formatMethodName(name: string): string;

/**
 * Format input name for display
 */
export declare function formatInputName(name: string): string;

/**
 * Convert wei to gwei
 */
export declare function weiToGwei(wei: bigint): string;

/**
 * Convert gwei to wei
 */
export declare function gweiToWei(gwei: string | number): bigint;

/**
 * Validate and convert artifacts to EvmContractArtifacts
 */
export declare function validateAndConvertEvmArtifacts(artifacts: unknown): EvmContractArtifacts;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Extended EVM network config with typed chain information
 */
export interface TypedEvmNetworkConfig extends EvmNetworkConfig {
  chainId: number;
  rpcUrl: string;
  explorerUrl?: string;
  apiUrl?: string;
  supportsEtherscanV2?: boolean;
  primaryExplorerApiIdentifier?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  viemChain?: unknown;
}

/**
 * ABI item type (union of viem ABI types)
 */
export type AbiItem = AbiFunction | AbiEvent | AbiError | AbiConstructor;

interface AbiEvent {
  type: 'event';
  name: string;
  inputs: readonly AbiParameter[];
}

interface AbiError {
  type: 'error';
  name: string;
  inputs: readonly AbiParameter[];
}

interface AbiConstructor {
  type: 'constructor';
  inputs: readonly AbiParameter[];
  stateMutability: 'nonpayable' | 'payable';
}

/**
 * Provider keys for contract definition sources
 */
export type EvmContractDefinitionProviderKey = 'etherscan' | 'sourcify';

export declare const EvmProviderKeys: {
  Etherscan: 'etherscan';
  Sourcify: 'sourcify';
};

export declare const EVM_PROVIDER_ORDER_DEFAULT: EvmContractDefinitionProviderKey[];

/**
 * Type guard for provider keys
 */
export declare function isEvmProviderKey(value: unknown): value is EvmContractDefinitionProviderKey;

/**
 * Type guard for contract artifacts
 */
export declare function isEvmContractArtifacts(obj: unknown): obj is EvmContractArtifacts;

/**
 * ABI validation utilities
 */
export declare function isValidAbiArray(abi: unknown): abi is AbiItem[];
export declare function isValidAbiItem(item: unknown): item is AbiItem;
