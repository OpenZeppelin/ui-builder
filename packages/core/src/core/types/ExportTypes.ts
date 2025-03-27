/**
 * Export System Types
 *
 * This file contains type definitions for the export system,
 * including template options, export configurations, and results.
 */

import { ChainType } from '@/core/types/ContractSchema';

import type { ZipProgress } from '../../export/ZipGenerator';

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

  /**
   * Target environment for dependencies
   * - 'local': Uses workspace dependencies for local development
   * - 'production': Uses published dependencies for production builds
   * @default 'local'
   */
  env?: 'local' | 'production';
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
   * Blockchain type for the export
   */
  chainType: ChainType;

  /**
   * Whether to include source maps
   * @default false
   */
  includeSourceMaps?: boolean;

  /**
   * Whether to include adapter files in the export
   * @default true
   */
  includeAdapters?: boolean;

  /**
   * Custom README content
   */
  readmeContent?: string;

  /**
   * Progress callback for export operations
   * Used to update UI with progress information
   */
  onProgress?: (progress: ZipProgress) => void;
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
