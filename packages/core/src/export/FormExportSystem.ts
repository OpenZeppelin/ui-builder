/**
 * FormExportSystem
 *
 * This class coordinates the form export process by integrating the
 * TemplateManager, FormCodeGenerator, and AdapterExportManager components.
 */

import { FormCodeGenerator } from './generators/FormCodeGenerator';
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

  /**
   * Creates a new FormExportSystem
   */
  constructor() {
    this.templateManager = new TemplateManager();
    this.formCodeGenerator = new FormCodeGenerator();
    this.adapterExportManager = new AdapterExportManager();
    this.packageManager = new PackageManager();
    this.zipGenerator = new ZipGenerator();
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
      const formComponentCode = this.formCodeGenerator.generateFormComponent(
        formConfig,
        chainType,
        functionId
      );

      // 2. Get adapter files if needed
      const adapterFiles =
        exportOptions.includeAdapters !== false
          ? this.adapterExportManager.getAdapterFiles(chainType)
          : {};

      // Create custom files object with generated code
      const customFiles = {
        'src/components/GeneratedForm.tsx': formComponentCode,
        ...adapterFiles,
      };

      // 3. Create the complete project using TemplateManager's createProject method
      // This will properly handle placeholders and combine template files with custom files
      const projectFiles = this.templateManager.createProject(
        exportOptions.template || 'typescript-react-vite',
        customFiles,
        exportOptions
      );

      // 4. Update package.json using PackageManager
      const originalPackageJson = projectFiles['package.json'];
      if (originalPackageJson) {
        projectFiles['package.json'] = this.packageManager.updatePackageJson(
          originalPackageJson,
          formConfig,
          chainType,
          functionId,
          exportOptions
        );
      } else {
        console.warn('No package.json found in template, using default');
        // Create a basic package.json if none exists
        projectFiles['package.json'] = JSON.stringify(
          {
            name: exportOptions.projectName || `${functionId.toLowerCase()}-form`,
            version: '0.1.0',
            private: true,
            type: 'module',
            dependencies: this.packageManager.getDependencies(formConfig, chainType),
          },
          null,
          2
        );
      }

      // Log the final project structure for debugging
      console.log('Total project files for export:', Object.keys(projectFiles).length);
      console.log('Project structure:', Object.keys(projectFiles).sort());

      // 5. Create ZIP file
      const fileName = this.generateFileName(functionId);
      const zipResult = await this.createZipFile(projectFiles, fileName, exportOptions.onProgress);

      // 6. Return the export result with dependencies from PackageManager
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
