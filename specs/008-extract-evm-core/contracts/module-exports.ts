/**
 * API Contract: adapter-evm-core Module Exports
 *
 * This file defines the public API surface of the adapter-evm-core package.
 * All exports listed here MUST be available from '@openzeppelin/ui-builder-adapter-evm-core'.
 *
 * This serves as the contract between adapter-evm-core and consuming adapters.
 */

import type { Abi, AbiFunction, AbiParameter, Address } from 'viem';
import type {
  ContractSchema,
  ContractFunction,
  EvmNetworkConfig,
  NetworkConfig,
  FieldType,
  FormFieldType,
  FunctionParameter,
  UserRpcProviderConfig,
  UserExplorerConfig,
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
export declare function createAbiFunctionItem(
  functionDetails: ContractFunction
): AbiFunction;

/**
 * ABI comparison service for comparing contract definitions
 */
export declare class AbiComparisonService {
  compare(
    abiA: readonly AbiItem[],
    abiB: readonly AbiItem[]
  ): AbiComparisonResult;
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
export declare function generateEvmDefaultField(
  parameter: FunctionParameter
): FormFieldType;

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
export declare function isEvmViewFunction(
  func: { stateMutability?: string }
): boolean;

// =============================================================================
// TRANSACTION MODULE
// =============================================================================

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
 * Execution strategy interface (implementations in adapter-evm)
 */
export interface ExecutionStrategy {
  execute(): Promise<unknown>;
}

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
export declare function validateEvmRpcEndpoint(
  rpcConfig: UserRpcProviderConfig
): boolean;

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
export declare function getEvmCurrentBlock(
  networkConfig: EvmNetworkConfig
): Promise<number>;

/**
 * Validate explorer configuration
 */
export declare function validateEvmExplorerConfig(
  config: UserExplorerConfig
): boolean;

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
export declare function stringifyWithBigInt(
  value: unknown,
  space?: number
): string;

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
export declare function validateAndConvertEvmArtifacts(
  artifacts: unknown
): EvmContractArtifacts;

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
export declare function isEvmProviderKey(
  value: unknown
): value is EvmContractDefinitionProviderKey;

/**
 * Type guard for contract artifacts
 */
export declare function isEvmContractArtifacts(
  obj: unknown
): obj is EvmContractArtifacts;

/**
 * ABI validation utilities
 */
export declare function isValidAbiArray(abi: unknown): abi is AbiItem[];
export declare function isValidAbiItem(item: unknown): item is AbiItem;
