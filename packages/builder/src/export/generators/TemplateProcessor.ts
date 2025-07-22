/**
 * TemplateProcessor class responsible for processing code templates
 * with various placeholder formats and applying post-processing steps.
 */
import type { Options, Plugin } from 'prettier';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import * as typescriptPlugin from 'prettier/plugins/typescript';
import * as prettierStandalone from 'prettier/standalone';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

export class TemplateProcessor {
  private templates: Record<string, string> | null = null;
  private initializing: Promise<void> | null = null;

  constructor(
    private templateFiles: Record<string, string> | Record<string, () => Promise<string>>
  ) {}

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
        // Check if it's a function (lazy loaded) or string (eager loaded)
        const fileContent = this.templateFiles[path];
        if (typeof fileContent === 'function') {
          // Load the template content asynchronously (lazy loaded)
          templates[templateName] = await fileContent();
        } else {
          // Use the content directly (eager loaded)
          templates[templateName] = fileContent;
        }
      }
    }

    // If no templates were found, log a warning
    if (Object.keys(templates).length === 0) {
      logger.warn('TemplateProcessor', 'No template files found in the codeTemplates directory');
    } else {
      logger.info(
        'TemplateProcessor',
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

        // For objects, stringify them (without pretty-printing since Prettier will handle it)
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
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
          return JSON.stringify(value);
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
          return JSON.stringify(value);
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
  public async applyCommonPostProcessing(
    processedTemplate: string,
    options?: {
      networkConfigImportName?: string;
      adapterClassName?: string;
      adapterPackageName?: string;
      formConfigJSON?: string;
      contractSchemaJSON?: string;
      executionConfigJSON?: string;
    }
  ): Promise<string> {
    // Process the template in a way that preserves intended spacing

    // Step 1: Handle template comments at the start of a line, including the newline after them
    processedTemplate = processedTemplate.replace(
      /^[ \t]*\/\*------------TEMPLATE COMMENT START------------\*\/[\s\S]*?\/\*------------TEMPLATE COMMENT END------------\*\/\r?\n/gm,
      ''
    );

    // Step 2: Handle template comments in the middle of a line
    processedTemplate = processedTemplate.replace(
      /\/\*------------TEMPLATE COMMENT START------------\*\/[\s\S]*?\/\*------------TEMPLATE COMMENT END------------\*\//g,
      ''
    );

    // Remove all @ts-expect-error comments - they're only needed during template development
    processedTemplate = processedTemplate.replace(/\/\/\s*@ts-expect-error.*\n/g, '');

    if (options?.networkConfigImportName) {
      processedTemplate = processedTemplate.replace(
        /NetworkConfigPlaceholder/g,
        options.networkConfigImportName
      );

      // Fix any possible malformed imports caused by comment-style placeholders
      processedTemplate = processedTemplate.replace(
        /import\s*\{\s*\{\/\*\*\/\}\s*\}\s*from/g,
        `import { ${options.networkConfigImportName} } from`
      );
    }

    // Replace adapter class name placeholder
    if (options?.adapterClassName) {
      processedTemplate = processedTemplate.replace(
        /AdapterPlaceholder/g, // Find placeholder class name
        options.adapterClassName
      );

      // Fix any possible malformed imports caused by comment-style placeholders
      processedTemplate = processedTemplate.replace(
        /import\s*\{\s*\{\/\*\*\/\}\s*\}\s*from/g,
        `import { ${options.adapterClassName} } from`
      );
    }

    // If form schema JSON is provided, inject it with proper formatting using Prettier
    if (options?.formConfigJSON) {
      try {
        // We can inject the JSON directly without parsing and re-stringifying
        // Prettier will format it properly at the end
        processedTemplate = processedTemplate.replace(
          /const formSchema: RenderFormSchema = \{\};/g,
          `const formSchema: RenderFormSchema = ${options.formConfigJSON};`
        );
      } catch (error) {
        logger.error('TemplateProcessor', 'Failed to inject form schema:', error);
        throw error;
      }
    }

    // Inject ContractSchema JSON if provided
    if (options?.contractSchemaJSON) {
      try {
        processedTemplate = processedTemplate.replace(
          // Assume a similar placeholder variable assignment
          /const contractSchema: ContractSchema = \{\}; \/\*@@CONTRACT_SCHEMA_JSON@@\*\//g,
          `const contractSchema: ContractSchema = ${options.contractSchemaJSON};`
        );
      } catch (error) {
        logger.error('TemplateProcessor', 'Failed to inject contract schema:', error);
        throw error;
      }
    }

    // Inject execution config JSON if provided
    if (options?.executionConfigJSON) {
      try {
        const regex =
          /const executionConfig: ExecutionConfig \| undefined = undefined; \/\*@@EXECUTION_CONFIG_JSON@@\*\//g;
        const replacement = `const executionConfig: ExecutionConfig | undefined = ${options.executionConfigJSON};`;
        processedTemplate = processedTemplate.replace(regex, replacement);
      } catch (error) {
        logger.error('TemplateProcessor', 'Failed to inject execution config:', error);
        throw error;
      }
    }

    return processedTemplate;
  }

  /**
   * Format the final code using Prettier
   *
   * @param code The code to format
   * @param parser The parser to use (defaults to 'typescript')
   * @returns The formatted code
   */
  public async formatFinalCode(code: string, parser: string = 'typescript'): Promise<string> {
    try {
      // Configure Prettier for TypeScript formatting
      const prettierConfig: Options = {
        parser,
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        printWidth: 100,
        trailingComma: 'es5',
        arrowParens: 'always',
        bracketSpacing: true,
        quoteProps: 'as-needed', // Ensures object keys aren't quoted unless necessary
      };

      // Add plugins to the configuration
      const config: Options & { plugins: Plugin[] } = {
        ...prettierConfig,
        plugins: [estreePlugin.default, typescriptPlugin.default, babelPlugin.default],
      };

      // Format the entire code file
      return await prettierStandalone.format(code, config);
    } catch (error) {
      logger.warn(
        'TemplateProcessor',
        `Error formatting code with Prettier: ${String(error)}. Returning unformatted code.`
      );
      // Return the original unformatted code as a fallback
      return code;
    }
  }

  /**
   * Format JSON using Prettier
   *
   * @param jsonString The JSON string to format
   * @returns The formatted JSON string
   */
  public async formatJson(jsonString: string): Promise<string> {
    try {
      // Use the 'json-stringify' parser, which relies on the estree plugin
      return await this.formatCodeWithPrettier(jsonString, 'json-stringify', {
        printWidth: 80,
      });
    } catch (error) {
      logger.warn(
        'TemplateProcessor',
        `Error formatting JSON: ${String(error)}. Returning unformatted JSON.`
      );
      return jsonString;
    }
  }

  /**
   * Internal Prettier formatting function
   */
  private async formatCodeWithPrettier(
    code: string,
    parser: string,
    options?: Options
  ): Promise<string> {
    const defaultOptions: Options = {
      parser: parser,
      // Ensure estree plugin is included (it handles json-stringify)
      plugins: [typescriptPlugin.default, estreePlugin.default, babelPlugin.default],
      // You can add more Prettier options here if needed
    };

    return prettierStandalone.format(code, { ...defaultOptions, ...options });
  }
}
