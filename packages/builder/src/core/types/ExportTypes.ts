/**
 * Export System Types
 *
 * This file contains type definitions for the export system,
 * including template options, export configurations, and results.
 */
import type { Ecosystem, UiKitConfiguration } from '@openzeppelin/ui-builder-types';

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
   * - 'local': Uses workspace:* dependencies for local development
   * - 'staging': Uses RC versions for QA testing latest features
   * - 'production': Uses published dependencies for production builds
   * @default 'production'
   */
  env?: 'local' | 'staging' | 'production';
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
   * Blockchain ecosystem for the export
   */
  ecosystem: Ecosystem;

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

  /**
   * UI Kit configuration chosen by the user in the builder UI.
   * TODO: Implement UI in UIBuilder (e.g., StepFormCustomization) to allow users to set these options (kitName, kitConfig with exclusions, etc.).
   */
  uiKitConfiguration?: UiKitConfiguration;

  /**
   * Optional adapter-specific artifacts to include in the export.
   * Used by adapters that need to bundle contract artifacts or other ecosystem-specific data.
   * Example: Midnight adapter includes ZK proof artifacts, contract modules, and witness code.
   */
  adapterArtifacts?: {
    /** Adapter-specific artifacts stored during contract loading */
    artifacts?: Record<string, unknown> | null;
    /** Original contract definition (e.g., TypeScript .d.ts for Midnight) */
    definitionOriginal?: string | null;
  };
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
