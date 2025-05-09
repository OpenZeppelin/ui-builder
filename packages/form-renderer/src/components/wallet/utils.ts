import { truncateMiddle } from '../../utils/formatting';

/**
 * Formats a blockchain address for display by truncating the middle portion
 *
 * @param address The blockchain address to format
 * @param startChars Number of characters to keep at the start (default: 6)
 * @param endChars Number of characters to keep at the end (default: 4)
 * @returns Formatted address with middle portion replaced by ellipsis
 */
export function formatAddress(address?: string | null, startChars = 6, endChars = 4): string {
  if (!address) return '';
  return truncateMiddle(address, startChars, endChars);
}
