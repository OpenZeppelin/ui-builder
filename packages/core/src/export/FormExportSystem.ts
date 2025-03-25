/**
 * FormExportSystem
 *
 * This class coordinates the form export process by integrating the
 * TemplateManager, FormCodeGenerator, and AdapterExportManager components.
 */

import { FormCodeGenerator } from './generators/FormCodeGenerator';
import { AdapterExportManager } from './AdapterExportManager';
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

  /**
   * Creates a new FormExportSystem
   */
  constructor() {
    this.templateManager = new TemplateManager();
    this.formCodeGenerator = new FormCodeGenerator();
    this.adapterExportManager = new AdapterExportManager();
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

    // 4. Build the complete export file set
    const projectFiles = {
      ...templateFiles,
      'src/components/GeneratedForm.tsx': formComponentCode,
      ...adapterFiles,
    };

    // 5. Create ZIP file
    const zipBlob = await this.createZipFile(projectFiles);

    // 6. Generate suggested filename
    const fileName = this.generateFileName(formConfig, functionId);

    // 7. Return the export result
    return {
      zipBlob,
      fileName,
      dependencies: this.getDependencies(chainType),
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

  /**
   * Get dependency information for the exported form
   *
   * @param chainType Blockchain type
   * @returns A map of dependency names to versions
   *
   * TODO: This is a temporary solution. In the future, this should be handled by a dedicated
   * PackageManager component that can determine dependencies based on features used in the form
   * and manage versioning more effectively.
   */
  private getDependencies(chainType: ChainType): Record<string, string> {
    // Core dependencies required for all forms
    const dependencies: Record<string, string> = {
      '@openzeppelin/transaction-form-builder-form-renderer': '^1.0.0',
      'react-hook-form': '^7.54.2',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    };

    // Chain-specific dependencies
    switch (chainType) {
      case 'evm':
        dependencies['ethers'] = '^6.7.0';
        break;
      case 'solana':
        dependencies['@solana/web3.js'] = '^1.78.0';
        break;
      case 'stellar':
        dependencies['stellar-sdk'] = '^10.0.1';
        break;
      case 'midnight':
        dependencies['@midnight/sdk'] = '^1.0.0';
        break;
    }

    return dependencies;
  }
}
