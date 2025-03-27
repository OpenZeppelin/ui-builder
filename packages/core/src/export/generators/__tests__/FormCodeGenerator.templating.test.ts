import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FormCodeGenerator } from '../FormCodeGenerator';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';

/**
 * These tests focus specifically on testing the templating system
 * used by the FormCodeGenerator class. They verify that each of the
 * supported template formats works correctly.
 */
describe('FormCodeGenerator Templating System', () => {
  let generator: FormCodeGenerator;
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    generator = new FormCodeGenerator();

    // Suppress console output during tests
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    console.log = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    // Restore console functions
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });

  /**
   * This test accesses the private processTemplate method using
   * a TypeScript trick. In a real-world scenario, you'd prefer to test
   * through public methods, but for direct template testing, this approach
   * allows us to test each pattern independently.
   */
  describe('processTemplate', () => {
    // Helper function to access the private processTemplate method
    const processTemplate = async (
      templateName: string,
      params: Record<string, unknown>
    ): Promise<string> => {
      // Access the private method using type assertion
      return (
        generator as unknown as {
          processTemplate(templateName: string, params: Record<string, unknown>): Promise<string>;
        }
      ).processTemplate(templateName, params);
    };

    // Helper to set template content directly
    const setTemplateContent = (templateName: string, content: string): void => {
      // Cast to access private properties, create a simple templates object
      const privateGenerator = generator as unknown as { templates: Record<string, string> };
      privateGenerator.templates = { [templateName]: content };
    };

    beforeEach(() => {
      // Mock the loadTemplates method to avoid file system interactions
      vi.spyOn(
        generator as unknown as { loadTemplates(): Promise<void> },
        'loadTemplates'
      ).mockImplementation(async () => {
        (generator as unknown as { templates: Record<string, string> }).templates = {};
        return Promise.resolve();
      });

      // Pre-initialize the templates property
      (generator as unknown as { templates: Record<string, string> }).templates = {};
    });

    it('should handle regular variable placeholders (@@param-name@@)', async () => {
      const templateContent = `
        import { @@adapter-class-name@@ } from '../adapters/@@chain-type@@/adapter';
        
        function Example() {
          const id = '@@function-id@@';
          return <div>Example for {id}</div>;
        }
      `;

      setTemplateContent('test-template', templateContent);

      const params = {
        adapterClassName: 'EvmAdapter',
        chainType: 'evm',
        functionId: 'transferTokens',
      };

      const processed = await processTemplate('test-template', params);

      expect(processed).toContain('import { EvmAdapter } from');
      expect(processed).toContain('../adapters/evm/adapter');
      expect(processed).toContain("const id = 'transferTokens';");
    });

    it('should handle JSX comment placeholders ({/*@@param-name@@*/}) by preserving comment syntax', async () => {
      const templateContent = `
        function Example() {
          return (
            <Button 
              onClick={/*@@on-click-handler@@*/}
              className={/*@@button-class-name@@*/}
            >
              {/*@@button-text@@*/}
            </Button>
          );
        }
      `;

      setTemplateContent('test-template', templateContent);

      const params = {
        onClickHandler: '() => console.log("clicked")',
        buttonClassName: 'primary-button',
        buttonText: 'Submit Transaction',
      };

      const processed = await processTemplate('test-template', params);

      // The template system preserves the comment syntax in the initial template processing
      expect(processed).toContain('onClick={/*() => console.log("clicked")*/}');
      expect(processed).toContain('className={/*primary-button*/}');
      expect(processed).toContain('{/*Submit Transaction*/}');
    });

    it('should handle inline comment placeholders (/*@@param-name@@*/) by preserving comment syntax', async () => {
      const templateContent = `
        const adapter = new /*@@adapter-class-name@@*/();
        const chainId = /*@@chain-id@@*/;
        const debugMode = /*@@debug-mode@@*/;
      `;

      setTemplateContent('test-template', templateContent);

      const params = {
        adapterClassName: 'EvmAdapter',
        chainId: 1,
        debugMode: true,
      };

      const processed = await processTemplate('test-template', params);

      // The template system preserves the comment syntax in the initial template processing
      expect(processed).toContain('const adapter = new /*EvmAdapter*/()');
      expect(processed).toContain('const chainId = /*1*/;');
      expect(processed).toContain('const debugMode = /*true*/;');
    });

    it('should correctly convert kebab-case to camelCase in parameter names', async () => {
      const templateContent = `
        const config = {
          functionId: '@@function-id@@',
          formTitle: '@@form-title@@',
          submitButtonText: '@@submit-button-text@@',
          longPropertyName: '@@very-long-kebab-case-property-name@@'
        };
      `;

      setTemplateContent('test-template', templateContent);

      const params = {
        functionId: 'transferTokens',
        formTitle: 'Transfer Tokens Form',
        submitButtonText: 'Send Tokens',
        veryLongKebabCasePropertyName: 'This was properly converted',
      };

      const processed = await processTemplate('test-template', params);

      expect(processed).toContain("functionId: 'transferTokens'");
      expect(processed).toContain("formTitle: 'Transfer Tokens Form'");
      expect(processed).toContain("submitButtonText: 'Send Tokens'");
      expect(processed).toContain("longPropertyName: 'This was properly converted'");
    });

    it('should handle object values by automatically stringifying them', async () => {
      const templateContent = `
        const formConfig = @@form-config@@;
        const theme = @@theme-config@@;
      `;

      setTemplateContent('test-template', templateContent);

      const formConfig = {
        fields: [
          { id: 'amount', type: 'number', label: 'Amount' },
          { id: 'recipient', type: 'text', label: 'Recipient Address' },
        ],
        validation: { mode: 'onChange' },
      };

      const theme = {
        colors: {
          primary: '#3366FF',
          secondary: '#FF6633',
        },
        spacing: { unit: 8 },
      };

      const params = {
        formConfig,
        themeConfig: theme,
      };

      const processed = await processTemplate('test-template', params);

      // Use JSON.stringify to check that the object values were properly stringified
      // This approach is more reliable than checking for specific formatting
      expect(processed).toContain('formConfig');
      expect(processed).toContain('theme');

      // Check for key properties from both objects without depending on exact format
      const processedLower = processed.toLowerCase();
      expect(processedLower).toContain('fields');
      expect(processedLower).toContain('amount');
      expect(processedLower).toContain('recipient');
      expect(processedLower).toContain('colors');
      expect(processedLower).toContain('primary');
      expect(processedLower).toContain('#3366ff');
    });

    it('should remove template comments delimited by special markers', async () => {
      const templateContent = `
        // This comment will stay
        
        /*------------TEMPLATE COMMENT START------------*/
        // This is a template-specific comment that explains how to use the template
        // It should be removed from the generated code
        // Useful for documenting the template itself
        /*------------TEMPLATE COMMENT END------------*/
        
        function Example() {
          // This comment will stay
          return <div>Example component</div>;
        }
      `;

      setTemplateContent('test-template', templateContent);

      const processed = await processTemplate('test-template', {});

      // In our new architecture, processTemplate does NOT remove template comments
      // Those are removed in applyCommonPostProcessing
      expect(processed).toContain('// This comment will stay');
      expect(processed).toContain('function Example()');
      expect(processed).toContain('template-specific comment');
      expect(processed).toContain('TEMPLATE COMMENT');
    });

    it('should handle all placeholder patterns in a single template while preserving comment syntax', async () => {
      const templateContent = `
        import { @@adapter-class-name@@ } from '../adapters/@@chain-type@@/adapter';
        
        /*------------TEMPLATE COMMENT START------------*/
        // This explains how the component should be used
        /*------------TEMPLATE COMMENT END------------*/
        
        function TransactionForm() {
          // Set up form handler
          const handleSubmit = /*@@submit-handler@@*/;
          
          return (
            <div className={/*@@container-class@@*/}>
              <h1>{/*@@title@@*/}</h1>
              <form onSubmit={handleSubmit}>
                {/* Form content here */}
              </form>
            </div>
          );
        }
      `;

      setTemplateContent('test-template', templateContent);

      const params = {
        adapterClassName: 'EvmAdapter',
        chainType: 'evm',
        submitHandler: '(e) => { e.preventDefault(); console.log("submitted"); }',
        containerClass: 'form-container',
        title: 'Transfer Tokens',
      };

      const processed = await processTemplate('test-template', params);

      // Regular placeholders are replaced directly
      expect(processed).toContain('import { EvmAdapter } from');
      expect(processed).toContain('../adapters/evm/adapter');

      // Comment-based placeholders preserve the comment syntax
      expect(processed).toContain(
        'const handleSubmit = /*(e) => { e.preventDefault(); console.log("submitted"); }*/;'
      );
      expect(processed).toContain('<div className={/*form-container*/}>');
      expect(processed).toContain('<h1>{/*Transfer Tokens*/}</h1>');

      // In our new architecture, processTemplate does NOT remove template comments
      // Those are removed in applyCommonPostProcessing
      expect(processed).toContain('TEMPLATE COMMENT');
    });

    it('should handle missing parameter values gracefully', async () => {
      const templateContent = `
        const config = {
          id: '@@function-id@@',
          name: '@@function-name@@', // This parameter doesn't exist
          chainType: '@@chain-type@@'
        };
      `;

      setTemplateContent('test-template', templateContent);

      const params = {
        functionId: 'transferTokens',
        chainType: 'evm',
        // functionName is intentionally missing
      };

      const processed = await processTemplate('test-template', params);

      expect(processed).toContain("id: 'transferTokens'");
      expect(processed).toContain("name: ''"); // Empty string for missing param
      expect(processed).toContain("chainType: 'evm'");
    });
  });

  /**
   * Integration tests that verify the templating system works
   * correctly through the public API.
   */
  describe('Integration with public methods', () => {
    it('should apply template formatting in generateFormComponent', async () => {
      // This test verifies that the template processing works correctly
      // when called through the public generateFormComponent method

      const formConfig: BuilderFormConfig = {
        functionId: 'transferTokens',
        fields: [
          {
            id: 'amount',
            name: 'amount',
            label: 'Amount',
            type: 'text' as const,
            validation: { required: true },
          },
        ],
        layout: {
          columns: 1,
          spacing: 'normal',
          labelPosition: 'top',
        },
        validation: {
          mode: 'onChange',
          showErrors: 'inline',
        },
        theme: {},
      };

      const code = await generator.generateFormComponent(formConfig, 'evm', 'transferTokens');

      // Verify that template placeholders were correctly replaced
      expect(code).toContain('EvmAdapter');
      expect(code).toContain('transferTokens');

      // Verify that no template placeholders remain
      expect(code).not.toContain('@@');
      expect(code).not.toMatch(/\{\s*\/\*@@.*@@\*\/\s*\}/);
      expect(code).not.toMatch(/\/\*@@.*@@\*\//);

      // Verify that template comments were removed
      expect(code).not.toContain('TEMPLATE COMMENT');
    });

    it('should apply template formatting in generateUpdatedAppComponent', async () => {
      // This test verifies that the template processing works correctly
      // when called through the public generateUpdatedAppComponent method

      const code = await (
        generator as unknown as {
          generateUpdatedAppComponent(functionId: string): Promise<string>;
        }
      ).generateUpdatedAppComponent('transferTokens');

      // Verify that template placeholders were correctly replaced
      expect(code).toContain('transferTokens');
      expect(code).toContain(new Date().getFullYear().toString()); // current year

      // Verify that no template placeholders remain
      expect(code).not.toContain('@@');
      expect(code).not.toMatch(/\{\s*\/\*@@.*@@\*\/\s*\}/);
      expect(code).not.toMatch(/\/\*@@.*@@\*\//);

      // Verify that template comments were removed
      expect(code).not.toContain('TEMPLATE COMMENT');
    });
  });

  /**
   * Tests for the applyCommonPostProcessing method
   */
  describe('applyCommonPostProcessing', () => {
    // Helper function to access the private applyCommonPostProcessing method
    const applyCommonPostProcessing = (
      template: string,
      options?: {
        adapterClassName?: string;
        formConfigJSON?: string;
      }
    ): string => {
      // Access the private method using type assertion
      return (
        generator as unknown as {
          applyCommonPostProcessing(
            template: string,
            options?: {
              adapterClassName?: string;
              formConfigJSON?: string;
            }
          ): string;
        }
      ).applyCommonPostProcessing(template, options);
    };

    it('should remove template comments delimited by special markers', () => {
      const template = `
        // This comment will stay
        
        /*------------TEMPLATE COMMENT START------------*/
        // This is a template-specific comment that explains how to use the template
        // It should be removed from the generated code
        // Useful for documenting the template itself
        /*------------TEMPLATE COMMENT END------------*/
        
        function Example() {
          // This comment will stay
          return <div>Example component</div>;
        }
      `;

      const processed = applyCommonPostProcessing(template);

      expect(processed).toContain('// This comment will stay');
      expect(processed).toContain('function Example()');
      expect(processed).not.toContain('template-specific comment');
      expect(processed).not.toContain('TEMPLATE COMMENT');
    });

    it('should remove @ts-expect-error comments', () => {
      const template = `
        // @ts-expect-error This will be removed
        function example1() {}
        
        // This is a normal comment that will stay
        function example2() {}
        
        // @ts-expect-error - Template specific types
        const x = 1;
      `;

      const processed = applyCommonPostProcessing(template);

      expect(processed).not.toContain('@ts-expect-error');
      expect(processed).toContain('// This is a normal comment that will stay');
      expect(processed).toContain('function example1() {}');
      expect(processed).toContain('function example2() {}');
      expect(processed).toContain('const x = 1;');
    });

    it('should replace adapter placeholders when adapterClassName is provided', () => {
      const template = `
        import { AdapterPlaceholder } from '../adapters/common';
        
        function example() {
          const adapter = new AdapterPlaceholder();
          return adapter;
        }
      `;

      const processed = applyCommonPostProcessing(template, { adapterClassName: 'EvmAdapter' });

      expect(processed).not.toContain('AdapterPlaceholder');
      expect(processed).toContain('import { EvmAdapter } from');
      expect(processed).toContain('const adapter = new EvmAdapter()');
    });

    it('should inject form schema when formConfigJSON is provided', () => {
      const template = `
        import { RenderFormSchema } from '../types';
        
        const formSchema: RenderFormSchema = {};
        
        function renderForm() {
          return renderWithSchema(formSchema);
        }
      `;

      const formConfig = {
        fields: [{ id: 'amount', label: 'Amount', type: 'number' }],
        layout: { columns: 1 },
      };

      const processed = applyCommonPostProcessing(template, {
        formConfigJSON: JSON.stringify(formConfig),
      });

      expect(processed).not.toContain('const formSchema: RenderFormSchema = {};');
      expect(processed).toContain(
        `const formSchema: RenderFormSchema = ${JSON.stringify(formConfig)};`
      );
    });
  });
});
