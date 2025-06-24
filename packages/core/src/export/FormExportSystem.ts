/**
 * FormExportSystem
 *
 * Orchestrates the entire form export process, integrating modules like
 * TemplateManager, FormCodeGenerator, PackageManager,
 * and ZipGenerator to produce a downloadable ZIP archive containing a
 * standalone form project.
 */
import {
  ContractAdapter,
  ContractSchema,
  NetworkConfig,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { getAdapter } from '../core/ecosystemManager';
import type { ExportOptions, ExportResult } from '../core/types/ExportTypes';
import type { BuilderFormConfig } from '../core/types/FormTypes';

import { FormCodeGenerator } from './generators/FormCodeGenerator';
import { TemplateProcessor } from './generators/TemplateProcessor';

import { PackageManager } from './PackageManager';
import { StyleManager } from './StyleManager';
import { TemplateManager } from './TemplateManager';
import { ZipGenerator, type ZipProgress } from './ZipGenerator';
import {
  addCoreTemplateFiles,
  addStyleAndRootConfigFiles,
  applyCliTargetModifications,
  generateAdapterSpecificFiles,
  generateAndAddAppConfig,
  updatePackageJsonFile,
} from './assemblers';

// Define an interface for constructor dependencies (optional)
interface FormExportSystemDependencies {
  templateManager?: TemplateManager;
  formCodeGenerator?: FormCodeGenerator;
  packageManager?: PackageManager;
  styleManager?: StyleManager;
  zipGenerator?: ZipGenerator;
  templateProcessor?: TemplateProcessor;
}

/**
 * FormExportSystem class coordinates the complete form export process,
 * integrating the template system, code generator, adapter export, package management,
 * and style management.
 */
export class FormExportSystem {
  private templateManager: TemplateManager;
  private formCodeGenerator: FormCodeGenerator;
  private packageManager: PackageManager;
  private styleManager: StyleManager;
  private zipGenerator: ZipGenerator;
  private templateProcessor: TemplateProcessor;

  /**
   * Creates a new FormExportSystem instance, initializing all necessary managers.
   * Accepts optional dependencies for testing purposes.
   */
  constructor(dependencies: FormExportSystemDependencies = {}) {
    // Use provided instances or create new ones
    this.templateManager = dependencies.templateManager ?? new TemplateManager();
    this.formCodeGenerator = dependencies.formCodeGenerator ?? new FormCodeGenerator();
    this.packageManager = dependencies.packageManager ?? new PackageManager();
    this.styleManager = dependencies.styleManager ?? new StyleManager();
    this.zipGenerator = dependencies.zipGenerator ?? new ZipGenerator();
    this.templateProcessor = dependencies.templateProcessor ?? new TemplateProcessor({});
  }

  /**
   * Main entry point for the export process. Exports a form based on the provided
   * form configuration, ecosystem, and options.
   *
   * @param formConfig Form configuration created in the builder
   * @param contractSchema Full contract schema including ABI/function details
   * @param networkConfig Network configuration including ecosystem
   * @param functionId Function ID this form is for
   * @param options Export customization options
   * @returns An export result with the file blob and metadata
   */
  async exportForm(
    formConfig: BuilderFormConfig,
    contractSchema: ContractSchema,
    networkConfig: NetworkConfig,
    functionId: string,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
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
      const mainTsxCode = await this.formCodeGenerator.generateMainTsx(networkConfig);
      const appComponentCode = await this.formCodeGenerator.generateAppComponent(
        networkConfig.ecosystem,
        functionId
      );
      const formComponentCode = await this.formCodeGenerator.generateFormComponent(
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
      const dependencies = await this.packageManager.getDependencies(
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
    networkConfig: NetworkConfig,
    functionId: string,
    exportOptions: ExportOptions,
    customFiles: Record<string, string>,
    adapter: ContractAdapter
  ): Promise<Record<string, string>> {
    logger.info('File Assembly', 'Starting file assembly process...');

    const projectFiles = await addCoreTemplateFiles(
      this.templateManager,
      exportOptions,
      customFiles
    );
    await addStyleAndRootConfigFiles(projectFiles, this.styleManager, this.templateProcessor);
    await generateAndAddAppConfig(projectFiles, networkConfig, this.templateProcessor, formConfig);
    await generateAdapterSpecificFiles(projectFiles, adapter, formConfig);
    await updatePackageJsonFile(
      projectFiles,
      this.packageManager,
      formConfig,
      networkConfig,
      functionId,
      exportOptions
    );
    await applyCliTargetModifications(projectFiles, exportOptions);
    await this.formatJsonFiles(projectFiles);

    logger.info('File Assembly', 'File assembly complete.');
    return projectFiles;
  }

  /**
   * Format JSON files with Prettier
   *
   * @param files Map of file paths to content
   */
  private async formatJsonFiles(files: Record<string, string>): Promise<void> {
    const jsonFiles = Object.keys(files).filter((path) => path.endsWith('.json'));
    for (const path of jsonFiles) {
      try {
        files[path] = await this.templateProcessor.formatJson(files[path]);
      } catch (error) {
        logger.warn('File Assembly', `Failed to format ${path}, using unformatted version:`, error);
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
    files: Record<string, string>,
    fileName: string,
    onProgress?: (progress: ZipProgress) => void
  ) {
    logger.info('Export System', `Creating ZIP file with ${Object.keys(files).length} files`);

    return this.zipGenerator.createZipFile(files, fileName, {
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
