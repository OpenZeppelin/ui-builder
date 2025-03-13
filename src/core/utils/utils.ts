/**
 * Core utility functions for chain-agnostic operations
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

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
 * Generates a unique ID for form fields, components, etc.
 * Uses the uuid library for proper RFC 4122 UUID v4 generation.
 *
 * @param prefix Optional prefix to add before the UUID
 * @returns A string ID that is guaranteed to be unique
 */
export function generateId(prefix?: string): string {
  const uuid = uuidv4();
  return prefix ? `${prefix}_${uuid}` : uuid;
}
