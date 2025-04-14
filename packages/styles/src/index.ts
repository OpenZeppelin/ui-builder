/**
 * Styles package for the Transaction Form Builder
 */

import './index.css';

// Export CSS utility functions
export * from './utils';

// Export any CSS utility functions here
export const getCssVariable = (name: string): string => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name);
};

// Export constants for form styling
export const FORM_FIELD_CLASSES = 'form-field';
export const FORM_LABEL_CLASSES = 'form-label';
export const FORM_INPUT_CLASSES = 'form-input';
export const FORM_HELPER_TEXT_CLASSES = 'form-helper-text';
export const FORM_ERROR_CLASSES = 'form-error';
