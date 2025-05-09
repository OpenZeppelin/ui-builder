/**
 * Contract Loader Service
 *
 * Handles loading contract definitions across different blockchain platforms.
 * Uses the appropriate adapter based on the selected chain type.
 */
import { logger } from '@openzeppelin/transaction-form-renderer';
import { ContractAdapter, ContractSchema } from '@openzeppelin/transaction-form-types';

/**
 * Loads a contract definition using the provided chain adapter and network configuration.
 * Handles both File objects (ABI JSON upload) and strings (address or ABI JSON string).
 *
 * @param adapter The specific contract adapter instance configured for the target network.
 * @param contractDefinition A contract address string, a JSON ABI string, or a File object containing a JSON ABI.
 * @returns A Promise resolving to the ContractSchema or null if loading fails.
 */
export async function loadContractDefinition(
  adapter: ContractAdapter,
  contractDefinition: string | File
): Promise<ContractSchema | null> {
  logger.info('ContractLoader', `Loading contract definition...`);
  try {
    let sourceString: string;

    if (contractDefinition instanceof File) {
      logger.info('ContractLoader', 'Input is a File, reading content...');
      sourceString = await contractDefinition.text();
      // Basic check for file type (though adapter should handle invalid JSON)
      if (!contractDefinition.type || !contractDefinition.type.includes('json')) {
        logger.warn(
          'ContractLoader',
          'Uploaded file does not appear to be JSON, attempting to parse anyway.'
        );
      }
    } else {
      // Input is already a string (address or JSON ABI)
      sourceString = contractDefinition.trim(); // Trim whitespace
      if (!sourceString) {
        throw new Error('Contract definition input is empty.');
      }
    }

    logger.info('ContractLoader', 'Delegating to adapter.loadContract...');
    const schema = await adapter.loadContract(sourceString);
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
