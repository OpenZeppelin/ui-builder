import { logger } from '@openzeppelin/ui-utils';

// Placeholder validation utility for Solana
export function isValidSolanaAddress(address: string): boolean {
  logger.warn('adapter-solana', 'isValidSolanaAddress not implemented robustly');
  // Basic placeholder check
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}
