import type { RenderFormSchema } from '@form-renderer/types/FormTypes';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formSchemaFactory } from '../../../core/factories/FormSchemaFactory';
import { FormCodeGenerator } from '../FormCodeGenerator';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';

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

      const generatedCode = await generator.generateFormComponent(
        formConfig,
        'evm',
        'testFunction'
      );

      // Verify the generated code contains expected elements
      expect(generatedCode).toContain("import { useState } from 'react'");
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

      // Generate the form component
      await generator.generateFormComponent(formConfig, 'evm', 'transferTokens');

      // Verify that FormSchemaFactory.builderConfigToRenderSchema was called with correct params
      expect(formSchemaFactory.builderConfigToRenderSchema).toHaveBeenCalledWith(
        formConfig,
        'transferTokens',
        ''
      );

      // Verify it was called exactly once
      expect(formSchemaFactory.builderConfigToRenderSchema).toHaveBeenCalledTimes(1);
    });

    it('should throw error when transformed schema is missing required properties', async () => {
      const generator = new FormCodeGenerator();

      // Override mock to return incomplete schema
      vi.spyOn(formSchemaFactory, 'builderConfigToRenderSchema').mockImplementationOnce(() => {
        // Return a deliberately incomplete schema to test validation
        return {
          fields: [],
          layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
          validation: { mode: 'onChange', showErrors: 'inline' },
          theme: {},
          // Missing id, title, and submitButton properties
        } as unknown as RenderFormSchema; // Cast to RenderFormSchema for testing validation
      });

      // Create a minimal form config
      const formConfig: BuilderFormConfig = {
        functionId: 'invalidForm',
        fields: [],
        layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
        validation: { mode: 'onChange', showErrors: 'inline' },
        theme: {},
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

      // Generate a complete project
      const projectFiles = await generator.generateTemplateProject(
        formConfig,
        'evm',
        'testFunction',
        {
          chainType: 'evm',
          projectName: 'test-project',
          includeAdapters: true,
        }
      );

      // Verify key files are present in the project
      expect(Object.keys(projectFiles)).toContain('src/App.tsx');
      expect(Object.keys(projectFiles)).toContain('src/components/GeneratedForm.tsx');

      // Verify adapter files are included
      expect(Object.keys(projectFiles)).toContain('src/adapters/evm/adapter.ts');
      expect(Object.keys(projectFiles)).toContain('src/adapters/index.ts');

      // Note: Since we're using a mock/stub TemplateManager in tests,
      // we shouldn't make assumptions about all template files being present.
      // Just verify our generated files and basic structure are there.
      expect(projectFiles).toHaveProperty('src/App.tsx');
      expect(projectFiles).toHaveProperty('src/components/GeneratedForm.tsx');

      // Verify App.tsx has been updated to import GeneratedForm
      expect(projectFiles['src/App.tsx']).toContain('import GeneratedForm');

      // Verify FormPlaceholder.tsx is not present (should be replaced)
      expect(Object.keys(projectFiles)).not.toContain('src/components/FormPlaceholder.tsx');

      // Verify adapter exports only the EVM adapter
      expect(projectFiles['src/adapters/index.ts']).toContain('EvmAdapter');
      expect(projectFiles['src/adapters/index.ts']).not.toContain('SolanaAdapter');

      // Verify package.json is customized
      if (projectFiles['package.json']) {
        const packageJson = JSON.parse(projectFiles['package.json']);
        expect(packageJson.name).toBe('test-project');
      }
    });

    it('should generate a project without adapters when includeAdapters is false', async () => {
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

      // Generate a project without adapters
      const projectFiles = await generator.generateTemplateProject(
        formConfig,
        'evm',
        'testFunction',
        {
          chainType: 'evm',
          includeAdapters: false,
        }
      );

      // Verify key files are present in the project
      expect(Object.keys(projectFiles)).toContain('src/components/GeneratedForm.tsx');

      // Verify adapter files are NOT included
      expect(Object.keys(projectFiles)).not.toContain('src/adapters/evm/adapter.ts');
      expect(Object.keys(projectFiles)).not.toContain('src/adapters/index.ts');
    });
  });
});
