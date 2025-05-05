/**
 * Core utility functions for chain-agnostic operations
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Export chain utilities from centralized registry
export {
  getEcosystemName,
  getEcosystemDescription,
  getEcosystemExplorerGuidance,
  getEcosystemAddressExample,
  getAvailableEcosystems,
  getEcosystemStyling,
} from '../ecosystems/registry';

/**
 * Combines class names with Tailwind's merge utility
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a camelCase or snake_case string to a human-readable format
 *
 * @param str The string to humanize
 * @returns A human-readable string with spaces and proper capitalization
 */
export function humanizeString(str: string): string {
  if (!str) return '';

  // Replace underscores with spaces
  let result = str.replace(/_/g, ' ');

  // Insert spaces before capital letters
  result = result.replace(/([A-Z])/g, ' $1');

  // Trim extra spaces, ensure first letter is capitalized, rest is lowercase
  return result
    .trim()
    .replace(/^./, (match) => match.toUpperCase())
    .replace(/\s+/g, ' ');
}
