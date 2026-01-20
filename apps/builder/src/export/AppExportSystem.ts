/**
 * AppExportSystem
 *
 * Orchestrates the entire app export process, integrating modules like
 * TemplateManager, AppCodeGenerator, PackageManager,
 * and ZipGenerator to produce a downloadable ZIP archive containing a
 * standalone app project.
 */
import { ContractAdapter, ContractSchema, NetworkConfig } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

// Lazy import types for dependency management
import type { AppCodeGenerator } from './generators/AppCodeGenerator';
import type { TemplateProcessor } from './generators/TemplateProcessor';

import { getAdapter } from '../core/ecosystemManager';
import type { ExportOptions, ExportResult } from '../core/types/ExportTypes';
import type { BuilderFormConfig } from '../core/types/FormTypes';
import {
  addCoreTemplateFiles,
  addStyleAndRootConfigFiles,
  generateAdapterBootstrapFiles,
  generateAdapterSpecificFiles,
  generateAndAddAppConfig,
  updatePackageJsonFile,
  type BootstrapInfo,
} from './assemblers';
import type { PackageManager } from './PackageManager';
import type { StyleManager } from './StyleManager';
import type { TemplateManager } from './TemplateManager';
import type { ZipGenerator, ZipProgress } from './ZipGenerator';

// Define an interface for constructor dependencies (optional)
interface AppExportSystemDependencies {
  templateManager?: TemplateManager;
  appCodeGenerator?: AppCodeGenerator;
  packageManager?: PackageManager;
  styleManager?: StyleManager;
  zipGenerator?: ZipGenerator;
  templateProcessor?: TemplateProcessor;
}

/**
 * AppExportSystem class coordinates the complete app export process,
 * integrating the template system, code generator, adapter export, package management,
 * and style management.
 */
export class AppExportSystem {
  private templateManager: TemplateManager | undefined;
  private appCodeGenerator: AppCodeGenerator | undefined;
  private packageManager: PackageManager | undefined;
  private styleManager: StyleManager | undefined;
  private zipGenerator: ZipGenerator | undefined;
  private templateProcessor: TemplateProcessor | undefined;
  private dependencies: AppExportSystemDependencies;
  private initialized = false;

  /**
   * Creates a new AppExportSystem instance.
   * Dependencies are lazy-loaded when first needed to enable code splitting.
   */
  constructor(dependencies: AppExportSystemDependencies = {}) {
    // Store provided dependencies for testing
    this.dependencies = dependencies;
  }

