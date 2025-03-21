/**
 * CSS utility functions
 */

/**
 * Combines multiple CSS class names into a single string
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
