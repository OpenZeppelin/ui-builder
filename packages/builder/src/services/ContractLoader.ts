/**
 * Contract Loader Service
 *
 * Handles loading contract definitions across different blockchain platforms.
 * Uses the appropriate adapter based on the selected chain type.
 */
import {
  ContractAdapter,
  ContractSchema,
  FormValues,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

/**
 * Loads a contract definition using the provided chain adapter.
 * It passes the artifacts object from the contract definition form directly to the adapter.
 *
 * @param adapter The specific contract adapter instance configured for the target network.
 * @param artifacts A FormValues object containing the necessary data (address, contract schema, custom artifacts, etc.).
 * @returns A Promise resolving to the ContractSchema or null if loading fails.
 */
export async function loadContractDefinition(
  adapter: ContractAdapter,
  artifacts: FormValues
): Promise<ContractSchema | null> {
  logger.info('ContractLoader', `Loading contract definition with provided artifacts...`);
  try {
    if (!artifacts || Object.keys(artifacts).length === 0) {
      throw new Error('Contract definition input is empty.');
    }

    logger.info('ContractLoader', 'Delegating to adapter.loadContract...');
    const schema = await adapter.loadContract(artifacts);
    logger.info('ContractLoader', 'Schema loaded successfully by adapter.');
    return schema;
  } catch (error) {
    logger.error('ContractLoader', 'Failed to load contract definition:', error);
    // Propagate specific error messages by re-throwing the error.
    // The calling component should handle this error and update the UI accordingly.
    // Returning null hides the specific reason for failure.
    throw error; // Re-throw the caught error
  }
}

/**
 * Enhanced contract loading result with source metadata
 */
export interface ContractLoadResult {
  schema: ContractSchema;
  source: 'fetched' | 'manual' | 'hybrid';
  contractDefinitionOriginal?: string;
  metadata?: {
    fetchedFrom?: string;
    contractName?: string;
    verificationStatus?: 'verified' | 'unverified' | 'unknown';
    fetchTimestamp?: Date;
    definitionHash?: string;
  };
}

/**
 * Enhanced contract loader that attempts to get source metadata when possible.
 * Uses the adapter's loadContractWithMetadata method if available, otherwise falls back to basic loading.
 *
 * @param adapter The specific contract adapter instance configured for the target network.
 * @param artifacts A FormValues object containing the necessary data (address, contract schema, custom artifacts, etc.).
 * @returns A Promise resolving to ContractLoadResult with schema and metadata.
 */
export async function loadContractDefinitionWithMetadata(
  adapter: ContractAdapter,
  artifacts: FormValues
): Promise<ContractLoadResult> {
  logger.info('ContractLoader', `Loading contract definition with metadata...`);

  try {
    if (!artifacts || Object.keys(artifacts).length === 0) {
      throw new Error('Contract definition input is empty.');
    }

    // Use adapter's enhanced method if available
    if (adapter.loadContractWithMetadata) {
      logger.info('ContractLoader', 'Using adapter loadContractWithMetadata method...');
      return await adapter.loadContractWithMetadata(artifacts);
    }

    // Fallback to basic loading with default metadata
    logger.info('ContractLoader', 'Delegating to adapter.loadContract (fallback)...');
    const schema = await adapter.loadContract(artifacts);
    logger.info('ContractLoader', 'Schema loaded successfully by adapter.');

    // Provide basic metadata when adapter doesn't support enhanced loading
    return {
      schema,
      source: 'manual', // Default to manual since we can't determine the source
      metadata: {
        contractName: schema.name,
        verificationStatus: 'unknown',
        fetchTimestamp: new Date(),
      },
    };
  } catch (error) {
    logger.error('ContractLoader', 'Failed to load contract definition:', error);
    throw error; // Re-throw the caught error
  }
}
