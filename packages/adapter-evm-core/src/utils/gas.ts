import { formatGwei, parseGwei } from 'viem';

/**
 * Convert wei values to gwei for display using viem
 */
export const weiToGwei = (wei?: number): number | undefined => {
  if (!wei) return undefined;
  return parseFloat(formatGwei(BigInt(wei)));
};

/**
 * Convert gwei values to wei using viem
 */
export const gweiToWei = (gwei?: number): number | undefined => {
  if (!gwei) return undefined;
  return Number(parseGwei(gwei.toString()));
};
