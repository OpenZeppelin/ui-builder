import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Ecosystem } from '@openzeppelin/transaction-form-types';
import type {
  EvmNetworkConfig,
  FormFieldType,
  RenderFormSchema,
} from '@openzeppelin/transaction-form-types';

import { formSchemaFactory } from '../../../core/factories/FormSchemaFactory';
import type { ExportOptions } from '../../../core/types/ExportTypes';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { createMinimalContractSchema, createMinimalFormConfig } from '../../utils/testConfig';
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
          ecosystem: Ecosystem,
          _functionId: string,
          options?: Partial<ExportOptions>
        ) => {
          const packageJson = JSON.parse(originalContent);
          packageJson.name = options?.projectName || 'default-test-name';
          // Simulate adding dependencies based on ecosystem
          packageJson.dependencies = {
            ...(packageJson.dependencies || {}),
            '@openzeppelin/transaction-form-renderer': '^1.0.0',
            '@openzeppelin/transaction-form-types': '^0.1.0',
            [`@openzeppelin/transaction-form-adapter-${ecosystem}`]: '^0.0.1', // Add caret version
          };
          return JSON.stringify(packageJson, null, 2);
        }
      ),
    getDependencies: vi
      .fn()
      .mockImplementation(async (_formConfig: BuilderFormConfig, ecosystem: Ecosystem) => {
        return {
          '@openzeppelin/transaction-form-renderer': '^1.0.0',
          '@openzeppelin/transaction-form-types': '^0.1.0',
          [`@openzeppelin/transaction-form-adapter-${ecosystem}`]: '^0.0.1',
        };
      }),
    getDevDependencies: vi
      .fn()
      .mockImplementation(async (_formConfig: BuilderFormConfig, _ecosystem: Ecosystem) => {
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
                [`@openzeppelin/transaction-form-adapter-${options.ecosystem || 'evm'}`]: '^0.0.1',
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

// Mock TemplateProcessor instance OUTSIDE describe
const mockTemplateProcessor = {
  processTemplate: vi.fn().mockResolvedValue('Processed Template Code'),
  applyCommonPostProcessing: vi.fn((code) => Promise.resolve(code)),
  formatFinalCode: vi.fn((code) => Promise.resolve(code)),
};

// Mock the TemplateProcessor module to use the instance above
vi.mock('../TemplateProcessor', () => ({
  TemplateProcessor: vi.fn(() => mockTemplateProcessor),
}));

// Mock formSchemaFactory used internally by generator
vi.mock('@/core/factories/FormSchemaFactory', () => ({
  formSchemaFactory: {
    builderConfigToRenderSchema: vi.fn((formConfig, title, desc) => ({
      id: `form-${formConfig.functionId}`,
      title: title,
      description: desc || '',
      fields: formConfig.fields.filter((f: FormFieldType) => !f.isHidden),
      layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
      validation: { mode: 'onChange', showErrors: 'inline' },
      submitButton: { text: 'Submit', loadingText: 'Loading...' },
      contractAddress: formConfig.contractAddress,
      defaultValues: {},
      functionId: formConfig.functionId,
      theme: {},
    })),
  },
}));

// Define mock network config
const mockEvmNetworkConfig: EvmNetworkConfig = {
  id: 'test-codegen-evm',
  name: 'Test CodeGen EVM',
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

/**
 * Unit tests for the FormCodeGenerator class
 */
describe('FormCodeGenerator', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply mock implementation if needed, especially if modified in tests
    vi.mocked(formSchemaFactory.builderConfigToRenderSchema).mockImplementation(
      (formConfig, title, desc) => ({
        // Return a minimal valid RenderFormSchema structure
        id: `form-${formConfig.functionId}`,
        title: title,
        description: desc || '',
        fields: formConfig.fields.filter((f: FormFieldType) => !f.isHidden),
        layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
        validation: { mode: 'onChange', showErrors: 'inline' },
        submitButton: { text: 'Submit', loadingText: 'Loading...' },
        contractAddress: formConfig.contractAddress,
        defaultValues: {},
        functionId: formConfig.functionId,
        theme: {},
      })
    );
  });

  describe('generateFormComponent', () => {
    it('should generate React component code for a form', async () => {
      const generator = new FormCodeGenerator();
      const formConfig = createMinimalFormConfig('testFunction', 'evm');
      const contractSchema = createMinimalContractSchema('testFunction', 'evm');

      await generator.generateFormComponent(
        formConfig,
        contractSchema,
        mockEvmNetworkConfig,
        'testFunction'
      );

      // Verify processTemplate called with correct parameters
      expect(mockTemplateProcessor.processTemplate).toHaveBeenCalledWith(
        'form-component',
        expect.objectContaining({
          adapterClassName: 'EvmAdapter',
          adapterPackageName: '@openzeppelin/transaction-form-adapter-evm',
          networkConfigImportName: 'mockEvmNetworkConfig', // From the mock config exportConstName
          functionId: 'testFunction',
          formConfigJSON: expect.any(String),
          contractSchemaJSON: expect.any(String),
          allFieldsConfigJSON: expect.any(String),
          executionConfigJSON: expect.any(String),
          includeDebugMode: false,
        })
      );
    });

    it('should use FormSchemaFactory to transform BuilderFormConfig to RenderFormSchema', async () => {
      const generator = new FormCodeGenerator();
      const funcId = 'transferTokens';
      const formConfig = createMinimalFormConfig(funcId, 'evm');
      const contractSchema = createMinimalContractSchema(funcId, 'evm');
      // Ensure mock functionDetails has a description or displayName for the test
      const functionDetails = contractSchema.functions.find((f) => f.id === funcId);
      if (functionDetails) {
        functionDetails.displayName = 'Transfer Tokens'; // Example display name
        functionDetails.description = ''; // Example: Ensure description is empty for default generation test
      }

      await generator.generateFormComponent(
        formConfig,
        contractSchema,
        mockEvmNetworkConfig,
        funcId
      );

      expect(formSchemaFactory.builderConfigToRenderSchema).toHaveBeenCalledWith(
        formConfig,
        'Transfer Tokens', // Expect title derived from displayName
        `Form for interacting with the Transfer Tokens function.` // Expect generated description
      );
      expect(formSchemaFactory.builderConfigToRenderSchema).toHaveBeenCalledTimes(1);
    });

    it('should throw error when transformed schema is missing required properties', async () => {
      const generator = new FormCodeGenerator();
      const formConfig = createMinimalFormConfig('invalidForm', 'evm');
      const contractSchema = createMinimalContractSchema('invalidForm', 'evm');

      // Override mock to return incomplete schema for this test
      vi.mocked(formSchemaFactory.builderConfigToRenderSchema).mockImplementationOnce(
        () =>
          ({
            id: 'form-invalidForm',
            // title: '', // Missing title
            fields: [],
            layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
            validation: { mode: 'onChange', showErrors: 'inline' },
            contractAddress: '0xtest',
          }) as unknown as RenderFormSchema
      ); // Use 'as any' carefully for testing invalid shapes

      await expect(
        generator.generateFormComponent(
          formConfig,
          contractSchema,
          mockEvmNetworkConfig,
          'invalidForm'
        )
      ).rejects.toThrow('Invalid RenderFormSchema');
    });

    it('should throw error if adapter package name is not found', async () => {
      // ... test logic remains the same ...
    });

    it('should throw error for invalid render schema', async () => {
      const generator = new FormCodeGenerator();
      const formConfig = createMinimalFormConfig('invalidForm', 'evm');
      const contractSchema = createMinimalContractSchema('invalidForm', 'evm');

      const invalidFormConfig = {
        ...formConfig,
        fields: [],
        id: '',
      };

      await expect(
        generator.generateFormComponent(
          invalidFormConfig as BuilderFormConfig, // Use simple cast
          contractSchema,
          mockEvmNetworkConfig,
          'invalidForm'
        )
      ).rejects.toThrow('Invalid RenderFormSchema');
    });
  });

  describe('generateMainTsx', () => {
    it('should generate main.tsx code', async () => {
      const generator = new FormCodeGenerator();
      const code = await generator.generateMainTsx(mockEvmNetworkConfig);
      expect(code).toBeDefined();
      expect(mockTemplateProcessor.processTemplate).toHaveBeenCalledWith(
        'main',
        expect.objectContaining({ adapterClassName: 'EvmAdapter' })
      );
    });
  });

  describe('generateAppComponent', () => {
    it('should generate App.tsx code', async () => {
      const generator = new FormCodeGenerator();
      const code = await generator.generateAppComponent('evm', 'testFunction');
      expect(code).toBeDefined();
      expect(mockTemplateProcessor.processTemplate).toHaveBeenCalledWith(
        'app-component',
        expect.objectContaining({ functionId: 'testFunction' })
      );
    });
  });

  describe('generateTemplateProject', () => {
    it('should generate a complete project structure based on the template', async () => {
      const generator = new FormCodeGenerator();
      const formConfig = createMinimalFormConfig('testFunction', 'evm');
      const contractSchema = createMinimalContractSchema('testFunction', 'evm');

      // generateTemplateProject needs NetworkConfig now
      const projectFiles = await generator.generateTemplateProject(
        formConfig,
        contractSchema,
        mockEvmNetworkConfig, // Pass NetworkConfig
        'testFunction',
        { ecosystem: 'evm', projectName: 'test-project' }
      );
      // ... assertions ...
      expect(projectFiles).toBeDefined();
      expect(Object.keys(projectFiles).length).toBeGreaterThan(0);
    });
  });
});
