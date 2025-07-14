import type { ContractFunction } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Determines if a function is a view/pure function (read-only)
 */
export function isStellarViewFunction(_functionDetails: ContractFunction): boolean {
  // TODO: Implement properly for Stellar Soroban contracts
  return false; // Temporary placeholder
}
