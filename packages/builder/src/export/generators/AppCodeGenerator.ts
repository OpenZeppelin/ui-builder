import { capitalize } from 'lodash';

import {
  Ecosystem,
  NetworkConfig,
  RenderFormSchema,
} from '@openzeppelin/contracts-ui-builder-types';
import type { ContractSchema } from '@openzeppelin/contracts-ui-builder-types';

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
  eager: true, // Load at build time to avoid runtime fetch issues in production
}) as Record<string, string>; // Changed from Record<string, () => Promise<string>> since eager returns strings directly

/**
 * AppCodeGenerator class responsible for generating React components
 * that use the shared renderer package.
 *
 * Current implementation:
 * - Generates the main.tsx file
 * - Generates the App.tsx file
 * - Generates the GeneratedForm.tsx file
 * - Uses a consistent import pattern that works in both dev and production
 * - Integrates with TemplateManager to generate complete projects
 */
export class AppCodeGenerator {
  private templateManager: TemplateManager;
  private templateProcessor: TemplateProcessor;

  constructor() {
    this.templateManager = new TemplateManager();
    this.templateProcessor = new TemplateProcessor(templateFiles);
  }

  /**
   * Generate a React component for an app that uses the shared renderer package.
   * Uses a consistent import path that works in both development and production
   * thanks to pnpm workspace resolution.
   *
   * This component is integrated into the export template structure by the
   * generateTemplateProject method, replacing the placeholder components.
   *
   * @param formConfig The form configuration from the builder
   * @param contractSchema The full contract schema
   * @param networkConfig The network configuration for the selected network
   * @param functionId The ID of the contract function
   * @returns Generated React component code as a string
   */
  async generateFormComponent(
    formConfig: BuilderFormConfig,
    contractSchema: ContractSchema,
    networkConfig: NetworkConfig,
    functionId: string
  ): Promise<string> {
    const ecosystem = networkConfig.ecosystem;
    const adapterClassName = this.getAdapterClassName(ecosystem);
    const adapterPackageName = adapterPackageMap[ecosystem];
    if (!adapterPackageName) {
      throw new Error(`No adapter package configured for ecosystem: ${ecosystem}`);
    }

    // Ensure the networkConfig has the required export name
    if (!networkConfig.exportConstName) {
      throw new Error(
        `NetworkConfig object for ${networkConfig.id} is missing the required 'exportConstName' property.`
      );
    }
    const networkConfigImportName = networkConfig.exportConstName;

    // Find the function details FIRST to use for defaults
    const functionDetails = contractSchema.functions.find((fn) => fn.id === functionId);
    if (!functionDetails) {
      // This should ideally be caught earlier, but good to have defense
      throw new Error(
        `Function ${functionId} not found in contract schema during component generation.`
      );
    }

    const executionConfig = formConfig.executionConfig;

    // Use FormSchemaFactory to transform BuilderFormConfig to RenderFormSchema
    const formTitle =
      formConfig.title !== undefined ? formConfig.title : functionDetails.displayName || functionId;
    const formDescription =
      formConfig.description !== undefined
        ? formConfig.description
        : functionDetails.description ||
          `Form for interacting with the ${functionDetails.displayName || functionId} function.`;

    const renderSchema = formSchemaFactory.builderConfigToRenderSchema(
      formConfig,
      formTitle,
      formDescription
    );
    this.validateRenderFormSchema(renderSchema, functionId);

    // Create parameters for the template
    const params: FormComponentTemplateParams = {
      adapterClassName,
      adapterPackageName,
      networkConfigImportName,
      functionId,
      formConfigJSON: JSON.stringify(renderSchema, null, 2),
      contractSchemaJSON: JSON.stringify(contractSchema, null, 2),
      executionConfigJSON: executionConfig ? JSON.stringify(executionConfig, null, 2) : 'undefined',
      includeDebugMode: false,
    };

    // Process the form component template
    let processedTemplate = await this.templateProcessor.processTemplate('form-component', params);

    // Apply common post-processing with form-specific options
    const postProcessParams: Partial<FormComponentTemplateParams> = {
      adapterClassName,
      adapterPackageName,
      networkConfigImportName,
      formConfigJSON: params.formConfigJSON,
      contractSchemaJSON: params.contractSchemaJSON,
      executionConfigJSON: params.executionConfigJSON,
    };
    processedTemplate = await this.templateProcessor.applyCommonPostProcessing(
      processedTemplate,
      postProcessParams
    );

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
    // Fields array must exist and be an array, but can be empty for functions without parameters
    if (!schema.fields || !Array.isArray(schema.fields)) {
      errors.push('Missing or invalid fields array');
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
   *
   * @param formConfig The form configuration from the builder
   * @param contractSchema The full contract schema
   * @param networkConfig The network configuration for the selected network
   * @param functionId The ID of the contract function
   * @param options Additional options for export customization
   * @returns A record of file paths to file contents for the complete project
   */
  async generateTemplateProject(
    formConfig: BuilderFormConfig,
    contractSchema: ContractSchema,
    networkConfig: NetworkConfig,
    functionId: string,
    options?: ExportOptions
  ): Promise<Record<string, string>> {
    // Derive ecosystem from networkConfig if needed elsewhere, or pass networkConfig down
    const ecosystem = networkConfig.ecosystem;
    const exportOptions = options || { ecosystem }; // Ensure options has ecosystem

    // Generate all necessary component code
    const mainTsxCode = await this.generateMainTsx(networkConfig);
    const appComponentCode = await this.generateAppComponent(ecosystem, functionId);
    const formComponentCode = await this.generateFormComponent(
      formConfig,
      contractSchema,
      networkConfig,
      functionId
    );

    const customFiles: Record<string, string> = {
      'src/main.tsx': mainTsxCode,
      'src/App.tsx': appComponentCode,
      'src/components/GeneratedForm.tsx': formComponentCode,
    };

    return await this.templateManager.createProject(
      'typescript-react-vite',
      customFiles,
      exportOptions
    );
  }

  /**
   * Generate the main.tsx file content.
   *
   * @param networkConfig The specific network configuration object
   * @returns The content of the generated main.tsx file
   */
  public async generateMainTsx(networkConfig: NetworkConfig): Promise<string> {
    const ecosystem = networkConfig.ecosystem;
    const adapterClassName = this.getAdapterClassName(ecosystem);
    const adapterPackageName = adapterPackageMap[ecosystem];
    const networkConfigImportName = networkConfig.exportConstName;

    if (!adapterPackageName || !networkConfigImportName) {
      throw new Error(`Adapter/Network details missing for ecosystem: ${ecosystem}`);
    }

    // Define parameters for the main template
    const params = {
      adapterClassName,
      adapterPackageName,
      networkConfigImportName,
    };

    // Process the main template
    let processedTemplate = await this.templateProcessor.processTemplate('main', params);

    // Apply common post-processing
    processedTemplate = await this.templateProcessor.applyCommonPostProcessing(processedTemplate, {
      adapterClassName,
      adapterPackageName,
      networkConfigImportName,
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
    return `${capitalize(ecosystem)}Adapter`;
  }
}
