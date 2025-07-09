/**
 * URL validation utilities
 */

/**
 * Validates if a string is a valid URL (supports http, https, and ftp protocols).
 * Relies solely on the URL constructor for validation.
 *
 * @param urlString - The string to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  try {
    // First check with URL constructor for basic validity
    new URL(urlString);

    return true;
  } catch {
    return false;
  }
}

/**
 * Gets a user-friendly error message for invalid URLs.
 *
 * @returns Standard error message for invalid URLs
 */
export function getInvalidUrlMessage(): string {
  return 'Please enter a valid URL (e.g., https://example.com)';
}
