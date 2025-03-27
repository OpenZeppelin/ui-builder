/**
 * AdapterExportManager
 *
 * This class is responsible for discovering and exporting the appropriate adapter files
 * for a selected blockchain. It uses Vite's build-time capabilities to avoid hardcoding
 * chain types, making it easy to add new blockchain adapters without code changes.
 */

import { ChainType } from '../core/types/ContractSchema';

/**
 * Type for a map of file paths to content
 */
export type AdapterFileMap = Record<string, string>;

/**
 * Typings for glob import results
 */
type LazyGlobImportResult = Record<string, () => Promise<string>>;

// Build-time adapter file discovery using Vite's import.meta.glob
// Files will be lazy-loaded only when needed, not at application startup
const adapterFiles = import.meta.glob<string>('../adapters/*/adapter.ts', {
  query: '?raw',
  import: 'default',
}) as LazyGlobImportResult;
const typeFiles = import.meta.glob<string>('../adapters/*/types.ts', {
  query: '?raw',
  import: 'default',
}) as LazyGlobImportResult;
const utilFiles = import.meta.glob<string>('../adapters/*/utils.ts', {
  query: '?raw',
  import: 'default',
}) as LazyGlobImportResult;

// Core type files for adapter functionality
const coreTypeFiles = import.meta.glob<string>('../core/types/ContractSchema.ts', {
  query: '?raw',
  import: 'default',
}) as LazyGlobImportResult;

// For testing purposes - make file paths available to tests
export const adapterFilePaths = {
  adapter: Object.keys(adapterFiles),
  type: Object.keys(typeFiles),
  util: Object.keys(utilFiles),
  coreType: Object.keys(coreTypeFiles),
};

/**
 * AdapterExportManager handles discovery and export of blockchain adapters
 *
 * PRODUCTION IMPLEMENTATION NOTE:
 *
 * In a production environment, this class would leverage Vite's build-time capabilities
 * to discover and bundle adapter files.
 *
 * Key implementation aspects:
 *
 * 1. Build-time Adapter Discovery:
 *    - Use Vite's import.meta.glob to scan adapter files at build time
 *    - Include all adapter.ts, types.ts, and utils.ts files in the scan
 *    - Bundled files are included directly in the build output
 *
 * 2. Dynamic Registry Creation:
 *    - Extract chain types from directory structure using regex
 *    - Create a map from chain types to file paths
 *    - Include related files (types.ts, utils.ts) when available
 *    - No hardcoded chain types, allowing for easy adapter additions
 *
 * 3. Bundled File Content Access:
 *    - Access pre-bundled content instead of reading files at runtime
 *    - Handle special cases like form-renderer imports
 *    - Return content from bundled file maps
 *
 * This approach ensures all adapter discovery happens at build time, avoiding
 * runtime filesystem operations that wouldn't work in a browser environment.
 */
export class AdapterExportManager {
  private adapterRegistry: Record<ChainType, string[]>;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Creates a new AdapterExportManager instance
   * @param mockRegistry Optional registry for testing
   */
  constructor(mockRegistry?: Record<ChainType, string[]>) {
    if (mockRegistry) {
      // Use the provided mock registry and mark as initialized
      this.adapterRegistry = mockRegistry;
      this.initialized = true;
    } else {
      // Initialize with an empty registry - will be populated on first use
      this.adapterRegistry = {} as Record<ChainType, string[]>;
      this.initialized = false;
    }
  }

