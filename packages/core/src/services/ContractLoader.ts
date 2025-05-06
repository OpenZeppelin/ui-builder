/**
 * Contract Loader Service
 *
 * Handles loading contract definitions across different blockchain platforms.
 * Uses the appropriate adapter based on the selected chain type.
 */
import { logger } from '@openzeppelin/transaction-form-renderer';
import { ContractSchema, Ecosystem } from '@openzeppelin/transaction-form-types';

import { getAdapter } from '../core/adapterRegistry';

/**
 * Loads a contract definition using the appropriate chain adapter.
 * Handles both File objects (ABI JSON upload) and strings (address or ABI JSON string).
 *
 * @param ecosystem The ecosystem (e.g., 'evm')
 * @param contractDefinition A contract address string, a JSON ABI string, or a File object containing a JSON ABI.
 * @returns A Promise resolving to the ContractSchema or null if loading fails.
 */
export async function loadContractDefinition(
  ecosystem: Ecosystem,
  contractDefinition: string | File
): Promise<ContractSchema | null> {
  logger.info('ContractLoader', `Loading contract definition for ${ecosystem}...`);
  try {
    const adapter = getAdapter(ecosystem);
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
    // The adapter's loadContract method handles address detection vs JSON parsing
    const schema = await adapter.loadContract(sourceString);
    logger.info('ContractLoader', 'Schema loaded successfully by adapter.');
    return schema;
  } catch (error) {
    logger.error('ContractLoader', 'Failed to load contract definition:', error);
    // Propagate specific error messages if possible, otherwise return null
    // UI should handle the null return and potentially show the logged error
    // Re-throwing the error might be better for more specific UI handling
    // throw error; // Consider re-throwing
    return null; // Return null on any error during loading/parsing
  }
}
