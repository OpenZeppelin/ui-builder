import { describe, expect, it } from 'vitest';

import { FormCodeGenerator } from '../FormCodeGenerator';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';

/**
 * Unit tests for the FormCodeGenerator class
 */
describe('FormCodeGenerator', () => {
  describe('generateFormComponent', () => {
    it('should generate React component code for a form', () => {
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

      const generatedCode = generator.generateFormComponent(formConfig, 'evm', 'testFunction');

      // Verify the generated code contains expected elements
      expect(generatedCode).toContain('import React, { useState }');
      expect(generatedCode).toContain('import { TransactionForm }');
      expect(generatedCode).toContain('import { EvmAdapter }');
      expect(generatedCode).toContain('export default function GeneratedForm');
      expect(generatedCode).toContain('testFunction');
    });
  });

  describe('generateTemplateProject', () => {
    it('should generate a complete project structure based on the template', () => {
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
      const projectFiles = generator.generateTemplateProject(formConfig, 'evm', 'testFunction', {
        projectName: 'test-project',
      });

      // Verify key files are present in the project
      expect(Object.keys(projectFiles)).toContain('src/components/GeneratedForm.tsx');
      expect(Object.keys(projectFiles)).toContain('src/components/App.tsx');

      // Note: Since we're using a mock/stub TemplateManager in tests,
      // we shouldn't make assumptions about all template files being present.
      // Just verify our generated files and basic structure are there.
      expect(projectFiles).toHaveProperty('src/components/GeneratedForm.tsx');
      expect(projectFiles).toHaveProperty('src/components/App.tsx');

      // Verify App.tsx has been updated to import GeneratedForm
      expect(projectFiles['src/components/App.tsx']).toContain('import { GeneratedForm }');

      // Verify FormPlaceholder.tsx is not present (should be replaced)
      expect(Object.keys(projectFiles)).not.toContain('src/components/FormPlaceholder.tsx');

      // Verify package.json is customized
      if (projectFiles['package.json']) {
        const packageJson = JSON.parse(projectFiles['package.json']);
        expect(packageJson.name).toBe('test-project');
      }
    });
  });
});