  /**
   * Lazy initialization of dependencies.
   * This ensures modules are only loaded when export is actually used.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    logger.info('Export System', 'Lazy loading export dependencies...');

    // Use provided dependencies or lazy load the modules
    if (this.dependencies.templateManager) {
      this.templateManager = this.dependencies.templateManager;
    } else {
      const { TemplateManager } = await import('./TemplateManager');
      this.templateManager = new TemplateManager();
    }

    if (this.dependencies.appCodeGenerator) {
      this.appCodeGenerator = this.dependencies.appCodeGenerator;
    } else {
      const { AppCodeGenerator } = await import('./generators/AppCodeGenerator');
      this.appCodeGenerator = new AppCodeGenerator();
    }

    if (this.dependencies.packageManager) {
      this.packageManager = this.dependencies.packageManager;
    } else {
      const { PackageManager } = await import('./PackageManager');
      this.packageManager = new PackageManager();
    }

    if (this.dependencies.styleManager) {
      this.styleManager = this.dependencies.styleManager;
    } else {
      const { StyleManager } = await import('./StyleManager');
      this.styleManager = new StyleManager();
    }

    if (this.dependencies.zipGenerator) {
      this.zipGenerator = this.dependencies.zipGenerator;
    } else {
      const { ZipGenerator } = await import('./ZipGenerator');
      this.zipGenerator = new ZipGenerator();
    }

    if (this.dependencies.templateProcessor) {
      this.templateProcessor = this.dependencies.templateProcessor;
    } else {
      const { TemplateProcessor } = await import('./generators/TemplateProcessor');
      this.templateProcessor = new TemplateProcessor({});
    }

    this.initialized = true;
    logger.info('Export System', 'Export dependencies loaded successfully.');
  }

  /**
   * Main entry point for the export process. Exports an app based on the provided
   * app configuration, ecosystem, and options.
   *
   * @param formConfig Form configuration created in the builder
   * @param contractSchema Full contract schema including function details
   * @param networkConfig Network configuration including ecosystem
   * @param functionId Function ID this app is for
   * @param options Export customization options
   * @returns An export result with the file blob and metadata
   */
  async exportApp(
    formConfig: BuilderFormConfig,
    contractSchema: ContractSchema,
    networkConfig: NetworkConfig,
    functionId: string,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    // Ensure all dependencies are loaded
    await this.ensureInitialized();

    // Ensure ecosystem is set in options from networkConfig
    const exportOptions: ExportOptions = {
      ecosystem: networkConfig.ecosystem,
      ...options,
    };

    try {
      logger.info('Export System', 'Starting export process...');
      logger.info('Export System', 'Options:', exportOptions);

      // Get the adapter instance for the selected network
      const adapter = await getAdapter(networkConfig);

      // 1. Generate all necessary code components
      logger.info('Export System', 'Generating code components...');
      const mainTsxCode = await this.appCodeGenerator!.generateMainTsx(networkConfig);
      const appComponentCode = await this.appCodeGenerator!.generateAppComponent(
        networkConfig.ecosystem,
        functionId
      );
      const formComponentCode = await this.appCodeGenerator!.generateFormComponent(
        formConfig,
        contractSchema,
        networkConfig,
        functionId
      );

      // 2. Prepare custom files object
      const customFiles = {
        'src/main.tsx': mainTsxCode,
        'src/App.tsx': appComponentCode,
        'src/components/GeneratedForm.tsx': formComponentCode,
      };

      // 3. Assemble Project Files
      logger.info('Export System', 'Assembling project files...');
      const projectFiles = await this.assembleProjectFiles(
        formConfig,
        contractSchema,
        networkConfig,
        functionId,
        exportOptions,
        customFiles,
        adapter
      );
      logger.info('Export System', `Project files assembled: ${Object.keys(projectFiles).length}`);

      // 4. Create ZIP file
      logger.info('Export System', 'Generating ZIP file...');
      const fileName = this.generateFileName(functionId);
      const zipResult = await this.createZipFile(projectFiles, fileName, exportOptions.onProgress);
      logger.info('Export System', `ZIP file generated: ${zipResult.fileName}`);

      // 5. Prepare and return the final export result
      const dependencies = await this.packageManager!.getDependencies(
        formConfig,
        networkConfig.ecosystem
      );
      const finalResult: ExportResult = {
        data: zipResult.data,
        fileName: zipResult.fileName,
        dependencies,
      };
      logger.info('Export System', 'Export process complete.');
      return finalResult;
    } catch (error) {
      logger.error('Export System', 'Export failed:', error);
      throw new Error(`Export failed: ${(error as Error).message}`);
    }
  }

  /**
   * Assembles the complete set of project files by merging template files,
   * generated code, styles, configs, and applying necessary modifications.
   * @private
   */
  private async assembleProjectFiles(
    formConfig: BuilderFormConfig,
    contractSchema: ContractSchema,
    networkConfig: NetworkConfig,
    functionId: string,
    exportOptions: ExportOptions,
    customFiles: Record<string, string>,
    adapter: ContractAdapter
  ): Promise<Record<string, string | Uint8Array | Blob>> {
    logger.info('File Assembly', 'Starting file assembly process...');

    const projectFiles: Record<string, string | Uint8Array | Blob> = await addCoreTemplateFiles(
      this.templateManager!,
      exportOptions,
      customFiles
    );
    await addStyleAndRootConfigFiles(projectFiles, this.styleManager!, this.templateProcessor!);
    await generateAndAddAppConfig(projectFiles, networkConfig, this.templateProcessor!, formConfig);
    await generateAdapterSpecificFiles(projectFiles, adapter, formConfig);

    // Generate adapter bootstrap files if the adapter supports it
    const bootstrapInfo = await generateAdapterBootstrapFiles(
      projectFiles as unknown as Record<string, string>,
      adapter,
      {
        formConfig,
        contractSchema,
        networkConfig,
        artifacts: exportOptions.adapterArtifacts?.artifacts,
        definitionOriginal: exportOptions.adapterArtifacts?.definitionOriginal,
        functionId,
      }
    );

    await updatePackageJsonFile(
      projectFiles,
      this.packageManager!,
      formConfig,
      networkConfig,
      functionId,
      exportOptions
    );
    await this.formatJsonFiles(projectFiles);

    // Inject bootstrap code into main.tsx if provided
    if (bootstrapInfo) {
      this.injectBootstrapCode(projectFiles, bootstrapInfo);
    }

    logger.info('File Assembly', 'File assembly complete.');
    return projectFiles;
  }

