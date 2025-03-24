/**
 * Export System Types
 *
 * This file contains type definitions for the export system,
 * including template options, export configurations, and results.
 */

/**
 * Options for customizing a template
 */
export interface TemplateOptions {
  /**
   * Custom name for the exported project
   */
  projectName?: string;

  /**
   * Custom description for the project
   */
  description?: string;

  /**
   * Author information
   */
  author?: string;

  /**
   * License for the exported project
   */
  license?: string;

  /**
   * Additional dependencies to include
   */
  dependencies?: Record<string, string>;
}

/**
 * Options for the export process
 */
export interface ExportOptions extends TemplateOptions {
  /**
   * Name of the template to use
   * @default 'typescript-react-vite'
   */
  template?: string;

  /**
   * Whether to include source maps
   * @default false
   */
  includeSourceMaps?: boolean;

  /**
   * Custom README content
   */
  readmeContent?: string;
}

/**
 * Result of the export operation
 */
export interface ExportResult {
  /**
   * The ZIP file blob for download
   */
  zipBlob: Blob;

  /**
   * Suggested filename for the download
   */
  fileName: string;

  /**
   * Information about the dependencies used
   */
  dependencies: Record<string, string>;
}
