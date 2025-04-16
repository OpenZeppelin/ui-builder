/**
 * Form section for organizing fields
 */
export interface FormSection {
  /**
   * Unique identifier for the section
   */
  id: string;

  /**
   * Section title
   */
  title: string;

  /**
   * Optional section description
   */
  description?: string;

  /**
   * Whether the section can be collapsed
   */
  collapsible?: boolean;

  /**
   * Whether the section is collapsed by default
   */
  defaultCollapsed?: boolean;

  /**
   * Field IDs included in this section
   */
  fields: string[];
}

/**
 * Layout configuration for form rendering
 */
export interface FormLayout {
  /**
   * Number of columns in the layout grid
   */
  columns: number;

  /**
   * Spacing between form elements
   */
  spacing: 'compact' | 'normal' | 'relaxed';

  /**
   * Position of field labels
   */
  labelPosition: 'top' | 'left' | 'hidden';

  /**
   * Sections for organizing fields
   */
  sections?: FormSection[];
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
