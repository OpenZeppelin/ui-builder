/**
 * Core utility functions for chain-agnostic operations
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { ChainType } from '../types/ContractSchema';

/**
 * Combines class names with Tailwind's merge utility
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a ChainType to a human-readable name
 */
export function getChainName(chain: ChainType): string {
  switch (chain) {
    case 'evm':
      return 'Ethereum (EVM)';
    case 'midnight':
      return 'Midnight';
    case 'stellar':
      return 'Stellar';
    case 'solana':
      return 'Solana';
    default:
      return chain;
  }
}

/**
 * Generates a unique ID for form fields, etc.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
