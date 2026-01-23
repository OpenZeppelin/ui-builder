/**
 * API Contract: adapter-evm-core Module Exports
 * 
 * This file defines the public API surface of the adapter-evm-core package.
 * All exports listed here MUST be available from '@openzeppelin/ui-builder-adapter-evm-core'.
 * 
 * This serves as the contract between adapter-evm-core and consuming adapters.
 */

// =============================================================================
// ABI MODULE
// =============================================================================

/**
 * Load a contract's schema from address using configured providers
 * @param address - Contract address (0x-prefixed)
 * @param networkConfig - Network configuration with API endpoints
 * @param options - Optional provider preferences
 * @returns ContractSchema with functions, name, and metadata
 */
export declare function loadEvmContract(
  address: string,
  networkConfig: EvmNetworkConfig,
  options?: {
    forcedProvider?: 'etherscan' | 'sourcify';
    timeout?: number;
  }
): Promise<ContractSchema>;

/**
 * Load ABI from Etherscan V2 unified API
 */
export declare function loadAbiFromEtherscanV2(
  address: string,
  chainId: number,
  apiUrl: string,
  apiKey?: string
): Promise<Abi>;

/**
 * Load ABI from Etherscan V1 API (legacy)
 */
export declare function loadAbiFromEtherscan(
  address: string,
  apiUrl: string,
  apiKey?: string
): Promise<Abi>;

/**
 * Load ABI from Sourcify
 */
export declare function loadAbiFromSourcify(
  address: string,
  chainId: number
): Promise<Abi>;

/**
 * Transform raw ABI to ContractSchema
 */
export declare function transformAbiToSchema(
  abi: Abi,
  contractName: string
): ContractSchema;

/**
 * Compare two contract definitions for equivalence
 */
export declare function compareEvmContracts(
  abiA: Abi,
  abiB: Abi
): { isEqual: boolean; differences: string[] };

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
 * Generate default field configuration
 */
export declare function generateEvmDefaultField(
  param: AbiParameter,
  functionId: string,
  paramIndex: number
): FormFieldType;

/**
 * Type mapping constants
 */
export declare const EVM_TYPE_MAPPINGS: Record<string, FieldType>;

// =============================================================================
// TRANSFORM MODULE
// =============================================================================

/**
 * Parse user input string to blockchain-compatible value
 */
export declare function parseEvmInput(value: string, type: string): unknown;

/**
 * Format blockchain result for display
 */
export declare function formatEvmFunctionResult(
  result: unknown,
  outputs: AbiParameter[],
  functionId: string
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
export declare function isEvmViewFunction(func: ContractFunction): boolean;

// =============================================================================
// TRANSACTION MODULE
// =============================================================================

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
  execute(): Promise<TransactionResult>;
}

// =============================================================================
// CONFIGURATION MODULE
// =============================================================================

/**
 * Resolve RPC URL with priority: user config > app config > network default
 */
export declare function resolveRpcUrl(
  networkId: string,
  networkConfig: EvmNetworkConfig,
  userRpcConfig?: UserRpcConfig,
  appConfig?: AppConfig
): string;

/**
 * Resolve explorer configuration
 */
export declare function resolveExplorerConfig(
  networkId: string,
  networkConfig: EvmNetworkConfig,
  userExplorerConfig?: UserExplorerConfig
): ExplorerConfig;

/**
 * Test RPC connection
 */
export declare function testEvmRpcConnection(
  rpcUrl: string,
  timeoutMs?: number
): Promise<boolean>;

// =============================================================================
// PROXY MODULE
// =============================================================================

/**
 * Detect proxy contract and resolve implementation
 */
export declare function detectEvmProxyImplementation(
  address: string,
  rpcUrl: string
): Promise<EvmProxyInfo | null>;

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
export declare function validateEvmEoaConfig(config: ExecutionConfig): boolean;

/**
 * Validate Relayer execution config
 */
export declare function validateEvmRelayerConfig(config: ExecutionConfig): boolean;

// =============================================================================
// UTILS MODULE
// =============================================================================

/**
 * JSON stringify with BigInt support
 */
export declare function stringifyWithBigInt(value: unknown): string;

/**
 * JSON parse with BigInt support
 */
export declare function parseJsonWithBigInt(json: string): unknown;

/**
 * Format gas estimate for display
 */
export declare function formatGasEstimate(gas: bigint): string;

/**
 * Format wei to ether string
 */
export declare function formatWeiToEther(wei: bigint, decimals?: number): string;

// =============================================================================
// TYPES
// =============================================================================

export type { EvmContractArtifacts } from './types/artifacts';
export type { EvmAbiLoadResult } from './abi/types';
export type { EvmProxyInfo } from './proxy/detection';
export type { EvmTransactionData } from './transaction/formatter';

// Re-exported from dependencies (for convenience)
import type { Abi, AbiFunction, AbiParameter, Address } from 'viem';
import type {
  ContractSchema,
  ContractFunction,
  EvmNetworkConfig,
  NetworkConfig,
  FieldType,
  FormFieldType,
  ExecutionConfig,
  TransactionResult,
} from '@openzeppelin/ui-types';
