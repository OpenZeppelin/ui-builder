import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChainType } from '@openzeppelin/transaction-form-types/contracts';
import type { RenderFormSchema } from '@openzeppelin/transaction-form-types/forms';

import { createMinimalContractSchema, createMinimalFormConfig } from '@/export/utils/testConfig';

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
            // Create a simple template structure reflecting the *new* base template
            const baseTemplate: Record<string, string> = {
              'src/App.tsx': '// Base App.tsx placeholder content',
              // The base template now has GeneratedForm.tsx as the placeholder file
              'src/components/GeneratedForm.tsx':
                'export function GeneratedForm() { return <div>Placeholder Content</div>; }',
              'src/main.tsx': '// Base main.tsx placeholder content',
              'package.json': '{"name":"template","dependencies":{}}',
            };

            // Process the template - merge custom files, overwriting base placeholders
            const result = { ...baseTemplate, ...customFiles };

            // No explicit deletion needed anymore - overwriting handles it.

            // Simulate PackageManager update for package.json (as before)
            if (result['package.json']) {
              const packageJson = JSON.parse(result['package.json']);
              packageJson.name = options?.projectName || 'default-test-name';
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
      // Mock getAvailableTemplates and getTemplateFiles if needed by other tests
      getAvailableTemplates: vi.fn().mockResolvedValue(['typescript-react-vite']),
      getTemplateFiles: vi.fn().mockResolvedValue({}), // Simplified mock
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

      const formConfig = createMinimalFormConfig('testFunction', 'evm');
      const contractSchema = createMinimalContractSchema('testFunction', 'evm');

      const generatedCode = await generator.generateFormComponent(
        formConfig,
        contractSchema,
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
      const formConfig = createMinimalFormConfig('transferTokens', 'evm');
      const contractSchema = createMinimalContractSchema('transferTokens', 'evm');

      // Generate the form component
      await generator.generateFormComponent(formConfig, contractSchema, 'evm', 'transferTokens');

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
      const formConfig = createMinimalFormConfig('invalidForm', 'evm');
      const contractSchema = createMinimalContractSchema('invalidForm', 'evm');

      // Attempt to generate form with invalid schema should throw
      await expect(
        generator.generateFormComponent(formConfig, contractSchema, 'evm', 'invalidForm')
      ).rejects.toThrow(/Invalid RenderFormSchema/);
    });
  });

  describe('generateTemplateProject', () => {
    it('should generate a complete project structure based on the template', async () => {
      const generator = new FormCodeGenerator();

      // Create a minimal form config for testing
      const formConfig = createMinimalFormConfig('testFunction', 'evm');
      const contractSchema = createMinimalContractSchema('testFunction', 'evm');

      // Generate a complete project with standard options
      const projectFiles = await generator.generateTemplateProject(
        formConfig,
        contractSchema,
        'evm',
        'testFunction',
        {
          chainType: 'evm',
          projectName: 'test-project',
        }
      );

      // Verify key generated files are present in the project
      expect(Object.keys(projectFiles)).toContain('src/main.tsx');
      expect(Object.keys(projectFiles)).toContain('src/App.tsx');
      expect(Object.keys(projectFiles)).toContain('src/components/GeneratedForm.tsx');
      expect(Object.keys(projectFiles)).toContain('package.json');

      // Verify the content of the generated files (optional, more detailed checks)
      expect(projectFiles['src/main.tsx']).toContain('EvmAdapter');
      expect(projectFiles['src/App.tsx']).toContain('GeneratedForm');
      expect(projectFiles['src/components/GeneratedForm.tsx']).toContain('testFunction');
      expect(projectFiles['src/components/GeneratedForm.tsx']).not.toContain('Placeholder Content'); // Ensure it was overwritten

      // Verify package.json is customized and includes correct adapter dependency
      expect(projectFiles['package.json']).toBeDefined();
      if (projectFiles['package.json']) {
        const packageJson = JSON.parse(projectFiles['package.json']);
        expect(packageJson.name).toBe('test-project');
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
