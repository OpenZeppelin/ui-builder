/**
 * Types Module
 *
 * Internal TypeScript types for EVM core functionality.
 * Re-exports commonly used types from dependencies.
 *
 * @module types
 */

// Contract artifacts types
export { type EvmContractArtifacts, isEvmContractArtifacts } from './artifacts';

// Provider types
export {
  EvmProviderKeys,
  type EvmContractDefinitionProviderKey,
  EVM_PROVIDER_ORDER_DEFAULT,
  isEvmProviderKey,
} from './providers';

// Network configuration types
export { type EvmCompatibleNetworkConfig, type TypedEvmNetworkConfig } from './network';

// ABI types
export { type AbiItem, type WriteContractParameters } from './abi';

// ABI load result type
export type EvmAbiLoadResult = {
  abi: unknown[];
  name?: string;
  source?: string;
};

// Proxy info type
export type EvmProxyInfo = {
  isProxy: boolean;
  implementation?: string;
  proxyType?: string;
};

// Transaction data type
export type EvmTransactionData = {
  to: string;
  data: string;
  value?: bigint;
};
