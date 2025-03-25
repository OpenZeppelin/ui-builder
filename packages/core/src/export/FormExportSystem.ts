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

  /**
   * Creates a new FormExportSystem
   */
  constructor() {
    this.templateManager = new TemplateManager();
    this.formCodeGenerator = new FormCodeGenerator();
    this.adapterExportManager = new AdapterExportManager();
    this.packageManager = new PackageManager();
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

    // 1. Generate form component code
    const formComponentCode = this.formCodeGenerator.generateFormComponent(
      formConfig,
      chainType,
      functionId
    );

    // 2. Get template files
    const templateFiles = this.templateManager.getTemplateFiles(
      exportOptions.template || 'typescript-react-vite',
      exportOptions
    );

    // 3. Get adapter files if needed
    const adapterFiles =
      exportOptions.includeAdapters !== false
        ? this.adapterExportManager.getAdapterFiles(chainType)
        : {};

    // 4. Update package.json using PackageManager
    const originalPackageJson = templateFiles['package.json'];
    if (originalPackageJson) {
      templateFiles['package.json'] = this.packageManager.updatePackageJson(
        originalPackageJson,
        formConfig,
        chainType,
        functionId,
        exportOptions
      );
    }

    // 5. Build the complete export file set
    const projectFiles = {
      ...templateFiles,
      'src/components/GeneratedForm.tsx': formComponentCode,
      ...adapterFiles,
    };

    // 6. Create ZIP file
    const zipBlob = await this.createZipFile(projectFiles);

    // 7. Generate suggested filename
    const fileName = this.generateFileName(formConfig, functionId);

    // 8. Return the export result with dependencies from PackageManager
    return {
      zipBlob,
      fileName,
      dependencies: this.packageManager.getDependencies(formConfig, chainType),
    };
  }

  /**
   * Create a ZIP file from the project files
   *
   * @param files Map of file paths to content
   * @returns A Blob containing the ZIP file
   */
  private async createZipFile(files: Record<string, string>): Promise<Blob> {
    // In a real implementation, this would use JSZip or similar library
    // For now, we'll return a placeholder
    console.log('Creating ZIP file with:', Object.keys(files).length, 'files');

    // Placeholder return - in a real implementation,
    // this would create an actual ZIP file with JSZip
    return new Blob(['ZIP file placeholder'], { type: 'application/zip' });
  }

  /**
   * Generate a suggested filename for the exported project
   *
   * @param formConfig Form configuration
   * @param functionId Function ID
   * @returns A suitable filename for the exported project
   */
  private generateFileName(formConfig: BuilderFormConfig, functionId: string): string {
    // Use function ID as the base name
    const baseName = functionId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${baseName}-form.zip`;
  }
}
