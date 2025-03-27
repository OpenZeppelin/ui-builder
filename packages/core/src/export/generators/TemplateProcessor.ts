/**
 * TemplateProcessor class responsible for processing code templates
 * with various placeholder formats and applying post-processing steps.
 */
export class TemplateProcessor {
  private templates: Record<string, string> | null = null;
  private initializing: Promise<void> | null = null;

  constructor(private templateFiles: Record<string, () => Promise<string>>) {}

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
   * Load templates from the provided template files
   */
  private async loadTemplates(): Promise<void> {
    // Map of template name to content
    const templates: Record<string, string> = {};

    // Process all discovered template files
    for (const path in this.templateFiles) {
      // Extract the template name from the path (e.g., "../codeTemplates/form-component.template.tsx" -> "form-component")
      const match = path.match(/\/codeTemplates\/([^.]+)\.template\.tsx$/);
      if (match) {
        const templateName = match[1];
        // Load the template content asynchronously
        templates[templateName] = await this.templateFiles[path]();
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
  public async processTemplate<T extends Record<string, unknown>>(
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

    return processedTemplate;
  }

  /**
   * Apply common post-processing steps to template output
   *
   * @param processedTemplate The template that has been processed with parameters
   * @param options Additional options for specific post-processing
   * @returns The post-processed template
   */
  public applyCommonPostProcessing(
    processedTemplate: string,
    options?: {
      adapterClassName?: string;
      formConfigJSON?: string;
    }
  ): string {
    // Remove template-specific comments using delimiters
    processedTemplate = processedTemplate.replace(
      /\/\*------------TEMPLATE COMMENT START------------\*\/[\s\S]*?\/\*------------TEMPLATE COMMENT END------------\*\//g,
      ''
    );

    // Remove all @ts-expect-error comments - they're only needed during template development
    processedTemplate = processedTemplate.replace(/\/\/\s*@ts-expect-error.*\n/g, '');

    // If adapter class name is provided, perform adapter-specific replacements
    if (options?.adapterClassName) {
      // Replace adapter placeholder with the actual adapter class name everywhere
      processedTemplate = processedTemplate.replace(
        /AdapterPlaceholder/g,
        options.adapterClassName
      );

      // Fix any possible malformed imports caused by comment-style placeholders
      processedTemplate = processedTemplate.replace(
        /import\s*\{\s*\{\/\*\*\/\}\s*\}\s*from/g,
        `import { ${options.adapterClassName} } from`
      );
    }

    // If form schema JSON is provided, inject it
    if (options?.formConfigJSON) {
      // Special case handling for form schema injection
      processedTemplate = processedTemplate.replace(
        /const formSchema: RenderFormSchema = \{\};/g,
        `const formSchema: RenderFormSchema = ${options.formConfigJSON};`
      );
    }

    return processedTemplate;
  }
}
