/**
 * Configuration Module for Polkadot EVM Adapter
 *
 * Adapter-specific configuration functions and Polkadot-style aliases.
 * Core configuration utilities (buildRpcUrl, getUserRpcUrl, etc.) are available
 * directly from @openzeppelin/ui-builder-adapter-evm-core.
 */

// Polkadot-style aliases for core validation functions
export {
  validateEvmNetworkServiceConfig as validateNetworkServiceConfig,
  testEvmNetworkServiceConnection as testNetworkServiceConnection,
  validateEvmRpcEndpoint as validateRpcEndpoint,
  testEvmRpcConnection as testRpcConnection,
  validateEvmExplorerConfig as validateExplorerConfig,
  testEvmExplorerConnection as testExplorerConnection,
} from '@openzeppelin/ui-builder-adapter-evm-core';

// Adapter-specific exports
export * from './execution';
export * from './network-services';
