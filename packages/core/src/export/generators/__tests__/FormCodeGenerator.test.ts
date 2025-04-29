import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChainType } from '@openzeppelin/transaction-form-types/contracts';
import type { RenderFormSchema } from '@openzeppelin/transaction-form-types/forms';

import { formSchemaFactory } from '../../../core/factories/FormSchemaFactory';
import type { ExportOptions } from '../../../core/types/ExportTypes';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { FormCodeGenerator } from '../FormCodeGenerator';

// Mock adapterRegistry before other imports that might use it indirectly
vi.mock('../../../core/adapterRegistry', () => {
  const adapterPackageMap = {
    evm: '@openzeppelin/transaction-form-adapter-evm',
    solana: '@openzeppelin/transaction-form-adapter-solana',
    // Add other real chains if needed by tests
  };

  return {
    adapterPackageMap,
    getAdapter: vi.fn(), // Mock implementation not needed for this test file
  };
});

// Mock the PackageManager module
vi.mock('../../PackageManager', () => {
  // Mock implementation
  const MockPackageManager = vi.fn().mockImplementation(() => ({
    // Mock methods used by FormCodeGenerator -> generateTemplateProject
    updatePackageJson: vi
      .fn()
      .mockImplementation(
        async (
          originalContent: string,
          _formConfig: BuilderFormConfig,
          chainType: ChainType,
          _functionId: string,
          options?: Partial<ExportOptions>
        ) => {
          const packageJson = JSON.parse(originalContent);
          packageJson.name = options?.projectName || 'default-test-name';
          // Simulate adding dependencies based on chainType
          packageJson.dependencies = {
            ...(packageJson.dependencies || {}),
            '@openzeppelin/transaction-form-renderer': '^1.0.0',
            '@openzeppelin/transaction-form-types': '^0.1.0',
            [`@openzeppelin/transaction-form-adapter-${chainType}`]: '^0.0.1', // Add caret version
          };
          return JSON.stringify(packageJson, null, 2);
        }
      ),
    getDependencies: vi
      .fn()
      .mockImplementation(async (_formConfig: BuilderFormConfig, chainType: ChainType) => {
        return {
          '@openzeppelin/transaction-form-renderer': '^1.0.0',
          '@openzeppelin/transaction-form-types': '^0.1.0',
          [`@openzeppelin/transaction-form-adapter-${chainType}`]: '^0.0.1',
        };
      }),
    getDevDependencies: vi
      .fn()
      .mockImplementation(async (_formConfig: BuilderFormConfig, _chainType: ChainType) => {
        return {};
      }),
  }));
  return { PackageManager: MockPackageManager };
});

// Mock TemplateManager to ensure it uses the mock PackageManager
vi.mock('../../TemplateManager', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../TemplateManager')>();
  return {
    ...original,
    TemplateManager: vi.fn().mockImplementation(() => ({
      createProject: vi
        .fn()
        .mockImplementation(
          async (
            _templateName: string,
            customFiles: Record<string, string>,
            options: Partial<ExportOptions>
          ) => {
            // Create a simple template structure with the required files
            const baseTemplate: Record<string, string> = {
              'src/App.tsx':
                'import GeneratedForm from "./components/GeneratedForm";\nexport default function App() { return <GeneratedForm />; }',
              'src/components/FormPlaceholder.tsx':
                'export default function FormPlaceholder() { return <div>Placeholder</div>; }',
              'package.json': '{"name":"template","dependencies":{}}',
            };

            // Process the template - remove placeholders and add custom files
            const result = { ...baseTemplate, ...customFiles };

            // Remove the placeholder file if it's replaced by a custom file
            if (
              customFiles['src/components/GeneratedForm.tsx'] &&
              'src/components/FormPlaceholder.tsx' in result
            ) {
              delete result['src/components/FormPlaceholder.tsx'];
            }

            if (result['package.json']) {
              // Extract the form data from the customFiles
              // In a real scenario, FormCodeGenerator would pass the form config and functionId
              // to the TemplateManager's createProject method via the FormCodeGenerator.generateTemplateProject
              // We just need to simulate that the TemplateManager is using the PackageManager correctly

              const packageJson = JSON.parse(result['package.json']);
              packageJson.name = options?.projectName || 'default-test-name';
              // Simulate adding dependencies based on chainType
              packageJson.dependencies = {
                ...(packageJson.dependencies || {}),
                '@openzeppelin/transaction-form-renderer': '^1.0.0',
                '@openzeppelin/transaction-form-types': '^0.1.0',
                [`@openzeppelin/transaction-form-adapter-${options.chainType || 'evm'}`]: '^0.0.1',
              };
              result['package.json'] = JSON.stringify(packageJson, null, 2);
            }

            return result;
          }
        ),
    })),
  };
});

