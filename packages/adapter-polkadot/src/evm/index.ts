/**
 * EVM Module for Polkadot Adapter
 *
 * This module provides all EVM-specific functionality for the Polkadot adapter.
 * It follows the same modular structure as the EVM adapter, with logic delegated
 * to adapter-evm-core where possible.
 *
 * ## Module Structure
 *
 * - `abi/` - Contract loading wrappers for Polkadot
 * - `configuration/` - Execution config, network services
 * - `query/` - View function queries
 * - `transaction/` - Relayer transaction wrappers for Polkadot
 * - `ui/` - UI-related functions (UI kits, labels, form inputs)
 *
 * Core EVM functionality (mapping, transform, validation) is available directly
 * from @openzeppelin/adapter-evm-core.
 */

// ============================================================================
// ABI Module - Adapter-specific wrappers
// ============================================================================
export { loadContract, loadContractWithMetadata } from './abi';

// Core ABI functionality from core
export {
  abiComparisonService,
  validateAndConvertEvmArtifacts,
  compareContractDefinitions,
  validateContractDefinition,
  hashContractDefinition,
} from '@openzeppelin/adapter-evm-core';

// ============================================================================
// Configuration Module
// ============================================================================
// Core configuration utilities from core
export {
  buildRpcUrl,
  getUserRpcUrl,
  resolveRpcUrl,
  validateEvmRpcEndpoint,
  testEvmRpcConnection,
  getEvmCurrentBlock,
  resolveExplorerConfig,
  getEvmExplorerAddressUrl,
  getEvmExplorerTxUrl,
  validateEvmExplorerConfig,
  testEvmExplorerConnection,
  validateEvmNetworkServiceConfig,
  testEvmNetworkServiceConnection,
} from '@openzeppelin/adapter-evm-core';

// Polkadot-style aliases and adapter-specific exports
export {
  validateNetworkServiceConfig,
  testNetworkServiceConnection,
  validateRpcEndpoint,
  testRpcConnection,
  validateExplorerConfig,
  testExplorerConnection,
  getSupportedExecutionMethods,
  validateExecutionConfig,
  getNetworkServiceForms,
  getPolkadotDefaultServiceConfig,
} from './configuration';

// ============================================================================
// Mapping Module - from core
// ============================================================================
export {
  mapEvmParamTypeToFieldType,
  getEvmCompatibleFieldTypes,
  EVM_TYPE_TO_FIELD_TYPE,
  getEvmTypeMappingInfo,
  generateEvmDefaultField,
} from '@openzeppelin/adapter-evm-core';

// ============================================================================
// Query Module
// ============================================================================
export { isViewFunction, queryViewFunction } from './query';

// ============================================================================
// Transaction Module
// ============================================================================
// Core transaction functionality from core
export {
  formatEvmTransactionData,
  EoaExecutionStrategy,
  executeEvmTransaction,
  signAndBroadcastEvmTransaction,
  waitForEvmTransactionConfirmation,
} from '@openzeppelin/adapter-evm-core';

// Adapter-specific relayer exports
export {
  RelayerExecutionStrategy,
  type EvmRelayerTransactionOptions,
  getRelayers,
  getRelayer,
} from './transaction';

// ============================================================================
// Transform Module - from core
// ============================================================================
export { parseEvmInput, formatEvmFunctionResult } from '@openzeppelin/adapter-evm-core';

// ============================================================================
// UI Module
// ============================================================================
export {
  getAvailableUiKits,
  getContractDefinitionInputs,
  getUiLabels,
  getWritableFunctions,
  filterAutoQueryableFunctions,
  supportsWalletConnection,
  getRelayerOptionsComponent,
} from './ui';

// ============================================================================
// Validation Module - from core
// ============================================================================
export {
  validateEoaConfig,
  validateEvmEoaConfig,
  validateRelayerConfig,
  validateEvmRelayerConfig,
  validateEvmExecutionConfig,
  isValidEvmAddress,
  type EvmWalletStatus,
} from '@openzeppelin/adapter-evm-core';

// ============================================================================
// Access Control Module - from core
// ============================================================================
export {
  createEvmAccessControlService,
  type EvmAccessControlService,
} from '@openzeppelin/adapter-evm-core';

// ============================================================================
// Core Types (re-exported for convenience)
// ============================================================================
export type {
  EvmCompatibleNetworkConfig,
  TypedEvmNetworkConfig,
  WriteContractParameters,
  EvmWalletImplementation,
  ContractLoadOptions,
} from '@openzeppelin/adapter-evm-core';

export { EvmProviderKeys, isEvmProviderKey } from '@openzeppelin/adapter-evm-core';
