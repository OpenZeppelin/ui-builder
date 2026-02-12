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
  // Convenience wrappers
  loadContractSchema,
  loadContractWithFullMetadata,
  compareContractDefinitions,
  validateContractDefinition,
  hashContractDefinition,
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
// Transaction Module - Transaction formatting, execution strategies, and sending
// ============================================================================
export {
  // Formatting
  formatEvmTransactionData,
  // Execution strategy interface
  type AdapterExecutionStrategy,
  // Execution strategies
  EoaExecutionStrategy,
  RelayerExecutionStrategy,
  type EvmRelayerTransactionOptions,
  // Transaction functions
  executeEvmTransaction,
  signAndBroadcastEvmTransaction,
  waitForEvmTransactionConfirmation,
  // Types
  type EvmWalletImplementation,
  type EvmWalletConnectionStatus,
  type EvmWalletConnectionResult,
  type EvmWalletDisconnectResult,
} from './transaction';

// ============================================================================
// Wallet Module - Wallet implementation and UI configuration utilities
// ============================================================================
export {
  // Wagmi provider context
  WagmiProviderInitializedContext,
  // Wagmi hooks
  useIsWagmiProviderInitialized,
  // Wagmi components
  SafeWagmiComponent,
  // Wallet UI components
  CustomConnectButton,
  ConnectorDialog,
  CustomAccountDisplay,
  CustomNetworkSwitcher,
  type ConnectButtonProps,
  // Core connection utilities
  connectAndEnsureCorrectNetworkCore,
  DEFAULT_DISCONNECTED_STATUS,
  // Wallet implementation
  WagmiWalletImplementation,
  type GetWagmiConfigForRainbowKitFn,
  // Wallet types
  type WagmiWalletConfig,
  type WagmiConfigChains,
  type WalletNetworkConfig,
  // RainbowKit utilities
  generateRainbowKitConfigFile,
  generateRainbowKitExportables,
  type RainbowKitConfigOptions,
  // RainbowKit types
  type AppInfo,
  type RainbowKitConnectButtonProps,
  type RainbowKitProviderProps,
  type RainbowKitKitConfig,
  type RainbowKitCustomizations,
  isRainbowKitCustomizations,
  extractRainbowKitCustomizations,
  // RainbowKit utility functions
  validateRainbowKitConfig,
  getRawUserNativeConfig,
  // RainbowKit component factories
  createRainbowKitConnectButton,
  createRainbowKitComponents,
  // RainbowKit config service
  createRainbowKitWagmiConfig,
  getWagmiConfigForRainbowKit,
  // UI Kit Manager factory
  createUiKitManager,
  type UiKitManagerState,
  type UiKitManagerDependencies,
  type UiKitManager,
  type RainbowKitAssetsResult,
  // RainbowKit Asset Manager
  ensureRainbowKitAssetsLoaded,
  // Configuration Resolution
  resolveAndInitializeKitConfig,
  resolveFullUiKitConfiguration,
  // Wallet component filtering utilities
  filterWalletComponents,
  getComponentExclusionsFromConfig,
} from './wallet';

// ============================================================================
// Configuration Module - RPC, Explorer, and Access Control Indexer configuration
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
  resolveExplorerApiKeyFromAppConfig,
  getEvmExplorerAddressUrl,
  getEvmExplorerTxUrl,
  validateEvmExplorerConfig,
  testEvmExplorerConnection,
  // Access control indexer
  getUserAccessControlIndexerUrl,
  resolveAccessControlIndexerUrl,
  // Network service configuration
  validateEvmNetworkServiceConfig,
  testEvmNetworkServiceConnection,
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
  validateEvmExecutionConfig,
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
// Access Control Module - Access control detection, reads, writes, and history
// ============================================================================
export {
  // Service
  createEvmAccessControlService,
  EvmAccessControlService,
  // Actions
  assembleAcceptAdminTransferAction,
  assembleAcceptOwnershipAction,
  assembleBeginAdminTransferAction,
  assembleCancelAdminTransferAction,
  assembleChangeAdminDelayAction,
  assembleGrantRoleAction,
  assembleRenounceOwnershipAction,
  assembleRenounceRoleAction,
  assembleRevokeRoleAction,
  assembleRollbackAdminDelayAction,
  assembleTransferOwnershipAction,
  // Feature Detection
  detectAccessControlCapabilities,
  validateAccessControlSupport,
  // Indexer Client
  createIndexerClient,
  EvmIndexerClient,
  // On-Chain Reader
  getAdmin,
  getCurrentBlock,
  readCurrentRoles,
  readOwnership,
  // Validation
  validateAddress,
  validateRoleId,
  validateRoleIds,
  // Constants
  DEFAULT_ADMIN_ROLE,
  DEFAULT_ADMIN_ROLE_LABEL,
  ZERO_ADDRESS,
  // Types
  type EvmAccessControlContext,
  type EvmTransactionExecutor,
} from './access-control';

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
  // Network and ABI types
  type EvmCompatibleNetworkConfig,
  type TypedEvmNetworkConfig,
  type AbiItem,
  type WriteContractParameters,
  // Result types
  type EvmAbiLoadResult,
  type EvmProxyInfo,
  type EvmTransactionData,
} from './types';
