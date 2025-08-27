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

/**
 * Detects whether a string contains hex-encoded or base64-encoded binary data.
 * Useful for auto-detecting the encoding format of user inputs across blockchain adapters.
 *
 * @param value - The string to analyze
 * @returns 'hex' if the string appears to be hexadecimal, 'base64' if it appears to be base64
 *
 * @example
 * ```typescript
 * detectBytesEncoding("48656c6c6f") // → 'hex'
 * detectBytesEncoding("SGVsbG8=") // → 'base64'
 * detectBytesEncoding("0x48656c6c6f") // → 'hex' (after stripping 0x prefix)
 * ```
 */
export function detectBytesEncoding(value: string): 'base64' | 'hex' {
  const hexRegex = /^[0-9a-fA-F]+$/;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

  if (hexRegex.test(value) && value.length % 2 === 0) {
    return 'hex';
  }

  if (base64Regex.test(value) && value.length % 4 === 0) {
    try {
      // Try to decode as base64 and re-encode to verify it's valid
      const decoded = Buffer.from(value, 'base64');
      return decoded.toString('base64').replace(/=+$/, '') === value.replace(/=+$/, '')
        ? 'base64'
        : 'hex';
    } catch {
      return 'hex';
    }
  }

  return 'base64';
}
