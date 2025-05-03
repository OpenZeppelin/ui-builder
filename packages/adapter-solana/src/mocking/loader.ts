import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

// Placeholder
export async function loadSolanaMockContract(_mockId?: string): Promise<ContractSchema> {
  console.warn('loadSolanaMockContract not implemented');
  return {
    chainType: 'solana',
    name: 'PlaceholderMockSolanaProgram',
    address: 'Mock111111111111111111111111111111111111111',
    functions: [],
  };
}
