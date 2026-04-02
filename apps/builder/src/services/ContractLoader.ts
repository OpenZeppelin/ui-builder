/**
 * Contract Loader Service
 *
 * Handles loading contract definitions across different blockchain platforms.
 * Uses the appropriate runtime based on the selected chain type.
 */
import { ContractSchema, FormValues, ProxyInfo } from '@openzeppelin/ui-types';
import { getMissingRequiredContractInputs, logger } from '@openzeppelin/ui-utils';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

/**
 * Loads a contract definition using the provided chain runtime.
 * It passes the artifacts object from the contract definition form directly to the runtime.
 *
 * @param runtime The specific runtime instance configured for the target network.
 * @param artifacts A FormValues object containing the necessary data (address, contract schema, custom artifacts, etc.).
 * @returns A Promise resolving to the ContractSchema or null if loading fails.
 */
export async function loadContractDefinition(
  runtime: BuilderRuntime,
  artifacts: FormValues
): Promise<ContractSchema | null> {
  logger.info('ContractLoader', `Loading contract definition with provided artifacts...`);
  try {
    if (!artifacts || Object.keys(artifacts).length === 0) {
      throw new Error('Contract definition input is empty.');
    }

    logger.info('ContractLoader', 'Delegating to runtime.contractLoading.loadContract...');
    const schema = await runtime.contractLoading.loadContract(artifacts);
    logger.info('ContractLoader', 'Schema loaded successfully by runtime.');
    return schema;
  } catch (error) {
    logger.error('ContractLoader', 'Failed to load contract definition:', error);
    throw error;
  }
}

/**
 * Enhanced contract loading result with source metadata
 */
export interface ContractLoadResult {
  schema: ContractSchema;
  source: 'fetched' | 'manual';
  contractDefinitionOriginal?: string;
  contractDefinitionArtifacts?: Record<string, unknown>;
  metadata?: {
    fetchedFrom?: string;
    contractName?: string;
    verificationStatus?: 'verified' | 'unverified' | 'unknown';
    fetchTimestamp?: Date;
    definitionHash?: string;
  };
  proxyInfo?: ProxyInfo;
}

/**
 * Enhanced contract loader that attempts to get source metadata when possible.
 * Uses the runtime's loadContractWithMetadata method if available, otherwise falls back to basic loading.
 *
 * @param runtime The specific runtime instance configured for the target network.
 * @param artifacts A FormValues object containing the necessary data (address, contract schema, custom artifacts, etc.).
 * @returns A Promise resolving to ContractLoadResult with schema and metadata.
 */
export async function loadContractDefinitionWithMetadata(
  runtime: BuilderRuntime,
  artifacts: FormValues
): Promise<ContractLoadResult> {
  logger.info('ContractLoader', `Loading contract definition with metadata...`);

  try {
    if (!artifacts || Object.keys(artifacts).length === 0) {
      throw new Error('Contract definition input is empty.');
    }

    // Defensive preflight: ensure all runtime-declared required fields are present
    const missing = getMissingRequiredContractInputs(runtime.contractLoading, artifacts);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Use runtime's enhanced method if available
    if (runtime.contractLoading.loadContractWithMetadata) {
      logger.info('ContractLoader', 'Using runtime loadContractWithMetadata method...');
      return await runtime.contractLoading.loadContractWithMetadata(artifacts);
    }

    // Fallback to basic loading with default metadata
    logger.info(
      'ContractLoader',
      'Delegating to runtime.contractLoading.loadContract (fallback)...'
    );
    const schema = await runtime.contractLoading.loadContract(artifacts);
    logger.info('ContractLoader', 'Schema loaded successfully by runtime.');

    return {
      schema,
      source: 'manual',
      metadata: {
        contractName: schema.name,
        verificationStatus: 'unknown',
        fetchTimestamp: new Date(),
      },
    };
  } catch (error) {
    logger.error('ContractLoader', 'Failed to load contract definition:', error);
    throw error;
  }
}
