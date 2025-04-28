/**
 * Centralized Adapter Registry
 *
 * Provides mappings and accessors for different chain adapters.
 */
// Import adapter implementations
import { EvmAdapter } from '@openzeppelin/transaction-form-adapter-evm';
import { MidnightAdapter } from '@openzeppelin/transaction-form-adapter-midnight';
import { SolanaAdapter } from '@openzeppelin/transaction-form-adapter-solana';
import { StellarAdapter } from '@openzeppelin/transaction-form-adapter-stellar';
import type { ContractAdapter } from '@openzeppelin/transaction-form-types/adapters';
import type { ChainType } from '@openzeppelin/transaction-form-types/contracts';

// --- Adapter Instance Map ---
const adapterInstances: Record<ChainType, ContractAdapter> = {
  evm: new EvmAdapter(),
  solana: new SolanaAdapter(),
  stellar: new StellarAdapter(),
  midnight: new MidnightAdapter(),
};

// --- Adapter Package Name Map ---
export const adapterPackageMap: Record<ChainType, string> = {
  evm: '@openzeppelin/transaction-form-adapter-evm',
  solana: '@openzeppelin/transaction-form-adapter-solana',
  stellar: '@openzeppelin/transaction-form-adapter-stellar',
  midnight: '@openzeppelin/transaction-form-adapter-midnight',
};

/**
 * Gets the singleton adapter instance for a given chain type.
 *
 * @param chainType The chain type (e.g., 'evm', 'solana')
 * @returns The corresponding ContractAdapter instance.
 * @throws If no adapter is available for the specified chain type.
 */
export function getAdapter(chainType: ChainType): ContractAdapter {
  const adapter = adapterInstances[chainType];
  if (!adapter) {
    throw new Error(`No adapter instance available for chain type: ${chainType}`);
  }
  return adapter;
}
