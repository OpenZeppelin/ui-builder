/**
 * CSS utility functions
 */

/**
 * Combines multiple CSS class names into a single string
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Returns width classes based on the provided size
 */
export function getWidthClasses(width: 'full' | 'half' | 'third'): string {
  switch (width) {
    case 'half':
      return 'w-full md:w-1/2';
    case 'third':
      return 'w-full md:w-1/3';
    case 'full':
    default:
      return 'w-full';
  }
}
