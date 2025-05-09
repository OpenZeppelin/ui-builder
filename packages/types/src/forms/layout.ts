/**
 * Layout configuration for form rendering (fixed values)
 */
export interface FormLayout {
  /**
   * Number of columns in the layout grid (fixed to 1)
   */
  columns: 1;

  /**
   * Spacing between form elements (fixed to 'normal')
   */
  spacing: 'normal';

  /**
   * Position of field labels (fixed to 'top')
   */
  labelPosition: 'top';
}

/**
 * Submit button configuration
 */
export interface SubmitButtonConfig {
  /**
   * Text displayed on the button
   */
  text: string;

  /**
   * Text displayed while submitting
   */
  loadingText: string;

  /**
   * Custom button style
   */
  variant?: 'primary' | 'secondary' | 'outline';
}
