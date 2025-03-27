import { AdapterExportManager } from '../AdapterExportManager';
import { TemplateManager } from '../TemplateManager';

import { TemplateProcessor } from './TemplateProcessor';

import type { ChainType } from '../../core/types/ContractSchema';
import type { ExportOptions } from '../../core/types/ExportTypes';
import type { BuilderFormConfig } from '../../core/types/FormTypes';
// Import types for template parameters
import type {
  AppComponentTemplateParams,
  FormComponentTemplateParams,
} from '../codeTemplates/TemplateTypes';

// Use the glob pattern to discover template files
const templateFiles = import.meta.glob<string>('../codeTemplates/*.template.tsx', {
  query: '?raw',
  import: 'default',
});

/**
 * FormCodeGenerator class responsible for generating React components
 * that use the shared form-renderer package.
 *
 * Current implementation:
 * - Generates only the form component code
 * - Uses a consistent import pattern that works in both dev and production
 * - Integrates with TemplateManager to generate complete projects
 * - Integrates with AdapterExportManager to include required adapter files
 */
export class FormCodeGenerator {
  private templateManager: TemplateManager;
  private adapterExportManager: AdapterExportManager;
  private templateProcessor: TemplateProcessor;

  constructor() {
    this.templateManager = new TemplateManager();
    this.adapterExportManager = new AdapterExportManager();
    this.templateProcessor = new TemplateProcessor(templateFiles);
  }

  /**
   * Generate a React component for a form that uses the shared form-renderer package.
   * Uses a consistent import path that works in both development and production
   * thanks to pnpm workspace resolution.
   *
   * This component is integrated into the export template structure by the
   * generateTemplateProject method, replacing the placeholder components.
   *
   * @param formConfig The form configuration from the builder
   * @param chainType The selected blockchain type
   * @param functionId The ID of the contract function
   * @returns Generated React component code as a string
   */
  async generateFormComponent(
    formConfig: BuilderFormConfig,
    chainType: ChainType,
    functionId: string
  ): Promise<string> {
    const adapterClassName = this.getAdapterClassName(chainType);

    // Create parameters for the template
    const params: FormComponentTemplateParams = {
      adapterClassName,
      chainType,
      functionId,
      formConfigJSON: JSON.stringify(formConfig, null, 2),
      includeDebugMode: false,
    };

    // Process the form component template
    let processedTemplate = await this.templateProcessor.processTemplate('form-component', params);

    // Apply common post-processing with form-specific options
    processedTemplate = this.templateProcessor.applyCommonPostProcessing(processedTemplate, {
      adapterClassName,
      formConfigJSON: params.formConfigJSON as string,
    });

    return processedTemplate;
  }

  /**
   * Generate a complete React project by integrating with the template system.
   * Uses the typescript-react-vite template and replaces placeholder files with generated code.
   *
   * @param formConfig The form configuration from the builder
   * @param chainType The selected blockchain type
   * @param functionId The ID of the contract function
   * @param options Additional options for export customization
   * @returns A record of file paths to file contents for the complete project
   */
  async generateTemplateProject(
    formConfig: BuilderFormConfig,
    chainType: ChainType,
    functionId: string,
    options: ExportOptions = { chainType }
  ): Promise<Record<string, string>> {
    // Generate the form component code
    const formComponentCode = await this.generateFormComponent(formConfig, chainType, functionId);

    // Create a structure with the custom files to replace in the template
    const customFiles: Record<string, string> = {
      // Replace FormPlaceholder.tsx with our generated form component
      'src/components/GeneratedForm.tsx': formComponentCode,

      // We need to update App.tsx to import GeneratedForm instead of FormPlaceholder
      'src/App.tsx': await this.generateUpdatedAppComponent(functionId),
    };

    // Get adapter files if needed
    if (options.includeAdapters !== false) {
      const adapterFiles = await this.adapterExportManager.getAdapterFiles(chainType);
      Object.assign(customFiles, adapterFiles);
    }

    // Use the template manager to create a complete project
    return await this.templateManager.createProject('typescript-react-vite', customFiles, options);
  }

  /**
   * Generate an updated App component that imports the GeneratedForm instead of FormPlaceholder
   *
   * @param functionId The ID of the function this form is for (used in titles)
   * @returns The content of the updated App.tsx file
   */
  public async generateUpdatedAppComponent(functionId: string): Promise<string> {
    // Create parameters for the template
    const params: AppComponentTemplateParams & Record<string, unknown> = {
      functionId,
      currentYear: new Date().getFullYear(),
    };

    // Process the app component template
    let processedTemplate = await this.templateProcessor.processTemplate('app-component', params);

    // Apply common post-processing
    processedTemplate = this.templateProcessor.applyCommonPostProcessing(processedTemplate);

    return processedTemplate;
  }

  /**
   * Get the class name for a chain type's adapter.
   * Converts chain type to PascalCase (e.g., 'evm' -> 'EvmAdapter').
   */
  private getAdapterClassName(chainType: ChainType): string {
    return `${chainType.charAt(0).toUpperCase()}${chainType.slice(1)}Adapter`;
  }
}
