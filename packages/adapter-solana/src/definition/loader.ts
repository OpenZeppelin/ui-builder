import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

// Placeholder
export async function loadSolanaContract(source: string): Promise<ContractSchema> {
  console.warn('loadSolanaContract not implemented');
  // Return a minimal valid schema to avoid breaking types further down
  return {
    ecosystem: 'solana',
    name: 'PlaceholderSolanaContract',
    address: source,
    functions: [],
  };
}
