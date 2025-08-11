import type { ContractSchema } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

/**
 * Load a contract from a file or address
 *
 * TODO: Implement actual Stellar contract loading logic in future phases
 */
export function loadStellarContract(source: string): Promise<ContractSchema> {
  logger.info('loadStellarContract', `[PLACEHOLDER] Loading Stellar contract from: ${source}`);

  // Return a minimal placeholder contract schema
  return Promise.resolve({
    ecosystem: 'stellar',
    name: 'Placeholder Contract',
    address: source,
    functions: [],
  });
}
