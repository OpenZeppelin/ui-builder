/**
 * Types related to renderer configuration
 */

/**
 * Configuration for the renderer package
 * This interface defines dependencies and settings for the renderer
 * that will be used when exporting form projects.
 */
export interface RendererConfig {
  /**
   * Core dependencies required for all renderer projects
   */
  coreDependencies: Record<string, string>;

  /**
   * Field-specific dependencies required for different field types
   */
  fieldDependencies: Record<
    string,
    {
      /**
       * Runtime dependencies needed for the field type
       */
      runtimeDependencies: Record<string, string>;

      /**
       * Development dependencies needed for the field type
       */
      devDependencies?: Record<string, string>;
    }
  >;

  // Additional configuration properties can be added in the future
  // as renderer evolves, without breaking existing implementations
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
