/**
 * Contract Loader Service
 *
 * Handles loading contract definitions across different blockchain platforms.
 * Uses the appropriate adapter based on the selected chain type.
 */
import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import { ContractAdapter, ContractSchema, FormValues } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Loads a contract definition using the provided chain adapter.
 * It passes the artifacts object from the contract definition form directly to the adapter.
 *
 * @param adapter The specific contract adapter instance configured for the target network.
 * @param artifacts A FormValues object containing the necessary data (address, ABI, custom artifacts, etc.).
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