  /**
   * Injects bootstrap imports and initialization code into main.tsx
   * using reliable template markers instead of fragile regex patterns.
   * @private
   */
  private injectBootstrapCode(
    projectFiles: Record<string, string | Uint8Array | Blob>,
    bootstrapInfo: BootstrapInfo
  ) {
    const mainTsxPath = 'src/main.tsx';
    const mainTsxContent = projectFiles[mainTsxPath];
    if (!mainTsxContent || typeof mainTsxContent !== 'string') {
      logger.warn(
        'Export System',
        'main.tsx not found or not a string, skipping bootstrap injection'
      );
      return;
    }

    let content = mainTsxContent;

    // Inject imports at the designated marker
    if (bootstrapInfo.imports.length > 0) {
      const importsStr = '\n' + bootstrapInfo.imports.join('\n');
      content = content.replace(
        /\/\*@@ADAPTER_BOOTSTRAP_IMPORTS_INJECTION_POINT@@\*\//,
        importsStr
      );
    } else {
      // Remove the marker if no imports
      content = content.replace(/\/\*@@ADAPTER_BOOTSTRAP_IMPORTS_INJECTION_POINT@@\*\/\n?/, '');
    }

    // Inject initialization code at the designated marker
    if (bootstrapInfo.initAfterAdapterConstruct) {
      const initCode = '\n    ' + bootstrapInfo.initAfterAdapterConstruct;
      content = content.replace(/\/\*@@ADAPTER_BOOTSTRAP_CODE_INJECTION_POINT@@\*\//, initCode);
    } else {
      // Remove the marker if no initialization code
      content = content.replace(/\s*\/\*@@ADAPTER_BOOTSTRAP_CODE_INJECTION_POINT@@\*\//, '');
    }

    projectFiles[mainTsxPath] = content;
    logger.info('Export System', 'Bootstrap code injected into main.tsx via template markers');
  }

  /**
   * Format JSON files with Prettier
   *
   * @param files Map of file paths to content
   */
  private async formatJsonFiles(files: Record<string, string | Uint8Array | Blob>): Promise<void> {
    const jsonFiles = Object.keys(files).filter((path) => path.endsWith('.json'));
    for (const path of jsonFiles) {
      const content = files[path];
      if (typeof content === 'string') {
        try {
          files[path] = await this.templateProcessor!.formatJson(content);
        } catch (error) {
          logger.warn(
            'File Assembly',
            `Failed to format ${path}, using unformatted version:`,
            error
          );
        }
      }
    }
  }

  /**
   * Create a ZIP file from the project files
   *
   * @param files Map of file paths to content
   * @param fileName Suggested filename for the ZIP
   * @param onProgress Optional callback for progress updates
   * @returns A result containing the ZIP blob and filename
   */
  private async createZipFile(
    files: Record<string, string | Uint8Array | Blob>,
    fileName: string,
    onProgress?: (progress: ZipProgress) => void
  ) {
    logger.info('Export System', `Creating ZIP file with ${Object.keys(files).length} files`);

    return this.zipGenerator!.createZipFile(files, fileName, {
      onProgress,
      compressionLevel: 6, // Moderate compression
    });
  }

  /**
   * Generate a filename for the exported package
   * @param functionId Function ID
   * @returns A suitable filename in kebab-case format
   */
  private generateFileName(functionId: string): string {
    // Convert to kebab case by replacing non-alphanumeric chars with hyphens
    const kebabName = functionId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace sequences of non-alphanumeric chars with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    return `${kebabName}-form.zip`;
  }
}
