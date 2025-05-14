/**
 * String formatting utility functions
 * These utilities help with common string formatting operations
 */

/**
 * Truncates a string (like an Ethereum address) in the middle
 * @param str The string to truncate
 * @param startChars Number of characters to show at the beginning
 * @param endChars Number of characters to show at the end
 * @returns The truncated string with ellipsis in the middle
 */
export function truncateMiddle(str: string, startChars = 6, endChars = 4): string {
  if (!str) return '';
  if (str.length <= startChars + endChars) return str;

  return `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`;
}
