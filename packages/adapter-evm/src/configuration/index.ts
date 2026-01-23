// Barrel file for configuration module
// Re-export core configuration utilities
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
} from '@openzeppelin/ui-builder-adapter-evm-core';

// Adapter-specific exports (use wallet implementation, UI forms)
export * from './execution';
export * from './network-services';
