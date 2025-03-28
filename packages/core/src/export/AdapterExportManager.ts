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

// Core utility files
const generalUtilFiles = import.meta.glob<string>('../core/utils/general.ts', {
  query: '?raw',
  import: 'default',
}) as LazyGlobImportResult;

// Get the adapter index file that contains the ContractAdapter interface
const adapterIndexFiles = import.meta.glob<string>('../adapters/index.ts', {
  query: '?raw',
  import: 'default',
}) as LazyGlobImportResult;

// For testing purposes - make file paths available to tests
export const adapterFilePaths = {
  adapter: Object.keys(adapterFiles),
  type: Object.keys(typeFiles),
  util: Object.keys(utilFiles),
  coreType: Object.keys(coreTypeFiles),
  generalUtil: Object.keys(generalUtilFiles),
  adapterIndex: Object.keys(adapterIndexFiles),
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

    // Add core utility files
    const generalUtilsFiles = await this.getGeneralUtilFiles();
    Object.assign(files, generalUtilsFiles);

    // Add chain-specific adapter files
    for (const path of this.adapterRegistry[chainType]) {
      // Create output path that normalizes the internal path to exported path
      const outputPath = this.createExportPath(path);
      files[outputPath] = await this.getFileContent(path);
    }

    // Process and add the adapter index file with the ContractAdapter interface
    files['src/adapters/index.ts'] = await this.processAdapterIndex(chainType);

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
        coreFiles['src/core/types/ContractSchema.ts'] = await this.getFileContent(schemaTypesPath);
      } catch (error) {
        console.warn('Failed to load ContractSchema.ts:', error);
        coreFiles['src/core/types/ContractSchema.ts'] = '// ContractSchema.ts could not be loaded';
      }
    } else {
      console.warn('No ContractSchema.ts file found');
      coreFiles['src/core/types/ContractSchema.ts'] = '// ContractSchema.ts file not found';
    }

    return coreFiles;
  }

  /**
   * Get general utility files required by adapters
   */
  private async getGeneralUtilFiles(): Promise<AdapterFileMap> {
    const utilFiles: AdapterFileMap = {};

    // utils.ts - Get from core package
    const utilsPath = Object.keys(generalUtilFiles)[0] || '';
    if (utilsPath) {
      try {
        utilFiles['src/core/utils/general.ts'] = await this.getFileContent(utilsPath);
      } catch (error) {
        console.error('Failed to load general.ts:', error);
        throw new Error('Failed to load required utility file: general.ts');
      }
    } else {
      console.error('No general.ts file found');
      throw new Error('Required utility file general.ts not found');
    }

    return utilFiles;
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
   * Process the adapter index file to include only the ContractAdapter interface
   * and the selected blockchain adapter
   *
   * @param chainType The blockchain type to keep in the index file
   */
  private async processAdapterIndex(chainType: ChainType): Promise<string> {
    const adapterClassName = this.getAdapterClassName(chainType);
    const indexPath = Object.keys(adapterIndexFiles)[0] || '';

    if (!indexPath) {
      console.warn('No adapter index file found');
      throw new Error('No adapter index file found');
    }

    try {
      // Get the original index.ts content
      const originalContent = await adapterIndexFiles[indexPath]();

      // Process the content to retain the ContractAdapter interface
      // and only the selected blockchain adapter
      const processedContent = this.processIndexContent(
        originalContent,
        chainType,
        adapterClassName
      );
      return processedContent;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process the index.ts content to remove other blockchain adapters
   * while keeping the ContractAdapter interface
   */
  private processIndexContent(
    content: string,
    chainType: ChainType,
    adapterClassName: string
  ): string {
    // Add a header comment
    let processedContent = `/**
 * Modified adapter index file
 * Only includes the ${adapterClassName} and the ContractAdapter interface
 */

`;

    // First, keep the imports from form-renderer
    const formRendererImports = content.match(
      /import.*?from\s+['"]@openzeppelin\/transaction-form-renderer['"];?/g
    );
    if (formRendererImports) {
      processedContent += formRendererImports.join('\n') + '\n\n';
    }

    // Add only the import for the selected blockchain adapter
    processedContent += `import ${adapterClassName} from './${chainType}/adapter.ts';\n\n`;

    // Keep the ContractSchema imports
    const schemaImports = content.match(
      /import.*?from\s+['"]\.\.\/core\/types\/ContractSchema['"];?/g
    );
    if (schemaImports) {
      // Only include ContractSchema and FunctionParameter
      processedContent += `import type { ContractSchema, FunctionParameter } from '../core/types/ContractSchema';\n\n`;
    }

    // Extract and keep the ContractAdapter interface definition
    const interfaceStartPattern =
      /\/\*\*\s*\n\s*\*\s*Interface\s*for\s*contract\s*adapters[\s\S]*?export\s+interface\s+ContractAdapter\s*\{/;
    const startMatch = content.match(interfaceStartPattern);

    if (startMatch && startMatch.index !== undefined) {
      const startIndex = startMatch.index;
      const interfaceStart = startMatch[0];

      // Find the closing brace of the interface by counting braces
      let braceCount = 1; // Start with 1 for the opening brace
      let endIndex = startIndex + interfaceStart.length;

      while (braceCount > 0 && endIndex < content.length) {
        if (content[endIndex] === '{') braceCount++;
        if (content[endIndex] === '}') braceCount--;
        endIndex++;
      }

      // Extract the complete interface
      const completeInterface = content.substring(startIndex, endIndex);
      processedContent += completeInterface + '\n\n';
    }

    // Export the selected adapter class
    processedContent += `// Export the selected adapter\n`;
    processedContent += `export { ${adapterClassName} };\n`;

    return processedContent;
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
      } else if (path.includes('/core/utils/')) {
        // General utility files
        if (generalUtilFiles[path]) {
          return await generalUtilFiles[path]();
        }
        throw new Error(`General utility file not found: ${path}`);
      }

      return `// Unknown file: ${path}`;
    } catch (error) {
      console.error(`Error loading file content for ${path}:`, error);
      return `// Error loading file: ${path}`;
    }
  }
}
