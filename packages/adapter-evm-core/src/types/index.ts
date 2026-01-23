/**
 * Types Module
 *
 * Internal TypeScript types for EVM core functionality.
 * Re-exports commonly used types from dependencies.
 *
 * @module types
 */

// Placeholder exports - will be populated when modules are moved

// Contract artifacts type
export type EvmContractArtifacts = Record<string, unknown>;

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
