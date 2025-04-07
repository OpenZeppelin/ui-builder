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

  /**
   * Whether the export target is intended for build/serve via the CLI in the monorepo context
   */
  isCliBuildTarget?: boolean;
}

/**
 * Represents the result of a form export operation.
 */
export interface ExportResult {
  /**
   * The generated ZIP file data (Blob in browser, Buffer in Node.js).
   */
  data: Blob | Buffer;

  /**
   * Suggested filename for the generated ZIP file.
   */
  fileName: string;

  /**
   * List of dependencies required by the exported project.
   */
  dependencies: Record<string, string>;
}
