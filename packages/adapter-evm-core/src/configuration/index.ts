/**
 * Configuration Module
 *
 * RPC, Explorer, and Access Control Indexer configuration resolution for EVM networks.
 *
 * @module configuration
 */

// RPC configuration
export {
  buildRpcUrl,
  getUserRpcUrl,
  resolveRpcUrl,
  validateEvmRpcEndpoint,
  testEvmRpcConnection,
  getEvmCurrentBlock,
} from './rpc';

// Explorer configuration
export {
  resolveExplorerConfig,
  resolveExplorerApiKeyFromAppConfig,
  getEvmExplorerAddressUrl,
  getEvmExplorerTxUrl,
  validateEvmExplorerConfig,
  testEvmExplorerConnection,
} from './explorer';

// Access control indexer configuration
export {
  getUserAccessControlIndexerUrl,
  resolveAccessControlIndexerUrl,
} from './access-control-indexer';

// Network service configuration
export {
  validateEvmNetworkServiceConfig,
  testEvmNetworkServiceConnection,
} from './network-services';