  /**
   * Ensure the adapter registry is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return Promise.resolve();
    }

    // If already initializing, return that promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.initializeAdapterRegistry();
    await this.initializationPromise;

    // Mark as initialized and clear the promise
    this.initialized = true;
    this.initializationPromise = null;
  }

  /**
   * Initializes adapter registry using the files discovered at build time by Vite
   */
  private async initializeAdapterRegistry(): Promise<void> {
    const registry: Record<ChainType, string[]> = {} as Record<ChainType, string[]>;
    const adapterPaths = Object.keys(adapterFiles);

    // Process all adapter files discovered by Vite's import.meta.glob
    for (const path of adapterPaths) {
      // Extract chain type from path (e.g., '../adapters/evm/adapter.ts' -> 'evm')
      const match = path.match(/\/adapters\/([^/]+)\//);
      if (match) {
        const chainType = match[1] as ChainType;

        if (!registry[chainType]) {
          registry[chainType] = [];
        }

        // Add adapter.ts file to the registry
        registry[chainType].push(path);

        // Add corresponding types.ts file if it exists
        const typePath = path.replace('adapter.ts', 'types.ts');
        if (typeFiles[typePath]) {
          registry[chainType].push(typePath);
        }

        // Add corresponding utils.ts file if it exists
        const utilPath = path.replace('adapter.ts', 'utils.ts');
        if (utilFiles[utilPath]) {
          registry[chainType].push(utilPath);
        }
      }
    }

    // If no adapters were found, this is likely a critical error in production
    if (Object.keys(registry).length === 0) {
      console.error(
        'No adapters found via import.meta.glob - this may indicate a configuration issue'
      );
    }

    this.adapterRegistry = registry;
  }

  /**
   * Get list of available chain types
   */
  async getAvailableChainTypes(): Promise<ChainType[]> {
    await this.ensureInitialized();
    return Object.keys(this.adapterRegistry) as ChainType[];
  }

  /**
   * Get adapter files for specified chain type
   *
   * @param chainType The blockchain type to get adapter files for
   * @returns A map of file paths to file contents
   */
  async getAdapterFiles(chainType: ChainType): Promise<AdapterFileMap> {
    await this.ensureInitialized();

    if (!this.adapterRegistry[chainType]) {
      throw new Error(`No adapter found for chain type: ${chainType}`);
    }

    const files: AdapterFileMap = {};

    // Add core adapter interface files
    const coreFiles = await this.getCoreAdapterFiles();
    Object.assign(files, coreFiles);

    // Add chain-specific adapter files
    for (const path of this.adapterRegistry[chainType]) {
      // Create output path that normalizes the internal path to exported path
      const outputPath = this.createExportPath(path);
      files[outputPath] = await this.getFileContent(path);
    }

    // Create an adapter barrel file that only exports the needed adapter
    files['src/adapters/index.ts'] = this.createAdapterBarrel(chainType);

    return files;
  }

  /**
   * Get core adapter interface files required by all adapters
   */
  private async getCoreAdapterFiles(): Promise<AdapterFileMap> {
    const coreFiles: AdapterFileMap = {};

    // ContractSchema.ts - Get from core package
    const schemaTypesPath = Object.keys(coreTypeFiles)[0] || '';
    if (schemaTypesPath) {
      try {
        coreFiles['src/types/ContractSchema.ts'] = await this.getFileContent(schemaTypesPath);
      } catch (error) {
        console.warn('Failed to load ContractSchema.ts:', error);
        coreFiles['src/types/ContractSchema.ts'] = '// ContractSchema.ts could not be loaded';
      }
    } else {
      console.warn('No ContractSchema.ts file found');
      coreFiles['src/types/ContractSchema.ts'] = '// ContractSchema.ts file not found';
    }

    return coreFiles;
  }

  /**
   * Create export path for adapter file
   */
  private createExportPath(originalPath: string): string {
    // Transform internal path to exported project path
    // Example: '../adapters/evm/adapter.ts' -> 'src/adapters/evm/adapter.ts'

    // Extract the part after /adapters/
    const match = originalPath.match(/\/adapters\/(.*)/);
    if (match) {
      return `src/adapters/${match[1]}`;
    }

    // For other paths, just use a reasonable default
    return `src/${originalPath.split('/').pop() || ''}`;
  }

  /**
   * Create adapter barrel file that only exports the needed adapter
   */
  private createAdapterBarrel(chainType: ChainType): string {
    const adapterClassName = this.getAdapterClassName(chainType);

    return `// This file is auto-generated - only the ${adapterClassName} is included
import { ${adapterClassName} } from './${chainType}/adapter';

export { ${adapterClassName} };
`;
  }

  /**
   * Get adapter class name from chain type
   */
  private getAdapterClassName(chainType: ChainType): string {
    return `${chainType.charAt(0).toUpperCase()}${chainType.slice(1)}Adapter`;
  }

  /**
   * Get file content from the bundled imports
   *
   * @param path The path to the file
   * @returns The content of the file
   */
  private async getFileContent(path: string): Promise<string> {
    try {
      // Access the file content from the bundled imports
      if (path.includes('/adapters/')) {
        // Adapter files - try adapter, type, and util files in that order
        if (adapterFiles[path]) {
          return await adapterFiles[path]();
        }
        if (typeFiles[path]) {
          return await typeFiles[path]();
        }
        if (utilFiles[path]) {
          return await utilFiles[path]();
        }
        return `// File not found: ${path}`;
      } else if (path.includes('/core/types/')) {
        // Core type files
        if (coreTypeFiles[path]) {
          return await coreTypeFiles[path]();
        }
        return `// File not found: ${path}`;
      }

      return `// Unknown file: ${path}`;
    } catch (error) {
      console.error(`Error loading file content for ${path}:`, error);
      return `// Error loading file: ${path}`;
    }
  }
}
