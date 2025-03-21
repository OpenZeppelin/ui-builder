/**
 * Layout utility functions for form components
 */

/**
 * Helper function to get width classes based on the field width
 */
export function getWidthClasses(width: 'full' | 'half' | 'third'): string {
  switch (width) {
    case 'half':
      return 'form-field-half';
    case 'third':
      return 'form-field-third';
    case 'full':
    default:
      return 'form-field-full';
  }
}
