import { Ecosystem } from '@openzeppelin/transaction-form-types';
import type { ContractSchema, RenderFormSchema } from '@openzeppelin/transaction-form-types';

import { adapterPackageMap } from '../../core/ecosystemManager';
import { formSchemaFactory } from '../../core/factories/FormSchemaFactory';
import type { ExportOptions } from '../../core/types/ExportTypes';
import type { BuilderFormConfig } from '../../core/types/FormTypes';
import { TemplateManager } from '../TemplateManager';
import type {
  AppComponentTemplateParams,
  FormComponentTemplateParams,
} from '../codeTemplates/TemplateTypes';

import { TemplateProcessor } from './TemplateProcessor';

// Use the glob pattern to discover template files
const templateFiles = import.meta.glob<string>('../codeTemplates/*.template.tsx', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

/**
 * FormCodeGenerator class responsible for generating React components
 * that use the shared form-renderer package.
 *
 * Current implementation:
 * - Generates only the form component code
 * - Uses a consistent import pattern that works in both dev and production
 * - Integrates with TemplateManager to generate complete projects
 */
export class FormCodeGenerator {
  private templateManager: TemplateManager;
  private templateProcessor: TemplateProcessor;

  constructor() {
    this.templateManager = new TemplateManager();
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
   * @param contractSchema The full contract schema
   * @param ecosystem The selected ecosystem
   * @param functionId The ID of the contract function
   * @returns Generated React component code as a string
   */
  async generateFormComponent(
    formConfig: BuilderFormConfig,
    contractSchema: ContractSchema,
    ecosystem: Ecosystem,
    functionId: string
  ): Promise<string> {
    const adapterClassName = this.getAdapterClassName(ecosystem);
    const adapterPackageName = adapterPackageMap[ecosystem];
    if (!adapterPackageName) {
      throw new Error(`No adapter package configured for ecosystem: ${ecosystem}`);
    }
    const executionConfig = formConfig.executionConfig;

    // Use FormSchemaFactory to transform BuilderFormConfig to RenderFormSchema
    // This ensures consistency with the preview in the form builder
    const formTitle = formConfig.title !== undefined ? formConfig.title : functionId;
    const formDescription =
      formConfig.description !== undefined
        ? formConfig.description
        : `Form for interacting with the ${functionId} function.`;

    const renderSchema = formSchemaFactory.builderConfigToRenderSchema(
      formConfig,
      formTitle,
      formDescription
    );

    // Validate the schema to ensure it has all required properties
    this.validateRenderFormSchema(renderSchema, functionId);

    // Create parameters for the template
    const params: FormComponentTemplateParams = {
      adapterClassName,
      adapterPackageName,
      ecosystem,
      functionId,
      formConfigJSON: JSON.stringify(renderSchema, null, 2), // Schema for rendering
      contractSchemaJSON: JSON.stringify(contractSchema, null, 2), // Add full contract schema
      allFieldsConfigJSON: JSON.stringify(formConfig.fields, null, 2),
      executionConfigJSON: executionConfig ? JSON.stringify(executionConfig, null, 2) : 'undefined',
      includeDebugMode: false, // Or make this configurable via options
    };

    // Process the form component template
    let processedTemplate = await this.templateProcessor.processTemplate('form-component', params);

    // Apply common post-processing with form-specific options
    processedTemplate = await this.templateProcessor.applyCommonPostProcessing(processedTemplate, {
      adapterClassName,
      adapterPackageName,
      formConfigJSON: params.formConfigJSON,
      contractSchemaJSON: params.contractSchemaJSON,
      executionConfigJSON: params.executionConfigJSON,
      allFieldsConfigJSON: params.allFieldsConfigJSON,
    });

    // Format the entire code with Prettier
    processedTemplate = await this.templateProcessor.formatFinalCode(processedTemplate);

    return processedTemplate;
  }

  /**
   * Validate that the RenderFormSchema has all required properties
   *
   * @param schema The schema to validate
   * @param functionId The function ID for error messaging
   * @throws Error if the schema is missing required properties
   */
  private validateRenderFormSchema(schema: RenderFormSchema, functionId: string): void {
    const errors: string[] = [];

    // Check required properties
    if (!schema.id) {
      errors.push('Missing id property');
    }
    if (!schema.title) {
      errors.push('Missing title property');
    }
    if (!schema.submitButton) {
      errors.push('Missing submitButton property');
    } else {
      // Check submitButton properties
      if (!schema.submitButton.text) {
        errors.push('Missing submitButton.text property');
      }
      if (!schema.submitButton.loadingText) {
        errors.push('Missing submitButton.loadingText property');
      }
    }
    if (!schema.fields || !Array.isArray(schema.fields) || schema.fields.length === 0) {
      errors.push('Missing or empty fields array');
    }

    // If there are any errors, throw an exception
    if (errors.length > 0) {
      throw new Error(
        `Invalid RenderFormSchema for function ${functionId}. The following issues were found:\n- ${errors.join('\n- ')}`
      );
    }
  }

  /**
   * Generate a complete React project by integrating with the template system.
   * Uses the typescript-react-vite template and replaces placeholder files with generated code.
   *
   * @param formConfig The form configuration from the builder
   * @param contractSchema The full contract schema
   * @param ecosystem The selected ecosystem
   * @param functionId The ID of the contract function
   * @param options Additional options for export customization
   * @returns A record of file paths to file contents for the complete project
   */
  async generateTemplateProject(
    formConfig: BuilderFormConfig,
    contractSchema: ContractSchema,
    ecosystem: Ecosystem,
    functionId: string,
    options: ExportOptions = { ecosystem }
  ): Promise<Record<string, string>> {
    // Generate all necessary component code
    const mainTsxCode = await this.generateMainTsx(ecosystem);
    const appComponentCode = await this.generateAppComponent(ecosystem, functionId);
    const formComponentCode = await this.generateFormComponent(
      formConfig,
      contractSchema,
      ecosystem,
      functionId
    );

    const customFiles: Record<string, string> = {
      'src/main.tsx': mainTsxCode,
      'src/App.tsx': appComponentCode,
      'src/components/GeneratedForm.tsx': formComponentCode,
    };

    return await this.templateManager.createProject('typescript-react-vite', customFiles, options);
  }

  /**
   * Generate the main.tsx file content.
   *
   * @param ecosystem The ecosystem to determine adapter details
   * @returns The content of the generated main.tsx file
   */
  public async generateMainTsx(ecosystem: Ecosystem): Promise<string> {
    const adapterClassName = this.getAdapterClassName(ecosystem);
    const adapterPackageName = adapterPackageMap[ecosystem];
    if (!adapterPackageName) {
      throw new Error(`No adapter package configured for ecosystem: ${ecosystem}`);
    }

    // Define parameters for the main template
    const params = {
      adapterClassName,
      adapterPackageName,
    };

    // Process the main template
    let processedTemplate = await this.templateProcessor.processTemplate('main', params);

    // Apply common post-processing
    processedTemplate = await this.templateProcessor.applyCommonPostProcessing(processedTemplate, {
      adapterClassName,
      adapterPackageName,
    });

    // Format the code
    processedTemplate = await this.templateProcessor.formatFinalCode(processedTemplate);

    return processedTemplate;
  }

  /**
   * Generate an App component that imports the GeneratedForm
   *
   * @param ecosystem The selected ecosystem
   * @param functionId The ID of the function this form is for (used in titles)
   * @returns The content of the updated App.tsx file
   */
  public async generateAppComponent(ecosystem: Ecosystem, functionId: string): Promise<string> {
    const adapterClassName = this.getAdapterClassName(ecosystem);
    const adapterPackageName = adapterPackageMap[ecosystem];
    if (!adapterPackageName) {
      throw new Error(`No adapter package configured for ecosystem: ${ecosystem}`);
    }

    // Create parameters for the template
    const params: AppComponentTemplateParams & Record<string, unknown> = {
      functionId,
      currentYear: new Date().getFullYear(),
      adapterClassName,
      adapterPackageName,
    };

    // Process the app component template
    let processedTemplate = await this.templateProcessor.processTemplate('app-component', params);

    // Apply common post-processing
    processedTemplate = await this.templateProcessor.applyCommonPostProcessing(processedTemplate, {
      adapterClassName,
      adapterPackageName,
    });

    // Format the entire code with Prettier
    processedTemplate = await this.templateProcessor.formatFinalCode(processedTemplate);

    return processedTemplate;
  }

  /**
   * Get the class name for a chain type's adapter.
   * Converts chain type to PascalCase (e.g., 'evm' -> 'EvmAdapter').
   */
  private getAdapterClassName(ecosystem: Ecosystem): string {
    return `${ecosystem.charAt(0).toUpperCase()}${ecosystem.slice(1)}Adapter`;
  }
}
