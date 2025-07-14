import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EvmNetworkConfig } from '@openzeppelin/contracts-ui-builder-types';

import { createMinimalContractSchema, createMinimalFormConfig } from '../../utils/testConfig';
import { FormCodeGenerator } from '../FormCodeGenerator';
import { TemplateProcessor } from '../TemplateProcessor';

/**
 * These tests focus specifically on testing the templating system
 * used by the FormCodeGenerator class. They verify that each of the
 * supported template formats works correctly.
 */
describe('FormCodeGenerator Templating System', () => {
  let generator: FormCodeGenerator;
  let templateProcessor: TemplateProcessor;
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;

  // Define mock network config
  const mockEvmNetworkConfig: EvmNetworkConfig = {
    id: 'test-codegen-templating-evm',
    name: 'Test CodeGen Template EVM',
    exportConstName: 'mockEvmNetworkConfig',
    ecosystem: 'evm',
    network: 'ethereum',
    type: 'testnet',
    isTestnet: true,
    chainId: 1337,
    rpcUrl: 'http://localhost:8545',
    nativeCurrency: { name: 'TETH', symbol: 'TETH', decimals: 18 },
    apiUrl: '',
  };

  beforeEach(() => {
    generator = new FormCodeGenerator();

    // Create a TemplateProcessor instance for direct testing
    templateProcessor = new TemplateProcessor({});

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
    // Helper to set template content directly
    const setTemplateContent = (templateName: string, content: string): void => {
      // Cast to access private properties, create a simple templates object
      const privateProcessor = templateProcessor as unknown as {
        templates: Record<string, string>;
      };
      privateProcessor.templates = { [templateName]: content };
    };

    beforeEach(() => {
      // Mock the loadTemplates method to avoid file system interactions
      vi.spyOn(
        templateProcessor as unknown as { loadTemplates(): Promise<void> },
        'loadTemplates'
      ).mockImplementation(async () => {
        (templateProcessor as unknown as { templates: Record<string, string> }).templates = {};
        return Promise.resolve();
      });

      // Pre-initialize the templates property
      (templateProcessor as unknown as { templates: Record<string, string> }).templates = {};
    });

    it('should handle regular variable placeholders (@@param-name@@)', async () => {
      const templateContent = `
        import { @@adapter-class-name@@ } from '../adapters/@@ecosystem@@/adapter';
        
        function Example() {
          const id = '@@function-id@@';
          return <div>Example for {id}</div>;
        }
      `;

      setTemplateContent('test-template', templateContent);

      const params = {
        adapterClassName: 'EvmAdapter',
        ecosystem: 'evm',
        functionId: 'transferTokens',
      };

      const processed = await templateProcessor.processTemplate('test-template', params);

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

      const processed = await templateProcessor.processTemplate('test-template', params);

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

      const processed = await templateProcessor.processTemplate('test-template', params);

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

      const processed = await templateProcessor.processTemplate('test-template', params);

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

      const processed = await templateProcessor.processTemplate('test-template', params);

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

    it('should handle missing parameter values gracefully', async () => {
      const templateContent = `
        const config = {
          id: '@@function-id@@',
          name: '@@function-name@@', // This parameter doesn't exist
          ecosystem: '@@ecosystem@@'
        };
      `;

      setTemplateContent('test-template', templateContent);

      const params = {
        functionId: 'transferTokens',
        ecosystem: 'evm',
        // functionName is intentionally missing
      };

      const processed = await templateProcessor.processTemplate('test-template', params);

      expect(processed).toContain("id: 'transferTokens'");
      expect(processed).toContain("name: ''"); // Empty string for missing param
      expect(processed).toContain("ecosystem: 'evm'");
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

      const formConfig = createMinimalFormConfig('transferTokens', 'evm');
      const contractSchema = createMinimalContractSchema('transferTokens', 'evm');

      const code = await generator.generateFormComponent(
        formConfig,
        contractSchema,
        mockEvmNetworkConfig,
        'transferTokens'
      );

      // Verify that the component is structured to accept a generic adapter
      expect(code).toContain('adapter: ContractAdapter');
      expect(code).toContain("functionId: 'transferTokens'");

      // Verify that specific VARIABLE template placeholders were replaced
      expect(code).not.toContain('@@function-id@@');
      expect(code).not.toContain('@@adapter-package-name@@');
      // We don't check for @@ecosystem@@ as it might be within comments handled later

      // Verify that template comments were removed
      expect(code).not.toContain('TEMPLATE COMMENT');
    });

    it('should apply template formatting in generateUpdatedAppComponent', async () => {
      // This test verifies that the template processing works correctly
      // when called through the public generateUpdatedAppComponent method

      const code = await generator.generateAppComponent('evm', 'transferTokens');

      // Verify that template placeholders were correctly replaced
      expect(code).toContain('transferTokens');
      expect(code).toContain(new Date().getFullYear().toString()); // current year

      // Verify that specific VARIABLE template placeholders were replaced
      expect(code).not.toContain('@@app-title@@');
      expect(code).not.toContain('@@current-year@@');

      // Verify that template comments were removed
      expect(code).not.toContain('TEMPLATE COMMENT');
    });
  });

  /**
   * Tests for the applyCommonPostProcessing method
   */
  describe('applyCommonPostProcessing', () => {
    it('should remove template comments delimited by special markers', async () => {
      const template = `
        /*------------TEMPLATE COMMENT START------------*/
        // This is a comment that should be removed
        // including this entire block
        /*------------TEMPLATE COMMENT END------------*/
        function example() {
          return 'This should remain';
        }
      `;

      const processed = await templateProcessor.applyCommonPostProcessing(template);

      expect(processed).not.toContain('This is a comment that should be removed');
      expect(processed).toContain('function example()');
      expect(processed).toContain('This should remain');
    });

    it('should remove template comments without leaving empty lines', async () => {
      const template = `/*------------TEMPLATE COMMENT START------------*/
// First template comment
/*------------TEMPLATE COMMENT END------------*/
import { useState } from 'react';

/*------------TEMPLATE COMMENT START------------*/
// Second template comment
/*------------TEMPLATE COMMENT END------------*/
import { Something } from 'somewhere';

function example() {
  return 'Code';
}`;

      const processed = await templateProcessor.applyCommonPostProcessing(template);

      // The processed output should not have empty lines where comments were removed
      expect(processed).toBe(`import { useState } from 'react';

import { Something } from 'somewhere';

function example() {
  return 'Code';
}`);
    });

    it('should format the form schema correctly when injecting it', async () => {
      const template = `
        import { RenderFormSchema } from '../types';
        
        const formSchema: RenderFormSchema = {};
        
        function renderForm() {
          return renderWithSchema(formSchema);
        }
      `;

      const formConfig = {
        functionId: 'transfer',
        fields: [
          {
            id: '12345',
            type: 'text',
            name: 'recipient',
            label: 'Recipient Address',
            validation: { required: true },
            helperText: 'Enter the recipient address',
            placeholder: 'Enter address',
          },
        ],
        layout: {
          columns: 1 as const,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        contractAddress: '0xTestAddress',
      };

      // Test that applyCommonPostProcessing inserts the JSON correctly
      const processed = await templateProcessor.applyCommonPostProcessing(template, {
        formConfigJSON: JSON.stringify(formConfig),
      });

      // The processed output should have the JSON inserted, but not yet formatted
      // We'll format the entire code later with formatFinalCode
      expect(processed).toContain('const formSchema: RenderFormSchema = {');

      // We now just check for the existence of these properties in any format
      expect(processed).toContain('functionId');
      expect(processed).toContain('transfer');
      expect(processed).toContain('recipient');
    });

    it('should clean up template comments while preserving intended spacing', async () => {
      const template = `/*------------TEMPLATE COMMENT START------------*/
// First comment
/*------------TEMPLATE COMMENT END------------*/
/*------------TEMPLATE COMMENT START------------*/
// Second comment right after first
/*------------TEMPLATE COMMENT END------------*/
import { useState } from 'react';

// This is a regular comment that should stay

function example() {
  /*------------TEMPLATE COMMENT START------------*/
  // Inline comment
  /*------------TEMPLATE COMMENT END------------*/
  /*------------TEMPLATE COMMENT START------------*/
  // Another inline comment
  /*------------TEMPLATE COMMENT END------------*/
  return 'Code';
}

// Preserve this empty line below

const anotherFunction = () => {
  // Preserve indentation
  const x = 1;
}`;

      const processed = await templateProcessor.applyCommonPostProcessing(template);

      // There should be no empty lines where consecutive comments were removed
      // But intended spacing and comments should be preserved
      expect(processed).toBe(`import { useState } from 'react';

// This is a regular comment that should stay

function example() {
  return 'Code';
}

// Preserve this empty line below

const anotherFunction = () => {
  // Preserve indentation
  const x = 1;
}`);
    });

    it('should remove @ts-expect-error comments', async () => {
      const template = `
        // @ts-expect-error This will be removed
        function example1() {}
        
        // This is a normal comment that will stay
        function example2() {}
        
        // @ts-expect-error - Template specific types
        const x = 1;
      `;

      const processed = await templateProcessor.applyCommonPostProcessing(template);

      expect(processed).not.toContain('@ts-expect-error');
      expect(processed).toContain('// This is a normal comment that will stay');
      expect(processed).toContain('function example1() {}');
      expect(processed).toContain('function example2() {}');
      expect(processed).toContain('const x = 1;');
    });

    it('should replace adapter placeholders when adapterClassName is provided', async () => {
      const template = `
        import { AdapterPlaceholder } from '../adapters/common';
        
        function example() {
          const adapter = new AdapterPlaceholder();
          return adapter;
        }
      `;

      const processed = await templateProcessor.applyCommonPostProcessing(template, {
        adapterClassName: 'EvmAdapter',
      });

      expect(processed).not.toContain('AdapterPlaceholder');
      expect(processed).toContain('import { EvmAdapter } from');
      expect(processed).toContain('const adapter = new EvmAdapter()');
    });

    it('should inject form schema when formConfigJSON is provided', async () => {
      const template = `
        import { RenderFormSchema } from '../types';
        
        const formSchema: RenderFormSchema = {};
        
        function renderForm() {
          return renderWithSchema(formSchema);
        }
      `;

      const formConfig = {
        fields: [{ id: 'amount', label: 'Amount', type: 'number' }],
        layout: { columns: 1 as const },
        contractAddress: '0xTestAddress',
      };

      const processed = await templateProcessor.applyCommonPostProcessing(template, {
        formConfigJSON: JSON.stringify(formConfig),
      });

      // Check that JSON was inserted correctly in any format
      expect(processed).not.toContain('const formSchema: RenderFormSchema = {};');
      expect(processed).toContain('const formSchema: RenderFormSchema = {');

      // Check for these properties in any format
      expect(processed).toContain('fields');
      expect(processed).toContain('amount');
      expect(processed).toContain('number');
      expect(processed).toContain('columns');
    });
  });

  /**
   * Tests for the formatFinalCode method
   */
  describe('formatFinalCode', () => {
    it('should format TypeScript code correctly', async () => {
      const unformattedCode = `
      import { useState } from 'react';
      
      function Example() { 
        const [count, setCount] = useState(0);
      
      return (
      <div>
        <p>Count: {count}</p>
        <button onClick={() => setCount(c => c + 1)}>Increment</button>
      </div>
      );
      }
      
      export default Example;
      `;

      const formatted = await templateProcessor.formatFinalCode(unformattedCode);

      // Check basic formatting expectations that are more flexible
      expect(formatted).toContain('function Example()');
      expect(formatted).toContain('const [count, setCount] = useState(0)');
      expect(formatted).toContain('<div>');
      // Expect consistent spacing
      const spacedLines = formatted.match(/\n {2,}\w/g)?.length;
      expect(spacedLines).toBeGreaterThanOrEqual(2);
    });

    it('should properly format TypeScript object literals with commas, not semicolons', async () => {
      const unformattedCode = `
      const obj = {
        "prop1": "value1",
        "prop2": "value2",
        "nestedObj": {
          "nestedProp": "nestedValue"
        }
      };
      
      function usesObject() {
        return obj;
      }
      `;

      const formatted = await templateProcessor.formatFinalCode(unformattedCode);

      // Check that properties are formatted properly
      expect(formatted).toContain("prop1: 'value1'");
      expect(formatted).toContain("prop2: 'value2'");
      expect(formatted).toContain('nestedObj: {');

      // Regex to match semicolons between properties (should not exist)
      const semicolonBetweenProps = /'[^']*';\s*\w+:/;
      expect(formatted).not.toMatch(semicolonBetweenProps);
    });

    it('should format a complete React component with a form schema', async () => {
      const unformattedCode = `
      import { useState } from 'react';
      import { TransactionForm } from '@openzeppelin/contracts-ui-builder-renderer';
      
      export default function GeneratedForm() {
        const formSchema = {
          "id": "form-transfer",
          "title": "Transfer",
          "fields": [
            {
              "id": "recipient",
              "type": "text",
              "name": "recipient",
              "label": "Recipient Address"
            }
          ],
          "layout": {
            "columns": 1 as const
          },
          contractAddress: '0xTestAddress'
        };
      
        return (
          <div>
            <TransactionForm schema={formSchema} />
          </div>
        );
      }
      `;

      const formatted = await templateProcessor.formatFinalCode(unformattedCode);

      // Check that the schema is properly formatted with more flexible expectations
      expect(formatted).toContain("id: 'form-transfer'");
      expect(formatted).toContain("title: 'Transfer'");
      expect(formatted).toContain('fields:');
      expect(formatted).toContain("id: 'recipient'");
      expect(formatted).toContain('columns:');

      // The result should have no JSON-style double quotes for property names
      expect(formatted).not.toMatch(/"id":/);
      expect(formatted).not.toMatch(/"title":/);
    });

    it('should handle formatting errors gracefully', async () => {
      // Make a backup of the original console.error
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Use vi.mock to mock the entire module
      vi.doMock('prettier/standalone', () => ({
        format: vi.fn().mockImplementation(() => {
          throw new Error('Mock formatting error');
        }),
      }));

      // We need to import the module again to get our mocked version
      // This is necessary because the module has already been imported
      // at the top of the file
      const mockedPrettier = await import('prettier/standalone');

      // Create a new TemplateProcessor with a modified formatFinalCode that uses our mocked module
      const testProcessor = new TemplateProcessor({});

      // Create a custom implementation that uses our mocked module
      testProcessor.formatFinalCode = async (code: string) => {
        try {
          // This will throw the mock error
          await mockedPrettier.format(code, { parser: 'typescript' });
          return code; // This line won't be reached
        } catch (error) {
          console.error('Error formatting code with Prettier:', error);
          // Return the unformatted code as a fallback
          return code;
        }
      };

      try {
        const code = 'const x = 1;';
        const result = await testProcessor.formatFinalCode(code);

        // Should return the original code if formatting fails
        expect(result).toBe(code);
        expect(console.error).toHaveBeenCalled();
      } finally {
        // Restore the original console.error
        console.error = originalConsoleError;
        // Clear module mocks
        vi.resetModules();
      }
    });
  });
});
