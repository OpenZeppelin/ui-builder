/**
 * FormExportSystem
 *
 * This class coordinates the form export process by integrating the
 * TemplateManager, FormCodeGenerator, and AdapterExportManager components.
 */

import { FormCodeGenerator } from './generators/FormCodeGenerator';
import { TemplateProcessor } from './generators/TemplateProcessor';
import { AdapterExportManager } from './AdapterExportManager';
import { PackageManager } from './PackageManager';
import { TemplateManager } from './TemplateManager';
import { ZipGenerator, type ZipProgress } from './ZipGenerator';

import type { ChainType } from '../core/types/ContractSchema';
import type { ExportOptions, ExportResult } from '../core/types/ExportTypes';
import type { BuilderFormConfig } from '../core/types/FormTypes';

/**
 * FormExportSystem class coordinates the complete form export process,
 * integrating the template system, code generator, and adapter export.
 */
export class FormExportSystem {
  private templateManager: TemplateManager;
  private formCodeGenerator: FormCodeGenerator;
  private adapterExportManager: AdapterExportManager;
  private packageManager: PackageManager;
  private zipGenerator: ZipGenerator;
  private templateProcessor: TemplateProcessor;

  /**
   * Creates a new FormExportSystem
   */
  constructor() {
    this.templateManager = new TemplateManager();
    this.formCodeGenerator = new FormCodeGenerator();
    this.adapterExportManager = new AdapterExportManager();
    this.packageManager = new PackageManager();
    this.zipGenerator = new ZipGenerator();
    this.templateProcessor = new TemplateProcessor({});
  }

  /**
   * Main entry point for the export process. Exports a form based on the provided
   * form configuration, chain type, and options.
   *
   * @param formConfig Form configuration created in the builder
   * @param chainType Blockchain type (evm, solana, etc.)
   * @param functionId Function ID this form is for
   * @param options Export customization options
   * @returns An export result with the file blob and metadata
   */
  async exportForm(
    formConfig: BuilderFormConfig,
    chainType: ChainType,
    functionId: string,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    // Ensure chainType is set in options
    const exportOptions: ExportOptions = {
      chainType,
      ...options,
    };

    try {
      // 1. Generate form component code
      const formComponentCode = await this.formCodeGenerator.generateFormComponent(
        formConfig,
        chainType,
        functionId
      );

      // 2. Generate App component code
      const appComponentCode = await this.formCodeGenerator.generateUpdatedAppComponent(functionId);

      // 3. Get adapter files if needed
      const adapterFiles =
        exportOptions.includeAdapters !== false
          ? await this.adapterExportManager.getAdapterFiles(chainType)
          : {};

      // Create custom files object with generated code
      const customFiles = {
        'src/App.tsx': appComponentCode,
        'src/components/GeneratedForm.tsx': formComponentCode,
        ...adapterFiles,
      };

      // 4. Create the complete project using TemplateManager's createProject method
      // This will properly handle placeholders and combine template files with custom files
      const projectFiles = await this.templateManager.createProject(
        exportOptions.template || 'typescript-react-vite',
        customFiles,
        exportOptions
      );

      // 5. Remove any adapter files when includeAdapters is false
      if (exportOptions.includeAdapters === false) {
        // Remove all files under src/adapters/
        Object.keys(projectFiles).forEach((path) => {
          if (path.startsWith('src/adapters/')) {
            delete projectFiles[path];
          }
        });
      }

      // 6. Update package.json using PackageManager
      const originalPackageJson = projectFiles['package.json'];
      if (originalPackageJson) {
        console.log('Updating package.json with formatted version...');
        projectFiles['package.json'] = this.packageManager.updatePackageJson(
          originalPackageJson,
          formConfig,
          chainType,
          functionId,
          exportOptions
        );
      } else {
        console.error('No package.json found in template, using default');
        // Fail early if no package.json is found
        throw new Error('No package.json found in template');
      }

      // 7. Format JSON files with Prettier
      console.log('Project files before formatting:', Object.keys(projectFiles));
      console.log('Found package.json?', projectFiles['package.json'] ? 'Yes' : 'No');
      if (projectFiles['package.json']) {
        console.log(
          'package.json first 100 chars:',
          projectFiles['package.json'].substring(0, 100)
        );
      }

      await this.formatJsonFiles(projectFiles);

      // Log the final project structure for debugging
      console.log('Total project files for export:', Object.keys(projectFiles).length);
      console.log('Project structure:', Object.keys(projectFiles).sort());

      // 8. Create ZIP file
      const fileName = this.generateFileName(functionId);
      const zipResult = await this.createZipFile(projectFiles, fileName, exportOptions.onProgress);

      // 9. Return the export result with dependencies from PackageManager
      return {
        zipBlob: zipResult.blob,
        fileName: zipResult.fileName,
        dependencies: this.packageManager.getDependencies(formConfig, chainType),
      };
    } catch (error) {
      console.error('Error exporting form:', error);
      throw new Error(`Export failed: ${(error as Error).message}`);
    }
  }

  /**
   * Format JSON files with Prettier
   *
   * @param files Map of file paths to content
   */
  private async formatJsonFiles(files: Record<string, string>): Promise<void> {
    // Get all .json files by checking file extensions
    const jsonFiles = Object.keys(files).filter((path) => path.endsWith('.json'));

    console.log('Found JSON files to format:', jsonFiles);

    for (const path of jsonFiles) {
      try {
        console.log(`Formatting ${path} with JSON formatter...`);
        const before = files[path].substring(0, 100) + '...'; // Log first 100 chars

        // Use our specialized JSON formatter
        files[path] = await this.templateProcessor.formatJson(files[path]);

        const after = files[path].substring(0, 100) + '...'; // Log first 100 chars
        console.log(`Before formatting: ${before}`);
        console.log(`After formatting: ${after}`);
      } catch (error) {
        console.warn(`Failed to format ${path}, using unformatted version:`, error);
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
    console.log(`Creating ZIP file with ${Object.keys(files).length} files`);

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
