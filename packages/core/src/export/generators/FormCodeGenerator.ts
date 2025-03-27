import { AdapterExportManager } from '../AdapterExportManager';
import { TemplateManager } from '../TemplateManager';

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
  private templates: Record<string, string> | null = null;
  private initializing: Promise<void> | null = null;

  constructor() {
    this.templateManager = new TemplateManager();
    this.adapterExportManager = new AdapterExportManager();
  }

  /**
   * Ensure templates are loaded
   */
  private async ensureTemplatesLoaded(): Promise<void> {
    // If already loaded, return immediately
    if (this.templates !== null) {
      return Promise.resolve();
    }

    // If already initializing, wait for that to complete
    if (this.initializing !== null) {
      return this.initializing;
    }

    // Start loading
    this.initializing = this.loadTemplates();
    await this.initializing;

    // Clear initializing promise
    this.initializing = null;
  }

  /**
   * Load templates from the codeTemplates directory
   */
  private async loadTemplates(): Promise<void> {
    // Map of template name to content
    const templates: Record<string, string> = {};

    // Process all discovered template files
    for (const path in templateFiles) {
      // Extract the template name from the path (e.g., "../codeTemplates/form-component.template.tsx" -> "form-component")
      const match = path.match(/\/codeTemplates\/([^.]+)\.template\.tsx$/);
      if (match) {
        const templateName = match[1];
        // Load the template content asynchronously
        templates[templateName] = await templateFiles[path]();
      }
    }

    // If no templates were found, log a warning
    if (Object.keys(templates).length === 0) {
      console.warn('No template files found in the codeTemplates directory');
    } else {
      console.log(
        `Loaded ${Object.keys(templates).length} templates: ${Object.keys(templates).join(', ')}`
      );
    }

    this.templates = templates;
  }

  /**
   * Process a template by replacing placeholders with actual values
   *
   * @param templateName The name of the template to process
   * @param params The parameters to inject into the template
   * @returns The processed template
   */
  private async processTemplate<T extends Record<string, unknown>>(
    templateName: string,
    params: T
  ): Promise<string> {
    await this.ensureTemplatesLoaded();

    const template = this.templates![templateName];

    if (!template) {
      throw new Error(
        `Template "${templateName}" not found. Please ensure the template file exists.`
      );
    }

    // Process the template with a single unified regex to handle all placeholders
    let processedTemplate = template;

    // First pattern: Regular @@param-name@@ replacements
    processedTemplate = processedTemplate.replace(
      /@@([a-zA-Z0-9-]+)@@/g,
      (_, paramName: string) => {
        // Convert param name from kebab-case to camelCase (adapter-class-name -> adapterClassName)
        const camelParamName = paramName.replace(/-([a-z])/g, (_: string, letter: string) =>
          letter.toUpperCase()
        );

        // Get the value safely
        const value = params[camelParamName];

        // For objects, stringify them
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value, null, 2);
        }
        // For other types, convert to string
        return String(value ?? '');
      }
    );

    // Second pattern: Handle comment-enclosed patterns like {/*@@param-name@@*/}
    processedTemplate = processedTemplate.replace(
      /\{\/\*@@([a-zA-Z0-9-]+)@@\*\/\}/g,
      (_, paramName: string) => {
        const camelParamName = paramName.replace(/-([a-z])/g, (_: string, letter: string) =>
          letter.toUpperCase()
        );
        const value = params[camelParamName];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value, null, 2);
        }
        return String(value ?? '');
      }
    );

    // Third pattern: Handle inline comment patterns like /*@@param-name@@*/
    processedTemplate = processedTemplate.replace(
      /\/\*@@([a-zA-Z0-9-]+)@@\*\//g,
      (_, paramName: string) => {
        const camelParamName = paramName.replace(/-([a-z])/g, (_: string, letter: string) =>
          letter.toUpperCase()
        );
        const value = params[camelParamName];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value, null, 2);
        }
        return String(value ?? '');
      }
    );

    // Then, remove template-specific comments using delimiters
    return processedTemplate.replace(
      /\/\*------------TEMPLATE COMMENT START------------\*\/[\s\S]*?\/\*------------TEMPLATE COMMENT END------------\*\//g,
      ''
    );
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
    let processedTemplate = await this.processTemplate('form-component', params);

    // Replace adapter placeholder with the actual adapter class name everywhere
    processedTemplate = processedTemplate.replace(/AdapterPlaceholder/g, adapterClassName);

    // Fix any possible malformed imports caused by comment-style placeholders
    processedTemplate = processedTemplate.replace(
      /import\s*\{\s*\{\/\*\*\/\}\s*\}\s*from/g,
      `import { ${adapterClassName} } from`
    );

    // Special case handling for form schema injection
    processedTemplate = processedTemplate.replace(
      /const formSchema: RenderFormSchema = \{\};/g,
      `const formSchema: RenderFormSchema = ${params.formConfigJSON as string};`
    );

    // Remove all @ts-expect-error comments - they're only needed during template development
    processedTemplate = processedTemplate.replace(/\/\/\s*@ts-expect-error.*\n/g, '');

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
    let processedTemplate = await this.processTemplate('app-component', params);

    // Remove all @ts-expect-error comments from this template too
    processedTemplate = processedTemplate.replace(/\/\/\s*@ts-expect-error.*\n/g, '');

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
