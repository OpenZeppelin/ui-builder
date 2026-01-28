/**
 * ABI Module for Polkadot EVM Adapter
 *
 * Provides adapter-specific wrappers around core ABI functionality.
 * Core functions (abiComparisonService, validateAndConvertEvmArtifacts, etc.) are available
 * directly from @openzeppelin/ui-builder-adapter-evm-core.
 */

import {
  loadContractSchema as coreLoadContractSchema,
  loadContractWithFullMetadata as coreLoadContractWithFullMetadata,
  type ContractLoadOptions,
  type EvmContractLoadResult,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { ContractSchema } from '@openzeppelin/ui-types';

import type { TypedPolkadotNetworkConfig } from '../../types';

/**
 * Load a contract using EVM core module.
 * Uses Blockscout (V1 API) for Hub networks, Moonscan (V2 API) for parachains.
 *
 * @remarks
 * This is a thin wrapper that handles the Polkadot-specific option format
 * (artifacts/skipProxyDetection) before delegating to core.
 */
export async function loadContract(
  address: string,
  networkConfig: TypedPolkadotNetworkConfig,
  options?: { artifacts?: unknown; skipProxyDetection?: boolean }
): Promise<ContractSchema> {
  const source = options?.artifacts
    ? (options.artifacts as string | Record<string, unknown>)
    : address;
  const loadOptions: ContractLoadOptions | undefined =
    options?.skipProxyDetection !== undefined
      ? { skipProxyDetection: options.skipProxyDetection }
      : undefined;
  return coreLoadContractSchema(source, networkConfig, loadOptions);
}

/**
 * Load contract with full metadata.
 * Returns schema, source, metadata, and proxy information.
 *
 * @remarks
 * Delegates directly to core's loadContractWithFullMetadata.
 */
export async function loadContractWithMetadata(
  source: string | Record<string, unknown>,
  networkConfig: TypedPolkadotNetworkConfig
): Promise<EvmContractLoadResult> {
  return coreLoadContractWithFullMetadata(source, networkConfig);
}
