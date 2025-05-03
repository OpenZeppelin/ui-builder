import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

// Assuming we might reuse some types temporarily
// Placeholder type for wallet implementation
type SolanaWalletImplementation = unknown;

// Placeholder
export async function querySolanaViewFunction(
  _contractAddress: string,
  _functionId: string,
  _params: unknown[],
  _contractSchema: ContractSchema | undefined,
  _walletImplementation: SolanaWalletImplementation | undefined, // Use placeholder type
  _loadContractFn: (source: string) => Promise<ContractSchema>
): Promise<unknown> {
  console.warn('querySolanaViewFunction not implemented');
  return undefined;
}
