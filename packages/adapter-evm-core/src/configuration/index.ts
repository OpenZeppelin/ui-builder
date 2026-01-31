/**
 * Configuration Module
 *
 * RPC and Explorer configuration resolution for EVM networks.
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

// Network service configuration
export {
  validateEvmNetworkServiceConfig,
  testEvmNetworkServiceConnection,
} from './network-services';