/**
 * Unit tests for the FormCodeGenerator class
 */
describe('FormCodeGenerator', () => {
  // Mock the formSchemaFactory
  beforeEach(() => {
    vi.spyOn(formSchemaFactory, 'builderConfigToRenderSchema').mockImplementation(
      (formConfig, functionName) => {
        return {
          ...formConfig,
          id: `form-${formConfig.functionId}`,
          title: functionName,
          description: '',
          submitButton: {
            text: `Execute ${functionName}`,
            loadingText: 'Processing...',
            variant: 'primary',
          },
          defaultValues: {},
          layout: {
            columns: 1 as const,
            spacing: 'normal' as const,
            labelPosition: 'top' as const,
          },
          contractAddress: '0xTestAddress',
        };
      }
    );
  });

  describe('generateFormComponent', () => {
    it('should generate React component code for a form', async () => {
      const generator = new FormCodeGenerator();

      // Create a minimal form config for testing
      const formConfig: BuilderFormConfig = {
        functionId: 'testFunction',
        fields: [
          {
            id: 'param1',
            name: 'param1',
            label: 'Parameter 1',
            type: 'text',
            validation: {
              required: true,
            },
          },
        ],
        layout: {
          columns: 1 as const,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        validation: {
          mode: 'onChange',
          showErrors: 'inline',
        },
        theme: {},
        contractAddress: '0xTestAddress',
      };

      const generatedCode = await generator.generateFormComponent(
        formConfig,
        'evm',
        'testFunction'
      );

      // Verify the generated code contains expected elements
      expect(
        generatedCode.includes("import { useState } from 'react'") ||
          generatedCode.includes("import { useEffect, useState } from 'react'") ||
          generatedCode.includes("import { useEffect, useMemo, useState } from 'react'")
      ).toBe(true);
      expect(generatedCode).toContain('TransactionForm');
      expect(generatedCode).toContain('EvmAdapter');
      expect(generatedCode).toContain('export default function GeneratedForm');
      expect(generatedCode).toContain('testFunction');
    });

    it('should use FormSchemaFactory to transform BuilderFormConfig to RenderFormSchema', async () => {
      const generator = new FormCodeGenerator();

      // Create a minimal form config for testing
      const formConfig: BuilderFormConfig = {
        functionId: 'transferTokens',
        fields: [
          {
            id: 'param1',
            name: 'param1',
            label: 'Parameter 1',
            type: 'text',
            validation: {
              required: true,
            },
          },
        ],
        layout: {
          columns: 1 as const,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        validation: {
          mode: 'onChange',
          showErrors: 'inline',
        },
        theme: {},
        contractAddress: '0xTestAddress',
      };

      // Generate the form component
      await generator.generateFormComponent(formConfig, 'evm', 'transferTokens');

      // Verify that FormSchemaFactory.builderConfigToRenderSchema was called with correct params
      expect(formSchemaFactory.builderConfigToRenderSchema).toHaveBeenCalledWith(
        formConfig,
        'transferTokens',
        'Form for interacting with the transferTokens function.'
      );

      // Verify it was called exactly once
      expect(formSchemaFactory.builderConfigToRenderSchema).toHaveBeenCalledTimes(1);
    });

    it('should throw error when transformed schema is missing required properties', async () => {
      const generator = new FormCodeGenerator();

      // Override mock to return incomplete schema
      vi.spyOn(formSchemaFactory, 'builderConfigToRenderSchema').mockImplementationOnce((() => {
        return {
          fields: [],
          layout: {
            columns: 1,
            spacing: 'normal',
            labelPosition: 'top',
          },
          validation: { mode: 'onChange', showErrors: 'inline' },
          theme: {},
          // intentionally missing id, title, and submitButton to test validation
          contractAddress: '0xTestAddress',
        };
      }) as unknown as (
        builderConfig: BuilderFormConfig,
        functionName: string,
        functionDescription?: string
      ) => RenderFormSchema);

      // Create a minimal form config
      const formConfig: BuilderFormConfig = {
        functionId: 'invalidForm',
        fields: [],
        layout: { columns: 1 as const, spacing: 'normal' as const, labelPosition: 'top' as const },
        validation: { mode: 'onChange', showErrors: 'inline' },
        theme: {},
        contractAddress: '0xTestAddress',
      };

      // Attempt to generate form with invalid schema should throw
      await expect(
        generator.generateFormComponent(formConfig, 'evm', 'invalidForm')
      ).rejects.toThrow(/Invalid RenderFormSchema/);
    });
  });

  describe('generateTemplateProject', () => {
    it('should generate a complete project structure based on the template', async () => {
      const generator = new FormCodeGenerator();

      // Create a minimal form config for testing
      const formConfig: BuilderFormConfig = {
        functionId: 'testFunction',
        fields: [
          {
            id: 'param1',
            name: 'param1',
            label: 'Parameter 1',
            type: 'text',
            validation: {
              required: true,
            },
          },
        ],
        layout: {
          columns: 1 as const,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        validation: {
          mode: 'onChange',
          showErrors: 'inline',
        },
        theme: {},
        contractAddress: '0xTestAddress',
      };

      // Generate a complete project with standard options
      const projectFiles = await generator.generateTemplateProject(
        formConfig,
        'evm',
        'testFunction',
        {
          chainType: 'evm',
          projectName: 'test-project',
        }
      );

      // Verify key files are present in the project
      expect(Object.keys(projectFiles)).toContain('src/App.tsx');
      expect(Object.keys(projectFiles)).toContain('src/components/GeneratedForm.tsx');
      expect(Object.keys(projectFiles)).toContain('package.json');

      // Note: Since we're using a mock/stub TemplateManager in tests,
      // we shouldn't make assumptions about all template files being present.
      // Just verify our generated files and basic structure are there.
      expect(projectFiles).toHaveProperty('src/App.tsx');
      expect(projectFiles).toHaveProperty('src/components/GeneratedForm.tsx');

      // Verify App.tsx has been updated to import GeneratedForm
      expect(projectFiles['src/App.tsx']).toContain('import GeneratedForm');

      // Verify FormPlaceholder.tsx is not present (should be replaced)
      expect(Object.keys(projectFiles)).not.toContain('src/components/FormPlaceholder.tsx');

      // Verify package.json is customized and includes correct adapter dependency
      expect(projectFiles['package.json']).toBeDefined();
      if (projectFiles['package.json']) {
        const packageJson = JSON.parse(projectFiles['package.json']);
        expect(packageJson.name).toBe('test-project');
        // Check presence and expect caret versions (default export env)
        expect(packageJson.dependencies).toHaveProperty(
          '@openzeppelin/transaction-form-adapter-evm',
          expect.stringMatching(/^\^/)
        );
        expect(packageJson.dependencies).toHaveProperty(
          '@openzeppelin/transaction-form-types',
          expect.stringMatching(/^\^/)
        );
        expect(packageJson.dependencies).toHaveProperty(
          '@openzeppelin/transaction-form-renderer',
          expect.stringMatching(/^\^/)
        );
      }
    });
  });
});
