import type { ContractSchema } from '@openzeppelin/transaction-form-types';

import { loadStellarMockContract } from '../mocking';

/**
 * Load a contract from a file or address
 *
 * TODO: Implement actual Stellar contract loading logic in future phases
 */
export function loadStellarContract(source: string): Promise<ContractSchema> {
  console.log(`[PLACEHOLDER] Loading Stellar contract from: ${source}`);
  // Currently delegates to mock loader as a placeholder
  return loadStellarMockContract();
}
