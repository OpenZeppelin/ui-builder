/**
 * @openzeppelin/ui-builder-adapter-evm-core
 *
 * Core EVM blockchain adapter functionality extracted from adapter-evm.
 * This package provides reusable, stateless modules for EVM-compatible adapters.
 *
 * @packageDocumentation
 */

// ============================================================================
// ABI Module - ABI loading, transformation, and comparison
// ============================================================================
export {
  // Transformation
  transformAbiToSchema,
  createAbiFunctionItem,
  // Loading
  loadEvmContract,
  loadAbiFromEtherscan,
  loadAbiFromEtherscanV1,
  loadAbiFromEtherscanV2,
  loadAbiFromSourcify,
  getSourcifyContractAppUrl,
  shouldUseV2Api,
  testEtherscanV2Connection,
  // Comparison
  AbiComparisonService,
  abiComparisonService,
  // Types
  type EvmContractLoadResult,
  type ContractLoadOptions,
  type EtherscanAbiResult,
  type SourcifyAbiResult,
  type AbiComparisonResult,
  type AbiDifference,
  type AbiValidationResult,
  isValidAbiArray,
  isValidAbiItem,
} from './abi';

// ============================================================================
// Mapping Module - Type mapping and form field generation
// ============================================================================
export {
  // Type mapping
  mapEvmParamTypeToFieldType,
  getEvmCompatibleFieldTypes,
  EVM_TYPE_TO_FIELD_TYPE,
  getEvmTypeMappingInfo,
  // Field generation
  generateEvmDefaultField,
} from './mapping';

// ============================================================================
// Transform Module - Input parsing and output formatting
// ============================================================================
export { parseEvmInput, formatEvmFunctionResult } from './transform';

// ============================================================================
// Query Module - View function querying
// ============================================================================
export { queryEvmViewFunction, isEvmViewFunction } from './query';

// ============================================================================
// Transaction Module - Transaction formatting and execution strategy interface
// ============================================================================
export { formatEvmTransactionData, type ExecutionStrategy } from './transaction';

// ============================================================================
// Configuration Module - RPC and Explorer configuration
// ============================================================================
export {
  // RPC
  buildRpcUrl,
  getUserRpcUrl,
  resolveRpcUrl,
  validateEvmRpcEndpoint,
  testEvmRpcConnection,
  getEvmCurrentBlock,
  // Explorer
  resolveExplorerConfig,
  getEvmExplorerAddressUrl,
  getEvmExplorerTxUrl,
  validateEvmExplorerConfig,
  testEvmExplorerConnection,
} from './configuration';

// ============================================================================
// Proxy Module - Proxy detection and implementation resolution
// ============================================================================
export {
  detectProxyFromAbi,
  getImplementationAddress,
  getAdminAddress,
  type ProxyDetectionResult,
} from './proxy';

// ============================================================================
// Validation Module - Execution configuration validation
// ============================================================================
export {
  validateEoaConfig,
  validateEvmEoaConfig,
  validateRelayerConfig,
  validateEvmRelayerConfig,
  isValidEvmAddress,
  type EvmWalletStatus,
} from './validation';

// ============================================================================
// Utils Module - Utility functions
// ============================================================================
export {
  // JSON utilities
  stringifyWithBigInt,
  // Formatting
  formatMethodName,
  formatInputName,
  // Gas utilities
  weiToGwei,
  gweiToWei,
  // Artifacts
  validateAndConvertEvmArtifacts,
} from './utils';

// ============================================================================
// Types Module - TypeScript type definitions
// ============================================================================
export {
  // Contract artifacts
  type EvmContractArtifacts,
  isEvmContractArtifacts,
  // Provider types
  EvmProviderKeys,
  type EvmContractDefinitionProviderKey,
  EVM_PROVIDER_ORDER_DEFAULT,
  isEvmProviderKey,
  // ABI types
  type TypedEvmNetworkConfig,
  type AbiItem,
  EVMParameterType,
  EVMChainType,
  type WriteContractParameters,
  // Result types
  type EvmAbiLoadResult,
  type EvmProxyInfo,
  type EvmTransactionData,
} from './types';
