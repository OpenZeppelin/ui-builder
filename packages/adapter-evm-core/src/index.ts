/**
 * @openzeppelin/ui-builder-adapter-evm-core
 *
 * Internal package containing reusable EVM core logic for building EVM-compatible adapters.
 * This package is bundled into consuming adapters at build time (not published to npm).
 *
 * @packageDocumentation
 */

// =============================================================================
// ABI MODULE
// =============================================================================

export {
  loadEvmContract,
  loadAbiFromEtherscan,
  loadAbiFromEtherscanV2,
  loadAbiFromSourcify,
  transformAbiToSchema,
  compareEvmContracts,
} from './abi';

// =============================================================================
// MAPPING MODULE
// =============================================================================

export {
  mapEvmParamTypeToFieldType,
  getEvmCompatibleFieldTypes,
  generateEvmDefaultField,
  EVM_TYPE_MAPPINGS,
} from './mapping';

// =============================================================================
// TRANSFORM MODULE
// =============================================================================

export { parseEvmInput, formatEvmFunctionResult } from './transform';

// =============================================================================
// QUERY MODULE
// =============================================================================

export { queryEvmViewFunction, isEvmViewFunction } from './query';

// =============================================================================
// TRANSACTION MODULE
// =============================================================================

export { formatEvmTransactionData } from './transaction';
export type { ExecutionStrategy } from './transaction';

// =============================================================================
// CONFIGURATION MODULE
// =============================================================================

export { resolveRpcUrl, resolveExplorerConfig, testEvmRpcConnection } from './configuration';

// =============================================================================
// PROXY MODULE
// =============================================================================

export { detectEvmProxyImplementation } from './proxy';

// =============================================================================
// VALIDATION MODULE
// =============================================================================

export { isValidEvmAddress, validateEvmEoaConfig, validateEvmRelayerConfig } from './validation';

// =============================================================================
// UTILS MODULE
// =============================================================================

export {
  stringifyWithBigInt,
  parseJsonWithBigInt,
  formatGasEstimate,
  formatWeiToEther,
} from './utils';

// =============================================================================
// TYPES
// =============================================================================

export type {
  EvmContractArtifacts,
  EvmAbiLoadResult,
  EvmProxyInfo,
  EvmTransactionData,
} from './types';
