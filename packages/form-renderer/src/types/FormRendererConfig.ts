/**
 * Types related to form-renderer configuration
 */

/**
 * Configuration for the form-renderer package
 * This interface defines dependencies and settings for the form-renderer
 * that will be used when exporting form projects.
 */
export interface FormRendererConfig {
  /**
   * Dependencies for specific field types
   * Only dependencies for fields used in a form will be included in exports
   *
   * Organized by field type (e.g., 'date', 'select', 'file', etc.)
   */
  fieldDependencies: Record<string, FieldTypeDependencies>;

  /**
   * Core dependencies required by form-renderer
   * These will be included in all exported projects
   *
   * Format: { packageName: versionRange }
   * Example: { "react": "^18.2.0" }
   */
  coreDependencies: Record<string, string>;

  // Additional configuration properties can be added in the future
  // as form-renderer evolves, without breaking existing implementations
}

/**
 * Dependencies for a specific field type
 */
export interface FieldTypeDependencies {
  /**
   * Runtime dependencies for this field type
   * Format: { packageName: versionRange }
   * Example: { "react-datepicker": "^4.14.0" }
   */
  runtimeDependencies: Record<string, string>;

  /**
   * Development dependencies for this field type
   * Format: { packageName: versionRange }
   * Example: { "@types/react-datepicker": "^4.11.2" }
   */
  devDependencies?: Record<string, string>;
}
