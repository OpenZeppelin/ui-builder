import type { ContractSchema } from '@openzeppelin/transaction-form-types';

// Placeholder
export async function loadSolanaMockContract(_mockId?: string): Promise<ContractSchema> {
  console.warn('loadSolanaMockContract not implemented');
  return {
    ecosystem: 'solana',
    name: 'PlaceholderMockSolanaProgram',
    address: 'Mock111111111111111111111111111111111111111',
    functions: [],
  };
}
