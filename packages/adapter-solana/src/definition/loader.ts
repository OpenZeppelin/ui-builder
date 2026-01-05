import type { ContractSchema } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

// Placeholder
export async function loadSolanaContract(source: string): Promise<ContractSchema> {
  logger.warn('loadSolanaContract', 'Not implemented');
  // Return a minimal valid schema to avoid breaking types further down
  return {
    ecosystem: 'solana',
    name: 'PlaceholderSolanaContract',
    address: source,
    functions: [],
  };
}
