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

// ABI and EVM-specific types
export {
  type TypedEvmNetworkConfig,
  type AbiItem,
  EVMParameterType,
  EVMChainType,
  type WriteContractParameters,
} from './abi';

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
