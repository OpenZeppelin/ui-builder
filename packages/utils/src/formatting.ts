/**
 * String and date formatting utility functions
 * These utilities help with common formatting operations
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

/**
 * Formats a timestamp as a relative time string (e.g., "2h ago", "just now")
 * @param date The date to format
 * @returns A human-readable relative time string
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
