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
  getEvmExplorerAddressUrl,
  getEvmExplorerTxUrl,
  validateEvmExplorerConfig,
  testEvmExplorerConnection,
} from './explorer';
