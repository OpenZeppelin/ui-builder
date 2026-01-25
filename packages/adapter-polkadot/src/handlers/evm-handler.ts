/**
 * @fileoverview EVM Handler for Polkadot adapter.
 *
 * This handler delegates all EVM operations to the adapter-evm-core package.
 * It serves as a thin wrapper that routes requests from the PolkadotAdapter
 * to the appropriate core module functions.
 *
 * ## Handler Pattern for Future Extension
 *
 * The Polkadot adapter uses a handler-based architecture to support multiple
 * execution types. Currently only the EVM handler is implemented, but the
 * pattern allows for future Substrate/Wasm handler addition:
 *
 * ```typescript
 * // Future: Add substrate-handler.ts following the same pattern
 * // handlers/
 * // ├── evm-handler.ts      (this file)
 * // └── substrate-handler.ts (future)
 * ```
 *
 * The PolkadotAdapter routes requests based on `executionType`:
 * - 'evm' -> this handler
 * - 'substrate' -> future substrate handler
 */

import {
  formatEvmFunctionResult,
  generateEvmDefaultField,
  getEvmCompatibleFieldTypes,
  isEvmViewFunction,
  // Validation module
  isValidEvmAddress,
  // ABI module
  loadEvmContract,
  // Mapping module
  mapEvmParamTypeToFieldType,
  // Transform module
  parseEvmInput,
  // Query module
  queryEvmViewFunction,
  resolveRpcUrl,
  validateAndConvertEvmArtifacts,
  type ContractLoadOptions,
  // Types
  type TypedEvmNetworkConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type {
  ContractFunction,
  ContractSchema,
  FieldType,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/ui-types';

import type { TypedPolkadotNetworkConfig } from '../types';

/**
 * Convert Polkadot network config to EVM network config for core module compatibility.
 * This strips the Polkadot-specific fields and returns the base EVM config.
 */
function toEvmConfig(config: TypedPolkadotNetworkConfig): TypedEvmNetworkConfig {
  // TypedPolkadotNetworkConfig extends TypedEvmNetworkConfig, so we can
  // pass it directly. The additional Polkadot fields are ignored by core.
  // Use 'unknown' intermediate cast to avoid type incompatibility warnings
  return config as unknown as TypedEvmNetworkConfig;
}

/**
 * Load a contract using EVM core module.
 * Uses Blockscout (V1 API) for Hub networks, Moonscan (V2 API) for parachains.
 */
export async function loadContract(
  address: string,
  networkConfig: TypedPolkadotNetworkConfig,
  options?: { artifacts?: unknown; skipProxyDetection?: boolean }
): Promise<ContractSchema> {
  // If artifacts are provided in options, use them; otherwise treat address as a string
  const source = options?.artifacts
    ? (options.artifacts as string | Record<string, unknown>)
    : address;
  const artifacts = validateAndConvertEvmArtifacts(source);
  // Convert options to ContractLoadOptions format expected by core
  const loadOptions: ContractLoadOptions | undefined =
    options?.skipProxyDetection !== undefined
      ? { skipProxyDetection: options.skipProxyDetection }
      : undefined;
  const result = await loadEvmContract(artifacts, toEvmConfig(networkConfig), loadOptions);
  return result.schema;
}

/**
 * Map a Solidity parameter type to a UI field type.
 * Delegates to adapter-evm-core.
 */
export function mapParameterTypeToFieldType(paramType: string): FieldType {
  return mapEvmParamTypeToFieldType(paramType);
}

/**
 * Get compatible field types for a parameter type.
 * Delegates to adapter-evm-core.
 */
export function getCompatibleFieldTypes(paramType: string): FieldType[] {
  return getEvmCompatibleFieldTypes(paramType);
}

/**
 * Generate default field configuration for a function parameter.
 * Delegates to adapter-evm-core.
 */
export function generateDefaultField(param: FunctionParameter): FormFieldType {
  return generateEvmDefaultField(param);
}

/**
 * Parse user input to blockchain-compatible value.
 * Delegates to adapter-evm-core.
 */
export function parseInput(value: string, type: string): unknown {
  // Create a FunctionParameter from the type string for core compatibility
  const param: FunctionParameter = {
    name: '',
    type,
  };
  return parseEvmInput(param, value);
}

/**
 * Format blockchain result for display.
 * Delegates to adapter-evm-core.
 */
export function formatFunctionResult(
  result: unknown,
  outputs: FunctionParameter[],
  functionId: string
): string {
  // Create a ContractFunction from outputs and functionId for core compatibility
  const functionDetails: ContractFunction = {
    id: functionId,
    name: functionId,
    displayName: functionId,
    type: 'function',
    inputs: [],
    outputs,
    stateMutability: 'view',
    modifiesState: false,
  };
  return formatEvmFunctionResult(result, functionDetails);
}

/**
 * Check if a function is view/pure (doesn't require transaction).
 * Delegates to adapter-evm-core.
 */
export function isViewFunction(func: ContractFunction): boolean {
  return isEvmViewFunction(func);
}

/**
 * Query a view/pure function without wallet connection.
 * Delegates to adapter-evm-core.
 */
export async function queryViewFunction(
  address: string,
  functionId: string,
  params: unknown[],
  schema: ContractSchema,
  networkConfig: TypedPolkadotNetworkConfig
): Promise<unknown> {
  // Resolve RPC URL from network config
  const rpcUrl = resolveRpcUrl(toEvmConfig(networkConfig));
  return queryEvmViewFunction(
    address,
    functionId,
    params,
    schema,
    rpcUrl,
    toEvmConfig(networkConfig)
  );
}

/**
 * Validate an address format.
 * Uses EVM address validation (0x + 40 hex chars).
 */
export function isValidAddress(address: string): boolean {
  return isValidEvmAddress(address);
}
